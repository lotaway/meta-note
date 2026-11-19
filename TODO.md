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

## 当前状态

截至 2026-11-19，任务 1-9 全部闭环并归档。2026-11-19 按用户要求重开了任务 7（测试代码层补强）与任务 8（代码原则治理），并把任务 6 的 CI 自动化恢复（用户重申「测试即全自动化」），三项均已落地并归档于下方 2026-11-19 段。路线 B（有意不生成 OpenAPI 客户端）与下方「后端契约同步机制」作为项目约定继续有效。

2026-11-19 晚，用户就上一轮「仍按原则保留的欠账」给出三项决策并已全部落地（详见下方 2026-11-19 晚归档）：① 函数长度标准定为约 50 行、不必太纠结；② UI 添加 i18n；③ catch 错误能覆盖就完整覆盖、不遗漏未捕获错误。至此，上一轮列出的三项欠账均已处理，当前无待办。i18n 基础设施已就位：新增语言（zh-CN / en）时按 `src/renderer/i18n/locales/` 的结构补资源 key，渲染层用 `t('key')`，语言切换入口在 Settings 页（`setLanguage` 写 localStorage 后重载）。

**仍属持续优化、非待办的判断**：`useDigitalTwinData` 主组合 hook（约 147 行）超出 50 行，但主体是状态与回调编排样板，可提取的独立逻辑（patchDevice / createMessageHandler / connectGatewayWs）均已拆到模块级纯函数（≤20 行）；React 展示组件的 JSX 长度属声明式自然结果，不机械拆分。品牌名 `APP_DISPLAY_NAME` 保留中文（专有名词）。

## 归档

### 2026-11-19 深夜 — 修复 CI Browser e2e 步骤失败（workflow #8/#9）

恢复自动化 CI 后，run #8（`6b34ce1`）与 run #9（`09dec16`）均在 `Browser e2e tests` 步骤失败（此前 run #7 因 e2e 未启用而全绿），本地复现出同样结果。根因与修复：

- **dev server 在 headless CI 启动真实 Electron**：`webServer.command: npm run dev` 会加载 `vite-plugin-electron`，在无显示环境下启动窗口 / 触发 Electron 二进制下载，dev server 挂起、`page.goto` 30s 超时（本地出现白屏与 `HTTP 000`）。修复：`vite.config.ts` 增加 `VITE_BROWSER_E2E=1` 开关跳过 Electron 插件；`playwright.config.ts` 的 webServer 命令改为 `cross-env VITE_BROWSER_E2E=1 npm run dev`。浏览器 e2e 只需 renderer，Electron 冒烟仍用独立 config 与真实二进制，两条链路互不干扰。
- **scene.spec.ts 断言与真实 UI 不符**：默认路由是笔记编辑器，3D 画布只存在于 Digital Twin 页；旧用例直接在 `/` 等 `canvas` 并断言从未被写入的 `window.__WS_CONNECTED__`，必然超时 / 失败。重写为通过 `Digital Twin` 按钮进入页面后断言画布尺寸、相机拖拽无 pageerror、设备列表与连接状态、Alerts Tab 可切换；bridge 与 gateway 在浏览器层 stub，不依赖后端。用例从 13 个收敛为 8 个真实断言。

**CI run #10 后续**：Browser e2e 修复后，`Unit tests` 步骤暴露另一 runner 相关 flake——`RealTimeDataDisplay.test.tsx` 的 1000 条 `ShelfHeatmap` 渲染在 CI（本地 1.6s）超过 Vitest 默认 5s 超时。给两个大数据量用例显式设置 `20000ms` 超时，保留压力规模不降级断言。

**CI run #11 后续**：Browser e2e 通过后 `Rebuild better-sqlite3 for Electron ABI` 步骤 exit 255。核实 `better-sqlite3` 在 `src/` 无任何 import（仅 package.json 声明），冒烟测试也不依赖它；该步骤是我方恢复 CI 时新增的无效门禁，已从 workflow 移除，避免为死依赖编译原生模块。若将来真正启用 SQLite，再在对应任务里补回 ABI 验证。

**CI run #12 后续**：只剩 Electron 冒烟步骤失败。本地装好 Electron 二进制后复现出两处真实缺陷：① `desktop-main.ts` 的 `distPath: "dist/index.html"` 由 `loadFile()` 相对 `dist-electron/main/` 解析成不存在的 `dist-electron/main/dist/index.html`，窗口落在 `chrome-error://chromewebdata/`，`#app` 自然不存在；改为 `path.resolve(__dirname, '../../dist/index.html')`（打包后同样指向 asar 内 `dist/index.html`）。② 冒烟 spec 会把外部 `ELECTRON_RUN_AS_NODE=1` 透传给 Electron 导致其以 Node 模式启动；启动时显式剔除。修复后本地 `npm run test:smoke` 通过（真实窗口、bridge、NAPI 加载）。

**CI run #13 最终全绿**（commit `0f45b84`，15 步全部 success）：native build → typecheck → unit tests → build → browser e2e → Electron runtime smoke 全部通过。此前 run #8/#9 的 Browser e2e 失败与后续暴露的 unit flake、死依赖 rebuild、Electron dist 路径错误已逐层定位并修复，恢复为一条全自动门禁。

**验收**：`npm run typecheck`、`npm run build`、`npm run test:run`（20 文件 / 210 例）、`npm run test:smoke` 均通过；本地用系统 Chrome 跑 `playwright test` 8/8 通过（本机缺 Playwright 自带 Chromium，CI 由 `npx playwright install chromium` 提供）。

### 2026-11-19 晚 — i18n、错误覆盖与函数长度治理

用户对上一轮三项欠账的决策：函数约 50 行内即可、不必太纠结；UI 添加 i18n；catch 错误能覆盖就完整覆盖、不遗漏未捕获错误。重新静态测量后实施（非沿用旧快照：中文 296 行 / 31 文件、超 50 行函数 32 个、空 catch 0 个）。

**i18n（UI 国际化）**：
- 引入 `i18next@27` + `react-i18next@18`，新增 `src/renderer/i18n/`（`index.ts`、`locales/zh-CN.ts`、`locales/en.ts`）。默认 `zh-CN`，从 localStorage 读偏好，缺 key 回退 zh-CN。
- 渲染层 296 行中文几乎全部迁移为 `t('key')`（按模块嵌套：common / alert / alertRule / device / scada / trace / warehouse / audio / digitalTwin 等），带插值的用 `{{var}}`（计数、aria-label、tooltip、模板默认值）。主进程日志/API 错误文案改英文（`screenshot.controller.ts`、`app-lifecycle.ts`），品牌名 `brand.ts` 保留中文。
- Settings 页新增语言切换（简体中文 / English，`setLanguage` 写 localStorage 后重载页面使模块级 `t()` 生效）。源码中文仅剩品牌名一处。

**错误覆盖（不遗漏未捕获错误）**：
- 渲染层新增 `src/renderer/utils/globalError.ts`：`installGlobalErrorHandlers()` 在 `main.tsx` 安装，捕获 `error` 与 `unhandledrejection`，console.error 记录 + 页面底部可见 banner（role=alert）；可订阅的 `onGlobalError`。
- 主进程新增 `src/main/global-error.ts`：`desktop-main.ts` 副作用导入，捕获 `uncaughtException` / `unhandledRejection` 并记录。
- 给 4 处「仅注释的吞异常」补 `console.debug`（monitor-llm SSE、AudioContext 分块、i18n localStorage 读写）；给无 catch 的 fire-and-forget promise 补 `.catch()`（VoiceTools/Settings 的 IPC 调用、`app.whenReady`、`useDigitalTwinData` 的 WS 连接 IIFE）；4 处仅 i18n 相关的静默降级。空 catch 实测为 0。

**函数长度（≤50 行，逻辑密集函数）**：
- `websocket.service.ts` setup 99 行拆为 `buildMessageResponse` 等纯函数 + 3 个私有方法（均 ≤20 行），并补 5 例测试。
- `chatgpt-inject.ts` init 88 行、`deepseek-inject.ts` init 72 行各拆为模块级单一职责函数（fetch 拦截 / 流上报 / 输入 / 发送按钮 / 登录处理），init 仅 6 行，行为不变。
- `useDigitalTwinData.ts` 提取 `patchDevice` / `createMessageHandler` / `connectGatewayWs`（≤20 行），新增整体 `.catch`；主 hook 保留状态/回调编排（约 147 行，属样板，见「当前状态」）。

**验收**：`npm run typecheck` 通过；`npm run test:run` 20 文件 / 210 例全绿（新增 globalError 3 例、websocket 5 例）。真实 e2e / Electron 冒烟仍交由 CI 验证。

### 2026-11-19 — 任务 6、7、8 重做（按 CODE_PINCEPLES 与「测试即全自动化」）

用户指出 2026-11-18 归档中任务 7/8「无实质待办」的结论与实际不符，要求按 `CODE_PINCEPLES/CODE_PRICEPLES` 与 `FRONTEND_PRICEPLES` 重做，并重申「测试就全自动化、引入 xvfb，普通脚本才人工介入」。本轮重新做了静态测量（非沿用旧快照）后实施：

**任务 7（测试代码层补强）**：
- 新增 3 个直接用例文件：`src/renderer/services/clients/digital-twin/api.test.ts`（12 例，覆盖 devices / alerts / summary / acknowledge / resolve / isReachable 与网关认证安装）、`src/renderer/services/clients/mes/api.test.ts`（10 例，覆盖 telemetry / command / trace 链与失败降级）、`src/renderer/services/api/alertRule.test.ts`（11 例，覆盖 list 过滤 / CRUD / checkUnique / 错误响应）。
- 把 8 处 `expect(...).not.toThrow()` 性能 / 容错断言替换为可观测断言（真实 DOM：告警面板按钮、补货建议 role=list、热力图 role=grid/gridcell、图表 role=img；其中 `undefined` 数据场景实测触发 ErrorBoundary 显示降级文案，断言据此修正为可见降级 UI）。
- 测试从 16 文件 / 176 例增至 18 文件 / 202 例（删除死代码带走 1 文件 / 5 例）。

**任务 8（按代码原则治理，风险可控部分）**：
- 删除未接线通道：`src/renderer/services/mqtt.ts`（只有 barrel 导出、无业务调用）、`src/renderer/hooks/useAlertNotification.ts` 及其测试（协议与现有 WS 不符，`ALERT_CREATED` 已由 `useDigitalTwinData` 处理）、孤儿服务 `src/renderer/services/notification.ts`；同步清理 `services/index.ts` 导出、`package.json` 的 `mqtt` 依赖、`constants.ts` 中零引用的 `SERVER_PORTS` / `SERVER_URLS`。`Toast.tsx` 因 `DigitalTwinPage` 仍在渲染 `ToastContainer` 而保留。
- 中文注释清零：删除 6 个文件中 65 行中文注释（含 JSX `{/* */}` 与 JSDoc），源码注释不再有中文；命名已能表达语义。
- 超 500 行文件拆分：`Warehouse3DView.tsx` 506 行拆为 `Warehouse3DScene.tsx`（378 行，常量 + 6 个 3D 子组件）+ 主文件（68 行，仅类型 + 容器 / ErrorBoundary）；类型仍从主文件导出，`ShelfHeatmap.tsx` 与 barrel 的导入不变。
- 未强行处理 98 个 20 行以上函数 / 中文 UI 字符串 / 110 个 catch，理由见「当前状态」。

**任务 6（CI 自动化恢复）**：用户重申测试即全自动化，`.github/workflows/system-management-check.yml` 从最小三件套恢复为 13 步：装 xvfb + 图形依赖（保留 alsa/pkg-config/libudev）、npm 安装（取消 `ELECTRON_SKIP_BINARY_DOWNLOAD`、保留 `YOUTUBE_DL_SKIP_DOWNLOAD=1`）→ `build:native` → `typecheck` → `test:run`（Node ABI，先于 sqlite3 rebuild）→ `npm run build` → `playwright install chromium` → `test:e2e` → `rebuild:sqlite3`（Electron ABI）→ `xvfb-run -a npm run test:smoke`。

**验收**：`npm run typecheck` 通过；`npm run test:run` 通过（18 文件 / 202 例）；Playwright workflow YAML 解析通过、13 步顺序正确、引用的 7 个 npm 脚本均存在。真实 e2e / Electron 冒烟本地受浏览器版本与二进制下载限制，交由 CI 境外 runner 验证（本轮提交触发的 CI 需关注结果）。

### 2026-11-18 — 任务 6、7、8（首轮结论，部分已于 2026-11-19 推翻并重做）

### 2026-11-18 — 任务 6、7、8（收尾：三项均无剩余待办）

- 任务 6（Electron 运行时冒烟）：用户决策为手动，不进 CI、不引入 xvfb 与 Electron 二进制下载；CI 保持最小三件套（native build → typecheck → unit tests）。手动脚本留在仓库按需运行：`src/e2e/smoke/electron-smoke.spec.ts`（`_electron.launch()` 断言 `window.desktop` 具名桥接、`#app` 渲染、原生模块无 `[NativeBridge] CRITICAL`）、`playwright.smoke.config.ts`、`test:smoke`。真机运行由用户按需执行，不设审批前置。
- 任务 7（测试覆盖 / e2e）：用户决策 e2e 手动、不进 CI、不设数值化覆盖率门槛。手动方式：先 `npm run build` 再 `npm run test:e2e`（`webServer` 自起 dev server）；`playwright --list` 已确认 13 个用例可收集，本地实跑受浏览器版本 / CDN 限制，由用户在有网络环境按需执行。代码层补强（为 `services/clients/**` / `api/alertRule.ts` 补直接用例、`not.toThrow()` 换可观测断言）按「不增加复杂度」不作为待办保留，需要时单独开任务。
- 任务 8（代码质量）：核实后无实质待办。24 个 catch 候选中仅 2 个纯空 catch 且均为畸形 SSE 的合理忽略；MQTT / `useAlertNotification` / 5050 `WEBSOCKET_URL` 只有定义与 barrel 导出、无业务调用方，按「不扩大范围」保持现状；不设响应式断点数值、不新增准则。语言要求仅针对本 `TODO.md`，从未施加到源码注释。
- 相关提交：`0a29b60`（范围口径更正）、`da4a2bd`（清除需决策标记）；CI 修复提交见任务 5 归档。

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

## 后续可选（不在本次任务范围）

若将来要改走「局部生成」路线 A'，前置条件全部落地后才可开新任务：后端把 digital-twin 的 `Map` / `ResponseEntity<?>` 换成 DTO 并加 `@Schema`；发布只含 `/factory-service/**`、带版本的 spec 快照；把生成器脚本与固定版本（`openapi-generator-cli 7.23.0`）内置进本仓库；改用 `typescript-axios` 或用 middleware 接上 `installGatewayAuth` 的 JWT / 401 逻辑；生成物入库并在 CI 加「spec 与产物一致」检查。WS、本地 HTTP、IPC、MQTT 仍保持手写。
