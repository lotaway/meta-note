# meta-note元笔记

这是一个基于 Electron + React + TypeScript + Vite 构建的桌面应用。

## Environment Configuration

The application uses environment variables for configuration.

### 1. Setup Environment File

```bash
cp .env.example .env
```

### 2. Configure Voice API

Edit `.env` and set the voice service endpoint:

```bash
VITE_VOICE_API_URL=http://localhost:8000
```

### 3. Port reference

This desktop app binds or calls the following ports. All are loopback-only unless noted. This is the single port table for desktop-local services; the gateway port is shared with the `meta-web-three` backend.

| Port | Service | Config key / default | Notes |
|---|---|---|---|
| `10081` | gateway | `VITE_GATEWAY_URL` / `_HOST` / `_PORT` | Shared with `meta-web-three`; the only route to `server/`. See Cross-service access below. |
| `5050` | local WebSocket server | `WEBSOCKET_PORT` | Desktop-local; defined but currently not wired to a business caller (see TODO task 8). |
| `5051` | in-app HTTP API + SSE | `WEB_SERVER_PORT` | Electron main process, loopback-only, session token required. |
| `5173` | Vite dev server | `DEV_SERVER_PORT` | Development mode only. |
| `8000` | voice API (`/voice/to/text`) | `VITE_VOICE_API_URL` | Front-end voice service URL. |
| `8080` | embedded llama-server | hardcoded in `local-llm-provider.ts` | Serves `/health` `/completion` `/embedding` on `127.0.0.1`. |
| `8081` | Whisper-compatible transcription | `WHISPER_URL` | `POST /v1/audio/transcriptions`. Was `8080` but moved to avoid colliding with llama-server. |

`8080` and `8081` must stay different: the embedded llama-server owns `8080`, so the transcription endpoint defaults to `8081`. Changing either default requires updating `.env.example`, the code default and this table together.

The ports `10101` / `8082` / `8080` mentioned under Cross-service access belong to backend services in `meta-web-three` and are **never** configured or called directly here — the `8080` there refers to a backend service port, not the local llama-server. Everything under `server/` is reached through `gateway:10081`.

## Cross-service access: gateway + JWT

Everything under `server/` (digital-twin REST, alert rules, MES/SCADA/traceability and the digital-twin WebSocket) is reached **only** through `gateway:10081`. Direct calls to `factory-service:10101` / `:8082` / `:8080` are not used anywhere in the renderer.

| Item | Value |
|---|---|
| REST base | `http://localhost:10081/factory-service` (`VITE_GATEWAY_URL` / `_HOST` / `_PORT`) |
| WebSocket | `ws://localhost:10081/factory-service/ws/digital-twin` |
| Credential | A dedicated admin account (`GATEWAY_SERVICE_ACCOUNT_USERNAME` / `_PASSWORD`) in `.env`; the main process obtains a JWT through the gateway |
| REST auth | `Authorization: Bearer <jwt>` attached by `services/gateway-client.ts` |
| WS auth | `?token=<jwt>` on the handshake (browsers cannot set headers); `UserAuthFilter` validates it and strips the parameter before proxying |
| Service discovery | `discovery.locator` resolves `factory-service` through zookeeper |
| Downstream trust | `UserAuthFilter` injects `X-User-Id` / `X-User-Role` / `X-Internal-Token`; REST is checked by `InternalTokenFilter`, WS by the handshake interceptor |

### Service account and token lifecycle

The platform design is that the seeded default administrator creates additional admin accounts: `POST /mall-user-service/admin/register` requires `X-User-Role: ADMIN`, a header the gateway injects only after validating an administrator JWT. `backstage-admin` does this through its UI; this app uses an equivalent one-off script:

```bash
# .env: BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_PASSWORD = the default administrator
#       GATEWAY_SERVICE_ACCOUNT_USERNAME / _PASSWORD = the new machine account
yarn bootstrap:gateway-account   # or: npm run bootstrap:gateway-account
```

The script calls login -> list (idempotency check) -> register -> optional role assignment, all through `gateway:10081`; it never contacts `mall-user-service` directly and never handles the JWT signing secret. Then set the same service-account username/password in `.env` and leave `GATEWAY_TOKEN` unset.

At runtime `src/main/gateway-token.ts` owns the JWT: it logs in on first use, calls `POST /mall-user-service/admin/refreshToken` before expiry (platform JWTs last 30 days), re-logins after a 401, and exposes only the named `getGatewayToken` / `invalidateGatewayToken` preload methods. Credentials and tokens never enter the renderer bundle. `GATEWAY_TOKEN` remains as a break-glass static override; a pasted JWT must be rotated manually and is not the standard path.

The internal token is HMAC-based, has a 5-second validity and is regenerated per request, so a caller that bypasses the gateway cannot forge a REST call or a WS handshake. `factory-service` enables the REST-side check with `internal-token.enabled=true`; `INTERNAL_TOKEN_SECRET` must match between the gateway and factory-service.

The server side lives in the separate `meta-web-three` repository. From that repository's root, start gateway + zookeeper plus the digital-twin overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.digital-twin.yml up -d factory-service
```

`docker-compose.digital-twin.yml` publishes **no** host port for factory-service; only `10081` is exposed.

This repository has no Web deployment: the only delivery form is the Electron desktop app. There is no nginx / static-hosting build, no frontend container image and no k8s manifest; the renderer relies on `window.desktop` local capabilities and cannot run as a standalone browser page.

## API 客户端：有意不生成

本仓库**不引入 OpenAPI 代码生成**（2026-11-16 的路线 B 决定，理由见仓库根 `TODO.md` 的决策记录）。网关侧的 spec 依赖后端全部服务在线，且生成的 TS 类型在缺少 `@Schema` 的 controller 上比手写类型更弱；因此这里选择维护一份显式的手写客户端，并把契约同步写进文档。本仓库不提供 `generate:api`，**不要从 `meta-web-three/apps/tools/OpenApiToTS.js` 复制生成脚本**。

`src/renderer/services/clients/` 是手写客户端目录（不要误认为生成物）：

| 文件 | 职责 |
|---|---|
| `clients/digital-twin/api.ts` | 数字孪生 REST：设备列表、活跃告警、统计摘要、告警确认/解决；封装 axios 实例并挂接 `installGatewayAuth` |
| `clients/digital-twin/types.ts` | 上述接口的手写 DTO 类型 |
| `clients/mes/api.ts` | MES SCADA 遥测/指令与追溯 REST |
| `clients/mes/types.ts` | 上述接口的手写 DTO 类型 |
| `clients/index.ts` | 对外 barrel 导出 |

告警规则 REST 位于同级的 `src/renderer/services/api/alertRule.ts`（同样手写，走 `gatewayFetch`），不在 `clients/` 目录内。

**适用范围**：仅 `gateway:10081/factory-service/**` 的 REST 调用——digital-twin、alert-rules、MES/SCADA/traceability。

**不适用范围（始终手写，不纳入任何生成范围）**：数字孪生 WebSocket 握手与 `DEVICE_STATUS_CHANGED` / `DEVICE_POSITION_UPDATED` / `PRODUCTION_OUTPUT_UPDATED` / `ALERT_CREATED` 事件、本地 `127.0.0.1:5051` HTTP 与 SSE、`window.desktop` preload IPC 桥接、MQTT 主题、主进程 login / refreshToken。

### 后端契约同步机制

- **单一事实来源**是 `meta-web-three` 的 `server/factory-domain/factory-service/` controller 及其 `server/README.md`。本仓库不持有 OpenAPI spec 快照，也不提交任何生成产物；`meta-web-three/DEVELOPMENT.md` 第 3 节只覆盖该仓库的 `apps/client` 与 `apps/backstage-admin`，不再描述本仓库。
- **新增或变更端点**时：对照后端 controller 修改 `services/clients/**` 的路径、请求体与类型 → 更新本 README 的口径表 → 跑 `npm run typecheck` 与 `npm run test:run` → 在提交信息 / PR 描述里注明对应的后端仓库 commit 或分支。
- **固定口径**（与上文「Cross-service access: gateway + JWT」一致）：REST base `http://localhost:10081/factory-service`（`VITE_GATEWAY_URL` / `_HOST` / `_PORT`）、`Authorization: Bearer <jwt>`、WS `ws://localhost:10081/factory-service/ws/digital-twin?token=<jwt>`、JWT 由主进程持有且不进入渲染层 bundle、禁止直连 `factory-service:10101` 等服务端口。
- 契约变更若涉及 JWT / 内部令牌 / WS 事件类型，必须同时复核 `src/renderer/config/gateway.ts`、`src/renderer/services/gateway-client.ts`、`src/main/gateway-token.ts`。

## Local HTTP API authentication (Electron-internal)

The Electron main process exposes a loopback-only HTTP API on `127.0.0.1:${WEB_SERVER_PORT}` (default `5051`). This is an internal API: its only consumer is this application's own renderer, and there is no other caller in this repository. It does not involve `server/` and does not use the gateway JWT.

- The renderer obtains its own session token through the `getLocalApiToken` preload method and sends `Authorization: Bearer <token>`.
- SSE endpoints that cannot set headers (`/api/tts/download`) accept `?token=<token>`.
- Set `LOCAL_API_TOKEN` in `.env` to pin a known value; otherwise a random token is generated on each start.
- Only loopback origins (`file://`, the Vite dev server and the API itself) are allowed; wildcard CORS is disabled.

## LLM models and monitor windows

`POST /v1/chat/completions` dispatches on `payload.model`:

| model | behavior |
|---|---|
| `local` (default) | `LLMService` or the `LOCAL_LLM_PROVIDER` SSE proxy |
| `chatgpt` | in-app ChatGPT monitor window, SSE chunks converted to OpenAI deltas |
| `deepseek` | in-app DeepSeek monitor window, SSE chunks converted to OpenAI deltas |

Monitor windows keep `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` and use a dedicated `monitor-preload` that exposes only named channels. Session tokens for both providers are written through the token-protected `POST /v1/auth/token` route.

## Running the Application

使用yarn而不是npm可以避免很多间接依赖版本冲突问题。

### Development mode
```bash
yarn dev
```

### Build application
```bash
yarn build
```

## Features

### Voice Transcription & Subtitles

Real-time transcription of microphone or system audio with a customizable overlay.

1. **Select Source**
   - **Microphone**: Direct environment recording.
   - **System Audio**: Select a specific window or tab from the list.

2. **Start Transcription**
   - Click **"Start Recording"** in the control panel.
   - Data is streamed to the backend for processing.

3. **Floating Subtitles**
   - Click **"Open Subtitles"** to show the overlay.
   - Click ⚙️ on the overlay to customize:
     - Font size and color
     - Text outline color and width

4. **File Transcription**
   - Upload local audio/video files (MP3/MP4) for offline transcription.

### Backend Requirements

Requires a compatible backend service:
- `POST /voice/to/text` (Supports SSE stream and chunked uploads)
