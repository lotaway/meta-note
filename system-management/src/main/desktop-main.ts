import "reflect-metadata"
import './global-error'
import { app, desktopCapturer, screen, systemPreferences } from "electron"
import path from "node:path"
import dotenv from 'dotenv'
import ffmpeg from "fluent-ffmpeg"
import { INestApplicationContext } from "@nestjs/common"

import { bootstrapNestJS } from "./nestjs/main"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { MonitorLLMController } from "./nestjs/controllers/monitor-llm.controller"
import { ConfigController } from "./nestjs/controllers/config.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"
import { TTSController } from "./nestjs/controllers/tts.controller"
import { NoteController } from "./nestjs/controllers/note.controller"
import { StudyController } from "./nestjs/controllers/study.controller"

import { LLMService } from "./nestjs/services/llm.service"
import { MediaService } from "./nestjs/services/media.service"
import { WebSocketService } from "./nestjs/services/websocket.service"
import { TTSService } from "./nestjs/services/tts.service"
import { NoteService } from "./nestjs/services/note.service"
import { StudyService } from "./nestjs/services/study.service"

import { AppLifecycle, AppConfig } from "./app-lifecycle"
import { HttpServer } from "./http-server"
import { IpcRegistry } from "./ipc-registry"
import { GatewayTokenManager, readGatewayTokenConfig } from "./gateway-token"
import { initializeSupport } from "./rust-bridge"
import { APP_PROTOCOL_DEFAULT } from "../brand"
import { type MonitorProvider } from "./constants"
import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"

dotenv.config()
ffmpeg.setFfmpegPath(__dirname)

const APP_PROTOCOL = process.env.APP_PROTOCOL || APP_PROTOCOL_DEFAULT
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || "5050", 10)
const WEB_SERVER_PORT = parseInt(process.env.WEB_SERVER_PORT || "5051", 10)
const DEV_SERVER_PORT = parseInt(process.env.DEV_SERVER_PORT || "5173", 10)
const WINDOW_WIDTH = parseInt(process.env.WINDOW_WIDTH || "1200", 10)
const WINDOW_HEIGHT = parseInt(process.env.WINDOW_HEIGHT || "800", 10)
const IS_DEV = process.env.NODE_ENV === "development"
const IS_MAC = process.platform === "darwin"
const IS_LINUX = process.platform === "linux"

const appConfig: AppConfig = {
    isDev: IS_DEV,
    isMac: IS_MAC,
    isLinux: IS_LINUX,
    devServerPort: DEV_SERVER_PORT,
    windowWidth: WINDOW_WIDTH,
    windowHeight: WINDOW_HEIGHT,
    appProtocol: APP_PROTOCOL,
    preloadPath: path.join(__dirname, "../preload/preload.js"),
    // Resolved from this file, not the process cwd: Electron's loadFile()
    // otherwise looks for dist-electron/main/dist/index.html.
    distPath: path.resolve(__dirname, "../../dist/index.html")
}

let nestApp: INestApplicationContext | null = null
let nestLLMService: LLMService | null = null
let httpServerInstance: HttpServer | null = null

const getNestApp = () => nestApp
const getNestLLMService = () => nestLLMService
// dotenv.config() runs above, so the service-account credentials are read here
// in the main process and never reach the renderer bundle.
const gatewayTokenManager = new GatewayTokenManager(readGatewayTokenConfig())

const setupAppEnvironment = () => {
    app.setAsDefaultProtocolClient(APP_PROTOCOL)
    app.commandLine.appendSwitch('enable-unsafe-webgpu')
    app.commandLine.appendSwitch('enable-features', 'Vulkan,WebGPU')
    app.commandLine.appendSwitch('disable-features', 'Autofill')
    if (IS_MAC) {
        app.commandLine.appendSwitch('disable-gpu-vsync')
    }
}

// Ensure command line switches are applied early
setupAppEnvironment()

const initializeHttpServer = (nestApp: INestApplicationContext) => {
    const llmService = nestApp.get(LLMService)
    const mediaService = nestApp.get(MediaService)
    const webSocketService = nestApp.get(WebSocketService)
    const ttsService = nestApp.get(TTSService)
    const noteService = nestApp.get(NoteService)
    const studyService = nestApp.get(StudyService)

    const screenshotController = new ScreenshotController(
        () => appLifecycle.getMainWindow(),
        desktopCapturer,
        screen,
        systemPreferences
    )

    webSocketService.setup(WEBSOCKET_PORT, APP_PROTOCOL)

    const monitorLLMController = new MonitorLLMController(
        chatGPTMonitor.getChatGPTMonitor,
        chatGPTMonitor.getChatGPTEventBus,
        deepSeekMonitor.getDeepSeekMonitor,
        deepSeekMonitor.getDeepSeekEventBus
    )

    httpServerInstance = new HttpServer(
        new ConfigController(),
        new LLMController(llmService, monitorLLMController),
        new AuthController(
            chatGPTMonitor.setSessionToken,
            deepSeekMonitor.setDeepSeekSessionToken
        ),
        screenshotController,
        new SystemController(mediaService),
        new TTSController(ttsService),
        new NoteController(noteService),
        new StudyController(studyService),
        WEB_SERVER_PORT
    )
    httpServerInstance.start()
}

const onInit = async () => {
    try {
        await appLifecycle.createWindow()

        nestApp = await bootstrapNestJS()
        nestLLMService = nestApp.get(LLMService)

        if (nestLLMService) {
            await nestLLMService.start()
        }

        initializeHttpServer(nestApp)

        // Initialize Rust native support
        initializeSupport()

        ipcRegistry.register()
    } catch (err) {
        // Only essential error logging
        console.error("Core initialization failed", err)
    }
}

const appLifecycle = new AppLifecycle(appConfig, getNestLLMService, onInit)
const ipcRegistry = new IpcRegistry(getNestApp, () => appLifecycle, {
    getLocalApiToken: () => httpServerInstance?.getToken() ?? null,
    getGatewayToken: () => gatewayTokenManager.getToken(),
    invalidateGatewayToken: () => gatewayTokenManager.invalidate(),
    openMonitorWindow: (provider: MonitorProvider) => {
        if (provider === 'chatgpt') {
            chatGPTMonitor.setupChatGPTMonitor()
        } else {
            deepSeekMonitor.setupDeepSeekMonitor()
        }
    },
    openExternalLogin: (provider: MonitorProvider) => {
        if (provider === 'chatgpt') {
            chatGPTMonitor.openExternalLogin()
        } else {
            deepSeekMonitor.openDeepSeekExternalLogin()
        }
    }
})

appLifecycle.setupEventListeners()

export { nestLLMService as llmService }
