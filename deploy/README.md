# 发布编排（deploy/）

> **当前状态：骨架，尚不能 `docker compose up`。** 三个 `0.0.0-dev` 镜像 tag 是占位符，`meta-web-three` 的 CI 还没有发布任何后端镜像。本目录先把部署契约、变量清单与版本锁的位置固定下来，镜像发布后只需在 `.env` 里填真实 tag。

## 为什么放在 meta-note 而不是 meta-web-three

| | 本目录 `deploy/` | `meta-web-three/docker-compose.digital-twin.yml` |
|---|---|---|
| 定位 | **发布编排**：现场部署用的交付契约 | **开发编排**：从源码构建、本地联调 |
| 服务来源 | 只写 `image:`，引用已发布的版本化镜像 | 全部 `build: context: .` + `server/Dockerfile --target` |
| 归属 | 交付仓库，跟着 Electron 客户端版本走 | 后端源码仓库，跟着 `server/` 源码走 |
| 现场是否需要源码 | 不需要 | 需要 clone 整个 monorepo 并编译 |

理由：现场拿到的是「Electron 安装包 + 一份编排 + 镜像包」，版本锁与兼容矩阵必须绑定客户端版本；后端 CI 负责**生产制品**，客户端仓库负责**声明消费哪个版本**。两者是制品依赖，不是源码依赖，因此不需要 git submodule，也不把 `server/` 源码搬进本仓库。两份编排职责不同，可以长期并存。

## 最小可运行集

上一轮核查的结论：数字孪生不是「gateway + factory-service」两个服务就能跑起来的。

| 类别 | 组件 | 作用 |
|---|---|---|
| Java 服务 | `gateway` | 唯一入口 `:10081`，验 JWT、签 `X-Internal-Token`、经 zk 发现服务 |
| Java 服务 | `factory-service` | 数字孪生业务，不暴露宿主端口 |
| Java 服务 | `mall-user-service` | 登录 / `refreshToken` / 注册专用账号、签发 JWT、预置默认管理员 |
| 中间件 | `zookeeper` | 服务注册发现（`lb:ws://factory-service`） |
| 中间件 | `postgres` | 账号表、业务表、quartz |
| 中间件 | `redis` | refresh token 与黑名单 |
| 中间件 | `kafka` | `digital-twin.*` 事件订阅 |

只有 `gateway` 的 `10081` 对宿主暴露；其余服务与中间件都在 `factory-net` 内，客户端无法绕过网关直连。

## 文件

| 文件 | 用途 |
|---|---|
| `docker-compose.yml` | 发布编排本体，全部 `image:`，不含 `build:` |
| `.env.example` | 全部可覆盖变量的清单与默认值说明（入库） |
| `.env` | 现场实际取值，含密钥与镜像 tag（被 `.gitignore` 忽略，不入库） |
| 本文件 | 部署契约、版本兼容矩阵、启动与离线交付步骤 |

## 版本兼容矩阵

镜像发布后在此登记，一行对应一次可交付组合；回滚时把 `.env` 的 tag 改回上一行即可。

| 客户端版本 | gateway | factory-service | mall-user-service | 契约版本 | 备注 |
|---|---|---|---|---|---|
| 待定 | `0.0.0-dev` | `0.0.0-dev` | `0.0.0-dev` | 未导出 | 占位，不可部署 |

## 启动步骤（镜像发布后）

```bash
cd deploy
cp .env.example .env
# 1. 填 GATEWAY_IMAGE / FACTORY_SERVICE_IMAGE / MALL_USER_SERVICE_IMAGE
# 2. 替换 JWT_SECRET / INTERNAL_TOKEN_SECRET / POSTGRES_PASSWORD / REDIS_PASSWORD
docker compose config          # 先静态展开核对
docker compose up -d
docker compose ps
```

### 首次初始化

1. `POSTGRES_DB` 默认 `metawebthree`，容器启动时会自动建库；`DATASOURCE_URL` 也指向同一个库，两者必须一致。表结构与初始化数据按 `meta-web-three/sql/` 下的脚本导入（自动迁移口径待后端 CI 发布时确认）。
2. 用 `meta-web-three` 的默认管理员经网关注册数字孪生专用账号，或在客户端侧执行 `yarn bootstrap:gateway-account`，然后把同一组 `GATEWAY_SERVICE_ACCOUNT_USERNAME` / `_PASSWORD` 配给 Electron 主进程。`GATEWAY_TOKEN` 只是应急静态覆盖，不是标准路径。

### 密钥一致性清单

| 变量 | 必须一致的范围 | 不一致的后果 |
|---|---|---|
| `JWT_SECRET` | gateway、factory-service、mall-user-service | 签发方与验签方不匹配，所有请求 401 |
| `INTERNAL_TOKEN_SECRET` | gateway（签名）、factory-service（校验） | REST 与 WS 握手被拒 |
| `POSTGRES_PASSWORD` / `DATASOURCE_PASSWORD` | postgres 容器与三个 Java 服务 | 连不上库 |
| `REDIS_PASSWORD` | redis 容器与三个 Java 服务 | refresh token / 黑名单失效 |

这三个 Java 服务统一走 `SPRING_PROFILES_ACTIVE=prod`，读取 `application-common-prod.yml` 里以 `${VAR:-...}` 声明的存储配置；dev profile 的硬编码 LAN 地址只在开发编排里生效，不会进入现场部署。

## 离线交付（本地工厂、不依赖云端）

registry 只用于构建期发布制品，现场运行时不依赖任何公网服务：

```bash
# 有网络的构建机
docker save <gateway-image> <factory-image> <mall-user-image> \
  | gzip > factory-images.tar.gz

# 现场内网
docker load < factory-images.tar.gz
# 把 .env 里的三个 *_IMAGE 改成本地 tag 后照常 docker compose up -d
```

交付物 = Electron 安装包 + `deploy/` 目录 + 镜像包，工厂内网无需 GitHub、无需 registry、无需 Maven 编译。

## 下一步

1. `meta-web-three` CI 增加 `gateway` / `factory-service` / `mall-user-service` 三个 target 的镜像发布（registry 或 `docker save` artifact），并把 tag 填入上面的兼容矩阵。
2. springdoc 导出 OpenAPI 与 WS 事件 schema 作为版本化契约，客户端生成代码到 `.gitignore` 覆盖的目录（生成物不入库）。
3. 确认 `INTERNAL_TOKEN_SECRET` 是否也要注入 `mall-user-service`：目前它 `internal-token.enabled=false`，不影响链路，若日后打开校验必须同步注入。
