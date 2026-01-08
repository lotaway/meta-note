import "reflect-metadata"
import { app, desktopCapturer, screen, systemPreferences } from "electron"
import path from "node:path"
import dotenv from 'dotenv'
import ffmpeg from "fluent-ffmpeg"
import { INestApplicationContext } from "@nestjs/common"

import { bootstrapNestJS } from "./nestjs/main"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { ConfigController } from "./nestjs/controllers/config.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { StudyController } from "./nestjs/controllers/study.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"

import { StudyService } from "./nestjs/services/study.service"
import { LLMService } from "./nestjs/services/llm.service"
import { MediaService } from "./nestjs/services/media.service"
import { WebSocketService } from "./nestjs/services/websocket.service"

import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"

import { AppLifecycle, AppConfig } from "./app-lifecycle"
import { HttpServer } from "./http-server"
import { IpcRegistry } from "./ipc-registry"

dotenv.config()
ffmpeg.setFfmpegPath(__dirname)

const APP_PROTOCOL = process.env.APP_PROTOCOL || "meta-note"
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
    distPath: "dist/index.html"
}

let nestApp: INestApplicationContext | null = null
let nestLLMService: LLMService | null = null
let httpServerInstance: HttpServer | null = null

const getNestApp = () => nestApp
const getNestLLMService = () => nestLLMService

const ipcRegistry = new IpcRegistry(getNestApp)

const onInit = async () => {
    try {
        app.setAsDefaultProtocolClient(APP_PROTOCOL)
        app.commandLine.appendSwitch('enable-unsafe-webgpu')
        app.commandLine.appendSwitch('enable-features', 'Vulkan,WebGPU')
        if (IS_MAC) {
            app.commandLine.appendSwitch('disable-gpu-vsync')
        }

        await appLifecycle.createWindow()

        nestApp = await bootstrapNestJS()
            ; (global as any).nestApp = nestApp

        nestLLMService = nestApp.get(LLMService)
        const studyService = nestApp.get(StudyService)
        const mediaService = nestApp.get(MediaService)
        const webSocketService = nestApp.get(WebSocketService)

        if (nestLLMService) {
            await nestLLMService.start()
        }

        const llmController = new LLMController(
            chatGPTMonitor.getChatGPTMonitor,
            chatGPTMonitor.getChatGPTEventBus,
            deepSeekMonitor.getDeepSeekMonitor,
            deepSeekMonitor.getDeepSeekEventBus
        )
        const configController = new ConfigController()
        const authController = new AuthController(
            chatGPTMonitor.setSessionToken,
            deepSeekMonitor.setDeepSeekSessionToken
        )
        const studyController = new StudyController(studyService)
        const screenshotController = new ScreenshotController(
            () => appLifecycle.getMainWindow(),
            desktopCapturer,
            screen,
            systemPreferences
        )
        const systemController = new SystemController(mediaService)

        webSocketService.setup(WEBSOCKET_PORT, APP_PROTOCOL)

        httpServerInstance = new HttpServer(
            configController,
            llmController,
            authController,
            studyController,
            screenshotController,
            systemController,
            WEB_SERVER_PORT
        )
        httpServerInstance.start()

        ipcRegistry.register()

    } catch (err) {
        console.error("Initialization failed：", err)
    }
}

const appLifecycle = new AppLifecycle(appConfig, getNestLLMService, onInit)

appLifecycle.setupEventListeners()

export { nestLLMService as llmService }
