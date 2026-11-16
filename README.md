# meta-note元笔记

AI 驱动的数字孪生与知识问答应用。

## 架构概览

```
meta-note (本仓库)  ── 纯本地工厂的 Electron 桌面端
├── system-management   桌面客户端 (React + Electron + NestJS)
└── system-support      Rust / NAPI-RS 原生模块

配套后端（不在本仓库，位于 meta-web-three 的 server/）
├── gateway                        统一入口（:10081，JWT 校验 + zk 服务发现）
└── factory-domain/factory-service  工厂服务（含数字孪生）(Spring Boot，不对宿主暴露端口)

客户端只能通过 gateway:10081/factory-service/** 访问后端，禁止直连 factory-service。
```

> 本仓库已从 monorepo 独立出来，只包含桌面客户端与原生模块。`server/`（gateway / factory-service）、`apps/backstage-admin` 以及根 compose / k8s 编排仍留在原 `meta-web-three` 仓库，需另行启动；所有跨服务通讯一律经 gateway 校验 JWT。唯一的交付形态是 Electron 桌面端：仓库内不含 Web 版静态托管、nginx 镜像、第二套 compose 或 k8s 前端部署资产，也不在 `meta-web-three` 里提交本仓库内容。

## 接口契约与同步机制

本仓库只交付 Electron 桌面端，唯一的对外调用路径是 `gateway:10081/factory-service/**`。后端服务、共享的 OpenAPI 生成脚本（`apps/tools/`）和编排都位于同级仓库 `meta-web-three`；本仓库**有意不生成接口客户端**，也不入库 spec 快照或任何生成产物，客户端封装全部手写维护。路线选择的证据与理由见本仓库 [`TODO.md`](TODO.md) 的决策记录，具体目录与操作步骤见 [`system-management/README.md`](system-management/README.md) 的「API 客户端：有意不生成」。

跨仓库契约的同步流程：后端 controller 是单一事实来源；端点变更时对照 controller 更新 `system-management/src/renderer/services/clients/**` 的路径、请求体与类型，同步更新客户端 README 的口径表，跑 `npm run typecheck` 与 `npm run test:run`，并在提交信息 / PR 描述中注明对应的后端仓库 commit 或分支。涉及 JWT、内部令牌或 WebSocket 事件类型的变更，还需复核 `gateway-client.ts` 与 `gateway-token.ts`。

CI 只跑原生模块构建、`npm run typecheck` 和 `npm run test:run`：**不启动后端、不下载 spec、不执行任何代码生成**，因此全新检出无需联网契约源即可通过检查。

## 目录说明

### `system-management/` — 桌面客户端

Electron 桌面应用，提供 AI 问答、语音交互、数字孪生 3D 场景。

| 功能 | 技术栈 | 状态 |
|------|--------|------|
| AI 问答（基于项目数据） | Local LLM Provider + RAG | 完成 |
| 语音 ASR/TTS | 麦克风捕获 + XTTS-v2 | 完成 |
| 3D 场景编辑器 | Three.js / @react-three/fiber | 完成 |
| **数字孪生工厂** | Three.js + REST API + WebSocket | **需 gateway + factory-service 配合** |

AI 问答对接 [Local LLM Provider](https://github.com/lotaway/local-llm-provider)，利用当前项目数据（文档、代码、知识库）进行检索增强生成（RAG）式回答。

**启动方式：**
```bash
cd system-management
yarn install
yarn dev            # 开发模式 (Vite + Electron)
```

### `system-support/` — Rust 原生模块

为桌面端提供音视频采集、编码和传输支持（N-API）。

```bash
cd system-support
cargo build --release
```

### `server/factory-domain/factory-service/` — 工厂服务（含数字孪生）

Spring Boot 微服务，提供数字孪生工厂 REST API + WebSocket 实时推送。

以下端点是 **factory-service 内部路径**；客户端一律通过 `http://localhost:10081/factory-service` 前缀访问，并携带 `Authorization: Bearer <jwt>`。gateway 经 zk 解析服务后剥离 `/factory-service` 前缀再转发。JWT 由 Electron 主进程用数字孪生专用管理员账号经 `POST /mall-user-service/admin/login` 取得，并在过期前通过 `/admin/refreshToken` 刷新；该账号由配套后端的默认管理员（或 `yarn bootstrap:gateway-account`）创建，详见 `system-management/README.md`。`GATEWAY_TOKEN` 仅为应急静态覆盖，不是标准路径。

| 端点（gateway 前缀之后） | 说明 |
|------|------|
| `GET /api/digital-twin/devices` | 设备列表 |
| `GET /api/digital-twin/alerts/active` | 活跃告警 |
| `GET /api/digital-twin/stats/summary` | 统计摘要 |
| `POST /api/digital-twin/alert/{id}/acknowledge` | 确认告警 |
| `POST /api/digital-twin/alert/{id}/resolve` | 解决告警 |
| `GET /api/alert-rules`、`/api/mes/scada/*`、`/api/mes/trace/*` | 告警规则、SCADA 与追溯 |
| `ws://localhost:10081/factory-service/ws/digital-twin?token=<jwt>` | WebSocket 实时推送（握手 JWT 走 query，网关校验后剥离） |

WebSocket 事件：`DEVICE_STATUS_CHANGED`、`DEVICE_POSITION_UPDATED`、`PRODUCTION_OUTPUT_UPDATED`、`ALERT_CREATED`

**启动方式：** 该服务不在本仓库内，需在原 `meta-web-three` 仓库的 `server/` 目录执行：

```bash
cd server
mvn clean package -pl factory-domain/factory-service -am -DskipTests
java -jar factory-domain/factory-service/target/factory-service-1.0.0.jar --spring.profiles.active=dev
```

## CI

`.github/workflows/system-management-check.yml` 在 push / PR 且改动涉及 `system-management/`、`system-support/` 或 workflow 自身时运行：安装原生构建依赖 → `npm install --legacy-peer-deps` → `npm run build:native`（生成 `native/index.d.ts`）→ `npm run typecheck` → `npm run test:run`。runner 固定为 `ubuntu-24.04`，使用 Node 20 与 stable Rust；仓库不入库 lockfile，因此关闭依赖缓存。后端服务不在本仓库，CI 不启动 gateway / factory-service，也不执行需要图形环境与可用后端的 Playwright e2e。

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 33 + Vite 5 |
| 前端渲染 | React 19 + TypeScript + Styled-Components |
| 3D 场景 | Three.js + @react-three/fiber + @react-three/drei |
| AI 推理 | [Local LLM Provider](https://github.com/lotaway/local-llm-provider) |
| 后端 (主进程) | NestJS 11 |
| 后端 (微服务) | Spring Boot 3 + Java 17 |
| 数据库 | SQLite (桌面端) / InfluxDB + Redis (服务端) |
| 消息队列 | Kafka |
| 原生模块 | Rust (napi-rs) |
| 构建工具 | Maven (Java) / Vite (前端) / Cargo (Rust) |
