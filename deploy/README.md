# 后端启动入口（deploy/）

> 本目录**不含编排文件、不含镜像、不做版本锁**。数字孪生后端的权威编排在同级仓库 `meta-web-three`，这里只提供一个复用它的启动脚本。
>
> 此前这里有一份 7 服务、只写 `image:` 的发布编排骨架（引用 `0.0.0-dev` 占位镜像）。它要求先做 CI 镜像发布才能启动，与主仓库已有的一键编排重复，因此已移除。按「纯本地工厂、不上云」的决定，当前不需要 GHCR、语义版本 tag 或兼容矩阵；日后若出现「给不提供源码的现场交付 Electron 安装包 + 离线镜像包」的场景，再单独补发布编排。

## 两个仓库同级放置

```
workspace/project/
├── meta-note/          ← 本仓库（Electron 客户端）
└── meta-web-three/     ← 后端源码 + 权威 compose + .env
```

不需要 git submodule，不把 `server/` 源码搬进本仓库，也不复制任何 compose 文件。脚本通过 `../../meta-web-three` 找到后端仓库；位置不同时用 `SERVER_REPO=/path/to/meta-web-three ./start-backend.sh up` 覆盖。

Compose 以**第一个 compose 文件所在目录**为 project directory，所以从本目录执行时，`build: context: .`、`./sql`、`./.aws` 等相对路径以及主仓库的 `.env` 全部按 `meta-web-three/` 解析（已静态验证）。本机 WSL2 镜像模式需要的高位端口（`ZOOKEEPER_PORT=22181`、`POSTGRES_PORT=25432`、`REDIS_PORT=26379` 等）继续由主仓库 `.env` 提供，本目录不放第二份 `.env`，避免两套配置漂移。

## 用法

```bash
cd deploy
./start-backend.sh config     # 只静态展开，不启动任何容器
./start-backend.sh up         # 启动
./start-backend.sh ps         # 查看 7 个容器状态
./start-backend.sh logs       # 跟踪 3 个 Java 服务日志
./start-backend.sh stop       # 停止这 7 个容器
```

`up` 只把 3 个服务名交给 compose：

```bash
docker compose -f docker-compose.yml -f docker-compose.digital-twin.yml \
  up -d gateway factory-service mall-user-service
```

`depends_on` 闭包自动带出 4 个中间件，最终恰好 7 个容器：

| 类别 | 服务 | 作用 |
|---|---|---|
| Java | `gateway` | 唯一入口 `:10081`，验 JWT、签 `X-Internal-Token`、经 zk 发现服务 |
| Java | `factory-service` | 数字孪生业务，不暴露宿主端口 |
| Java | `mall-user-service` | 登录 / `refreshToken` / 预置管理员 / 签发 JWT |
| 中间件 | `zookeeper` | 服务注册发现（`lb:ws://factory-service`） |
| 中间件 | `postgres` | 账号表、业务表、quartz |
| 中间件 | `redis` | refresh token 与黑名单 |
| 中间件 | `kafka` | `digital-twin.*` 事件订阅 |

`gateway` 的 `10081` 是**唯一对宿主发布的端口**：主仓库 `docker-compose.server.yml` 里只有 gateway 保留 `ports:`，其余 13 个 Java 服务都改为 `expose:`，仅在 compose 网络内可见。客户端统一经网关访问（`gateway-client.ts` / `gateway-token.ts` 固定走 10081），网关再按 zk 服务发现转发到 `factory-service:10101`、`mall-user-service:10083` 等容器内端口。调试时要直连某个服务，请进容器或用 `docker compose exec`，不要再给服务加 `ports:` 宿主映射。

三个 Java 服务由 `docker-compose.digital-twin.yml` 统一切到 `prod`，读取 `application-common-prod.yml` 的 `${VAR:-...}` 存储配置；dev profile 里的 `192.168.1.194` 只在开发时生效。

## 配置位置

全部在 `meta-web-three/.env`（模板 `.env.example`），本仓库不重复声明：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/metawebthree` | prod 专用，dev 不受影响 |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `admin` / `123123` | postgres 容器与三个 Java 服务共用，避免漂移 |
| `REDIS_PASSWORD` | `123123` | redis 容器与三个 Java 服务共用 |
| `INTERNAL_TOKEN_SECRET` | `mwt-internal-secret-2024` | gateway 签发、factory-service 校验，必须一致 |
| `JWT_SECRET` | `application-common.yml` 内默认值 | 签发方与验签方必须一致 |

`stop` 只停这 7 个容器，**不会**执行 `docker compose down`（那会移除整个 30 服务 project，包括为其他工作启动的容器）。

## 首次初始化的坑

`docker-compose.env.yml` 里 `POSTGRES_DB: postgres` 是写死的，容器只自动建 `postgres` 库；而 prod 的 `DATASOURCE_URL` 默认指向 `metawebthree` 库。所以首次启动前二选一：

1. 在 `meta-web-three/` 跑 `sql/init_db.sh` 建 `metawebthree` 库并导 schema（脚本用 `POSTGRES_HOST` / `POSTGRES_PORT` 连接，本机端口要与 `.env` 的映射一致）；
2. 或在 `.env` 里把 `DATASOURCE_URL` 改成 `jdbc:postgresql://postgres:5432/postgres`，再另行导入表结构。

之后用默认管理员经网关注册数字孪生专用账号，或在客户端侧执行 `yarn bootstrap:gateway-account`；`GATEWAY_TOKEN` 只是应急静态覆盖，不是标准路径。

## 前提与边界

- 需要 Docker Desktop 可用、两个仓库都在本机、主仓库源码完整（首次 `up` 会按 `server/Dockerfile` 构建 3 个镜像）。
- 主仓库的 `run-all.sh` = `run-env.sh`（14 个中间件容器）+ `run-server.sh`（14 个 Java 进程），是**全量**启动入口；本脚本只起数字孪生需要的 7 个容器。
- 当前不做 CI 镜像发布、不做 springdoc 契约导出、不运行任何测试或 CI。
