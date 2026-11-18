# TODO

本文件用中文记录任务；文件名、路径、代码标识符、命令、提交号等技术内容保留原文。完成前保持 `[ ]`，验收通过后移入下方归档区。

仓库口径：本仓库 `lotaway/meta-note` 是独立仓库与版本管理，只含桌面客户端 `system-management/` 与原生模块 `system-support/`。后端 `server/gateway`、`server/factory-domain/factory-service`、compose / k8s 编排、共享 OpenAPI 生成脚本 `apps/tools/` 都在同级仓库 `meta-web-three`，不在本仓库提交。本文件是 meta-note 自己的任务清单，不依赖 `meta-web-three/TODO.md` 来跟踪本仓库的改动。

## 决策记录：接口客户端不采用 OpenAPI 生成（2026-11-16，路线 B）

用户于 2026-11-16 选定 **B：有意不生成 OpenAPI 客户端**，把手写封装正名、把偏离与后端契约同步机制写进本仓库自己的文档。以下为 2026-11-16 对两个仓库做只读核实后的结论，本轮未改动任何代码。

**为什么现阶段不生成：**

| 维度 | 核实结果 |
|---|---|
| spec 源 | `meta-web-three` 网关确有 `GET /meta/v3/api-docs`（`AggregatedApiDocsController` 按 `/{serviceId}` 前缀合并，factory-service 的 id 即 `factory-service`，与本仓库 `FACTORY_SERVICE_BASE_URL` 口径一致；`/v3/api-docs` 免 JWT 与 `X-Internal-Token`）。但它依赖 zookeeper 发现 + 全部服务在线，`OpenApiConfig.cacheApiDocs` 定时拉取，无缓存时返回 HTTP 200 + 空 `paths`；核查时 `localhost:10081` 未启动，两个仓库都没有入库的 spec 快照。 |
| 生成器在另一个仓库 | `meta-web-three/apps/tools/OpenApiToTS.js` 硬编码 `-g typescript-fetch` 与 `import.meta.env.*` 运行时基址，`main()` 吞掉异常后 `process.exit(0)` 且不校验 `paths` 数量；还依赖同目录 `fixApiIndexBarrel.js` 与 `dotenv`。独立仓库引用会形成跨仓库路径依赖。 |
| spec 质量 | `DigitalTwinController` 的 `/devices` `/alerts/active` `/stats/summary` 返回 `ResponseEntity<?>`，多数写操作收 `Map<String, Object>`，整个 factory-service 零 `@Operation` / `@Schema`，生成的 TS 会是 `object` / `{ [key: string]: any }`，比手写 `types.ts` 更弱。只有 `AlertRuleController` / `ScadaController` / `TraceController` 有 DTO。 |
| 规模 | factory-service 有 454 个 `@*Mapping`、全 `server/` 1802 个，而本应用只调用约 20 个；全量生成会拖入大量无关 API，触发已知 barrel 重名，聚合 schema 还是同名「先到先得」。 |
| Electron 传输层 | 渲染层是 axios + `installGatewayAuth`（JWT 由主进程 `getGatewayToken` 提供、401 失效重取）；主进程 `src/main/gateway-token.ts` 用 `process.env` + 原生 fetch 做 login / refresh；WS 走 `?token=` 握手与 5 类事件；本地 `127.0.0.1:5051` 内嵌 HTTP、preload IPC 桥接、MQTT 均无 OpenAPI 文档。`import.meta.env` 版 `runtime.ts` 无法同时服务主进程。 |
| CI | 本仓库 CI 只有 native build → `npm run typecheck` → `npm run test:run`，不启动后端；生成物若不入库，全新检出的 typecheck 必然失败。`meta-web-three/apps/client/.gitignore:154` 也忽略 `src/generated`，被跟踪生成产物为 0。 |

**决定：**保持手写客户端，不引入 `generate:api` / `openapitools.json` / `tools/` / spec 快照 / 生成物。`system-management/src/renderer/services/generated/` 是 5 个手写文件（`digital-twin/{api,types}.ts`、`mes/{api,types}.ts`、`index.ts`），必须改名以免误导。

**适用范围：**仅 `gateway:10081/factory-service/**` 的 REST 调用（digital-twin、alert-rules、MES/SCADA/traceability）。**不适用范围（始终手写，不纳入任何生成范围）：**数字孪生 WebSocket 握手与 `DEVICE_STATUS_CHANGED` / `DEVICE_POSITION_UPDATED` / `PRODUCTION_OUTPUT_UPDATED` / `ALERT_CREATED` 事件、本地 `127.0.0.1:5051` HTTP 与 SSE、`window.desktop` preload IPC 桥接、MQTT 主题、主进程 login / refreshToken。

### 后端契约同步机制（README 必须写清的内容）

- 单一事实来源是 `meta-web-three` 的 `server/factory-domain/factory-service/` controller 与其 `server/README.md`；本仓库不持有 spec 快照，也不提交任何生成产物。`meta-web-three/DEVELOPMENT.md` 第 3 节只覆盖该仓库的 `apps/client` 与 `apps/backstage-admin`，不再描述本仓库。
- 新增或变更端点时：对照后端 controller 修改 `services/clients/**` 的路径、请求体与类型 → 更新 `system-management/README.md` 的口径表 → 跑 `npm run typecheck` 与 `npm run test:run` → 在提交信息 / PR 描述里注明对应的后端仓库 commit 或分支。
- 固定口径（与 `system-management/README.md`「Cross-service access: gateway + JWT」一致）：REST base `http://localhost:10081/factory-service`（`VITE_GATEWAY_URL` / `_HOST` / `_PORT`）、`Authorization: Bearer <jwt>`、WS `ws://localhost:10081/factory-service/ws/digital-twin?token=<jwt>`、JWT 由主进程持有且不进入渲染层 bundle、禁止直连 `factory-service:10101` 等服务端口。
- 契约变更若涉及 JWT / 内部令牌 / WS 事件类型，必须同时复核 `src/renderer/config/gateway.ts`、`src/renderer/services/gateway-client.ts`、`src/main/gateway-token.ts`。

## 可执行任务

### 从主仓库迁入的任务（2026-11-16）

主仓库 `meta-web-three/TODO.md` 已清理为纯任务列表，不再跟踪完成情况与本仓库专属事项；下面 3 条是其中仍需在本仓库闭环的重要部分（任务 9 已完成并归档）。

- [ ] 6. 补齐 Electron 运行时冒烟检查与 CI 原生 ABI 覆盖。
  - 问题：`.github/workflows/system-management-check.yml` 只跑 `npm run build:native` → `npm run typecheck` → `npm run test:run`，且第 50 行设 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`；`package.json:21` 有 `rebuild:sqlite3`，CI 却不执行，声明的 `better-sqlite3 ^11.0.0` 原生 ABI 从未在运行时被检验，也没有加载真实业务 UI 的启动冒烟。仓库无 `.npmrc`，`npm install --legacy-peer-deps` 的 registry 未固定（lockfile 按约定不入库）。
  - 原始建议（已被下方决策取代，仅留背景）：曾在 CI 引入 xvfb 与 Electron 二进制下载做无头冒烟。
  - 环境要求：真机冒烟需要可用的桌面环境。
  - 关闭条件：保留一次手动冒烟记录（真实 Electron 启动、原生模块加载成功、真实业务 UI 渲染通过）。
  - **决策（2026-11-18，用户已定，无待决事项）**：Electron 冒烟**手动**，不进 CI、不引入 xvfb 与 Electron 二进制下载等复杂度。CI workflow 已回退为最小三件套（native build → typecheck → unit tests）。手动冒烟脚本保留供按需运行：`src/e2e/smoke/electron-smoke.spec.ts`（Playwright `_electron.launch()` 启动真实 Electron，断言 window.desktop 具名方法、`#app` 真实渲染、NAPI-RS 原生模块无 `[NativeBridge] CRITICAL` 日志）、`playwright.smoke.config.ts`、`package.json` 的 `test:smoke` 脚本。真机运行由用户在有桌面环境时按需执行，不设审批前置。

- [ ] 7. 补齐测试覆盖并让 Playwright e2e 可复现运行。
  - 问题：`system-management/src` 现有 18 个测试 / e2e 文件（含 `src/renderer/e2e/gateway-auth.spec.ts`、`scene.spec.ts` 与 `playwright.config.ts`），覆盖集中在主进程与少数服务 / 组件；`services/clients/**`（改名后）与 `services/api/alertRule.ts` 缺直接用例，3D 场景、告警流、图表没有响应式 / 视觉 / 性能覆盖，现有性能断言只检查 `not.toThrow()`（如 `AlertFlow.test.tsx:695`、`RealTimeDataDisplay.test.tsx:226`）。CI 不执行 `npm run test:e2e`，也没有图形环境。
  - 环境要求：Playwright 浏览器二进制；真实 3D 渲染冒烟需要图形环境。
  - 关闭条件：`npm run test:run` 与 e2e 子集通过，API 客户端与关键组件有行为断言，手动记录可复现。
  - **决策（2026-11-18，用户已定，无待决事项）**：浏览器 e2e **手动**，不进 CI；**不设数值化覆盖率门槛**（用户未要求，不自行加准则）。CI workflow 已移除 `npx playwright install chromium` 与 `npm run test:e2e`。手动运行方式：先 `npm run build`，再 `npm run test:e2e`（`playwright.config.ts` 的 `webServer` 会起 dev server）。`playwright --list` 已确认 13 个浏览器用例可收集（`gateway-auth.spec.ts` 4 个 + `scene.spec.ts` 9 个）；本地实跑受限于 Playwright 浏览器版本不匹配与 CDN 下载，由用户在有网络的环境按需执行。
  - **仍待处理（代码层补强）**：为 `services/clients/**` 与 `api/alertRule.ts` 补直接用例；把 `not.toThrow()` 性能断言换成可观测断言。

- [ ] 8. 优化前端代码质量（含未接线的实时通道）。
  - 口径更正（2026-11-18，用户明确）：**本任务不涉及翻译代码注释 / 日志 / 文案，也不引入"代码文本一律英文"之类准则**。用户的语言要求仅针对本 `TODO.md`（用中文记录），从未施加到源码。此前从 `CODE_PINCEPLES` 衍生出的"函数不超过 20 行 / 不吞异常 / 用卫语句"等也属于自行扩大准则范围，不作为本任务验收项。本任务只做有实际收益的代码质量优化。
  - 2026-11-18 核实结论（测量后判定，无待决事项）：
    - `catch`：24 个候选中仅 2 个是纯空 catch（`monitor-llm.controller.ts:200`、`AudioContext.tsx:56`），均为畸形 SSE 的合理忽略；其余都有日志或错误状态。**无吞异常缺陷需修**。
    - 未接线通道：`DigitalTwinMQTT` / `useDigitalTwinMQTT` / `useAlertNotification` / 5050 `WEBSOCKET_URL` 确认只有定义 + barrel 导出、无业务调用方。按"不扩大范围"原则**保持现状，本轮不接入也不删除**——接入或删除属功能取舍，用户未要求。
    - 响应式断点 / ErrorBoundary：用户未要求，**不设断点数值**、不为此新增准则或大改。
  - 结论：经核实无需改动的代码质量项，本任务当前无实质待办。若后续发现具体缺陷，按"有实际收益才做"单独处理，每轮跑 `npm run typecheck` 与 `npm run test:run`。

## 归档

### 2026-11-18 — 任务 5（验证、提交并推送）

- 本地检查：`npm run typecheck` 通过；`npm run test:run` 通过（16 个测试文件 / 176 个测试）。CI 无需生成步骤，继续不启动后端、不入库生成物。
- CI 修复过程（run #5/#6 失败，run #7 全绿）：
  - 原 CI 在浏览器 e2e 步骤失败；按用户决策 e2e / Electron 冒烟改为手动，workflow 回退为 native build → typecheck → unit tests 三件套，不引入 xvfb / Electron 二进制下载。
  - 回退时误删了原生构建所需的 apt 依赖，`alsa-sys` 缺 `libasound2-dev` 而编译失败；已恢复 `pkg-config` / `libasound2-dev` / `libv4l-dev` / `libudev-dev`（不含显示依赖）。
  - `youtube-dl-exec` 的 postinstall 经未鉴权 GitHub API 下载 yt-dlp，共享 runner IP 触发限流导致安装失败（run #2/#4/#6 同因）；CI 不运行下载相关代码，已设 `YOUTUBE_DL_SKIP_DOWNLOAD=1` 跳过。
- 相关提交：`dbcd55b`（CI 精简）、`51e2101`（恢复原生构建依赖）、`328da7a`（跳过 yt-dlp 下载）、`0a29b60`（TODO 口径更正）。均经 GitHub Git Data API 推送（本环境 git push 走代理返回 502，仅 api.github.com 可达），提交 SHA 与本地一致，本地 / 远端均同步。
- 跨仓口径：本文件是桌面端任务唯一跟踪点，无需回写 `meta-web-three`；任务 5 原关闭条件中「主仓库对应任务已归档」与此冲突，按用户决策以本文件为准。
- 关闭条件：CI run #7 全绿、改动已推送到 `lotaway/meta-note`、本地两项检查通过。

### 2026-11-17 — 任务 9（统一桌面端 env 与端口口径）

- 决策（用户确认）：`8080` 归内嵌 `llama-server`（`local-llm-provider.ts` 硬编码，保留）；Whisper 转写默认端口改为 `8081`。唯一端口表由本仓库 `system-management/README.md` 维护。
- `.env.example`：`WHISPER_URL` 默认值 `8080` → `8081`；改写 Cross-service access 注释，明确 `10101 / 8082 / 8080` 是 `meta-web-three` 后端服务端口、与本地 llama-server `8080` 无关，并指向 README 端口表。
- `src/main/nestjs/services/providers/transcriber.ts:21`：代码默认值 `8080` → `8081`。
- `src/main/nestjs/services/providers/transcriber.spec.ts`：端口断言由 `toContain('/v1/audio/transcriptions')` 收紧为 `toBe('http://localhost:8081/v1/audio/transcriptions')`。
- `system-management/README.md`：Environment Configuration 下新增「Port reference」唯一端口表（`10081` / `5050` / `5051` / `5173` / `8000` / `8080` / `8081`），并说明 `8080`+`8081` 必须不同、后端服务端口不在此配置。
- 验收：`npm run typecheck` 通过；`npm run test:run` 通过（16 个测试文件 / 176 个测试）。未做真机同时启动验证（运行验证须另行获准），但 `.env.example`、代码默认值与 README 三处口径已一致。

### 2026-11-16 — 任务 1-4（A 组：手写客户端正名与路线 B 文档）

- 提交号：`883b8d0cc8ff62e9728e67ebd2770ca1362b299b`（`refactor(clients): rename hand-written API client layer`）。
- 任务 1：用 `git mv` 把 `services/generated/` 改为 `services/clients/`（5 个文件均为 R100）；6 处导入 `'./generated'` 改为 `'./clients'`；目录深度不变，相对路径未改。
- 任务 2：`generatedApi` 改为 `digitalTwinClient`（6 处调用 + import 别名，共 7 处）；`gateway-client.ts` 的注释与 `gateway-client.spec.ts` 的用例名改为手写客户端表述；AI 摘要语义的 `generatedMarkdown` 等未动。
- 任务 3：`system-management/README.md` 新增「API 客户端：有意不生成」，含 `services/clients/` 文件清单、适用 / 不适用范围、后端契约同步机制与新增端点步骤。
- 任务 4：根 `README.md` 新增「接口契约与同步机制」，含跨仓同步流程、版本标注方式与 CI 边界，并链接客户端 README 与本决策记录。
- 验收：`npm run build:native` 通过；`npm run typecheck` 通过；`npm run test:run` 通过（16 个测试文件 / 176 个测试）；`git grep -n "from './generated'\|services/generated" system-management/src` 无命中。
- 附带修复：`digital-twin-api.test.ts` 的 `axios.create` mock 缺少 `interceptors`，`installGatewayAuth` 在 import 期抛错（既存问题，非本次改名引入）；已补齐 request / response 拦截器 mock。

## 后续可选（不在本次任务范围，需重新决策）

若将来要改走「局部生成」路线 A'，前置条件全部落地后才可开新任务：后端把 digital-twin 的 `Map` / `ResponseEntity<?>` 换成 DTO 并加 `@Schema`；发布只含 `/factory-service/**`、带版本的 spec 快照；把生成器脚本与固定版本（`openapi-generator-cli 7.23.0`）内置进本仓库；改用 `typescript-axios` 或用 middleware 接上 `installGatewayAuth` 的 JWT / 401 逻辑；生成物入库并在 CI 加「spec 与产物一致」检查。WS、本地 HTTP、IPC、MQTT 仍保持手写。
