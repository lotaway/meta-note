import "reflect-metadata"
import { app, BrowserWindow, desktopCapturer, ipcMain, screen, systemPreferences } from "electron"
import * as remote from "@electron/remote/main"
import path from "node:path"
import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"
import dotenv from 'dotenv'
import { IPC_CHANNELS } from "./constants"

import { bootstrapNestJS } from "./nestjs/main"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { ConfigController } from "./nestjs/controllers/config.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { StudyController } from "./nestjs/controllers/study.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"
import express from 'express'
import { StudyService } from "./nestjs/services/study.service"
import { LLMService } from "./nestjs/services/llm.service"
import { MediaService } from "./nestjs/services/media.service"
import { WebSocketService } from "./nestjs/services/websocket.service"
import ffmpeg from "fluent-ffmpeg"

dotenv.config()

ffmpeg.setFfmpegPath(__dirname)

const isDev = process.env.NODE_ENV === "development"
const isLinux = process.platform === "linux"
const isMac = process.platform === "darwin"

const APP_PROTOCOL = process.env.APP_PROTOCOL || "meta-note"
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || "5050", 10)
const WEB_SERVER_PORT = parseInt(process.env.WEB_SERVER_PORT || "5051", 10)
const DEV_SERVER_PORT = parseInt(process.env.DEV_SERVER_PORT || "5173", 10)
const WINDOW_WIDTH = parseInt(process.env.WINDOW_WIDTH || "1200", 10)
const WINDOW_HEIGHT = parseInt(process.env.WINDOW_HEIGHT || "800", 10)

let mainWindow: InstanceType<typeof BrowserWindow> | null = null
let llmControllerInstance: LLMController | null = null
let configControllerInstance: ConfigController | null = null
let authControllerInstance: AuthController | null = null
let studyControllerInstance: StudyController | null = null
let screenshotControllerInstance: ScreenshotController | null = null
let systemControllerInstance: SystemController | null = null
let httpServer: any = null
let nestLLMService: LLMService | null = null

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        resizable: true,
        webPreferences: {
            devTools: isDev,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, "../preload/preload.js")
        }
    })
    remote.initialize()
    remote.enable(mainWindow.webContents)
    if (isDev) {
        await mainWindow.loadURL(`http://localhost:${DEV_SERVER_PORT}`)
    } else {
        await mainWindow.loadFile("dist/index.html")
    }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    app.quit()
} else {
    app.on('second-instance', (event, argv) => {
        console.log('Re-launched args:', argv)
    })
}

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 || mainWindow === null) {
        void createWindow().catch(err => {
            console.log("重新创建窗口失败" + JSON.stringify(err))
        })
    }
})

app.on("window-all-closed", async () => {
    if (nestLLMService) {
        await nestLLMService.stop()
    }
    !isMac && app.quit()
})

void app.whenReady().then(() => {
    isLinux ? setTimeout(originalInit, 300) : originalInit()
})

ipcMain.handle("readFileInDirectory", (event, filePath) => {
    const nestApp = (global as any).nestApp
    if (!nestApp) return null
    const mediaService = nestApp.get(MediaService)
    return mediaService.readFileInDirectory(filePath)
})
ipcMain.handle("mergeVideo", async (event, videos, outputPath) => {
    const nestApp = (global as any).nestApp
    if (!nestApp) return null
    const mediaService = nestApp.get(MediaService)
    return await mediaService.mergeVideo(videos, outputPath)
})
ipcMain.handle("llm:completion", async (event, prompt) => {
    const nestApp = (global as any).nestApp
    if (!nestApp) return null
    const llmService = nestApp.get(LLMService)
    return await llmService.completion(prompt)
})
ipcMain.handle(IPC_CHANNELS.OPEN_CHATGPT_WINDOW, () => chatGPTMonitor.setupChatGPTMonitor())
ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, () => chatGPTMonitor.openExternalLogin())
ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_WINDOW, () => deepSeekMonitor.setupDeepSeekMonitor())
ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_EXTERNAL_LOGIN, () => deepSeekMonitor.openDeepSeekExternalLogin())

const originalInit = async () => {
    app.setAsDefaultProtocolClient(APP_PROTOCOL)
    try {
        await createWindow()
        const nestApp = await bootstrapNestJS()
            ; (global as any).nestApp = nestApp

        const studyService = nestApp.get(StudyService)
        const mediaService = nestApp.get(MediaService)
        const webSocketService = nestApp.get(WebSocketService)
        nestLLMService = nestApp.get(LLMService)
        if (nestLLMService) {
            await nestLLMService.start()
        }
        llmControllerInstance = new LLMController(
            chatGPTMonitor.getChatGPTMonitor,
            chatGPTMonitor.getChatGPTEventBus,
            deepSeekMonitor.getDeepSeekMonitor,
            deepSeekMonitor.getDeepSeekEventBus
        )
        configControllerInstance = new ConfigController()
        authControllerInstance = new AuthController(
            chatGPTMonitor.setSessionToken,
            deepSeekMonitor.setDeepSeekSessionToken
        )
        studyControllerInstance = new StudyController(studyService)
        screenshotControllerInstance = new ScreenshotController(
            () => mainWindow,
            desktopCapturer,
            screen,
            systemPreferences
        )
        systemControllerInstance = new SystemController(mediaService)

        webSocketService.setup(WEBSOCKET_PORT, APP_PROTOCOL)
        startHTTPServer()
    } catch (err) {
        console.log("Initialization failed：" + JSON.stringify(err))
    }
}

function startHTTPServer() {
    const webServerApp = express()
    webServerApp.use(express.json())

    webServerApp.get('/api/config', configControllerInstance!.getConfig.bind(configControllerInstance))
    webServerApp.get('/api/show', llmControllerInstance!.getShow.bind(llmControllerInstance))
    webServerApp.get('/api/tags', llmControllerInstance!.getTags.bind(llmControllerInstance))
    webServerApp.post('/v1/chat/completions', llmControllerInstance!.chatCompletions.bind(llmControllerInstance))
    webServerApp.post('/v1/auth/token', authControllerInstance!.handleToken.bind(authControllerInstance))
    webServerApp.post('/api/study/request', studyControllerInstance!.handleRequest.bind(studyControllerInstance))
    webServerApp.get('/screenshot/app', screenshotControllerInstance!.getAppScreenshot.bind(screenshotControllerInstance))
    webServerApp.get('/screenshot/desktop', screenshotControllerInstance!.getDesktopScreenshot.bind(screenshotControllerInstance))
    webServerApp.get('/api/directory', systemControllerInstance!.readFileInDirectory.bind(systemControllerInstance))
    webServerApp.post('/api/video/merge', systemControllerInstance!.mergeVideo.bind(systemControllerInstance))

    httpServer = webServerApp.listen(WEB_SERVER_PORT, () => {
        console.log(`HTTP server started on port ${WEB_SERVER_PORT}`)
    })
    httpServer.on('error', (error: any) => {
        console.error('HTTP server error:', error)
    })
}

app.on('open-url', (event, url) => {
    event.preventDefault()
    console.log('Received URL:', url)
    try {
        const u = new URL(url)
        if (u.protocol === `${APP_PROTOCOL}:`) {
            if (u.host === 'auth') {
                const token = u.searchParams.get('token')
                if (token) chatGPTMonitor.setSessionToken(token)
            } else if (u.host === 'auth-deepseek') {
                const token = u.searchParams.get('token')
                if (token) deepSeekMonitor.setDeepSeekSessionToken(token)
            }
        }
    } catch (e) {
        console.error('Failed to parse incoming URL:', e)
    }
})

export { nestLLMService as llmService }
