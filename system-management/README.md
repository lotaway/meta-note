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

Start the server side with the root compose (it includes gateway + zookeeper) plus the digital-twin overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.digital-twin.yml up -d factory-service
```

`docker-compose.digital-twin.yml` publishes **no** host port for factory-service; only `10081` is exposed.

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
