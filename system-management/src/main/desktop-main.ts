import "reflect-metadata"
import { app, BrowserWindow, desktopCapturer, ipcMain, screen, systemPreferences } from "electron"
import * as remote from "@electron/remote/main"
import path from "node:path"
import fs from "node:fs"
import { WebSocketServer } from 'ws'
import ffmpeg from "fluent-ffmpeg"
import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"
import dotenv from 'dotenv'
import { IPC_CHANNELS } from "./constants"

import { llmService } from "./services/llm"
import { bootstrapNestJS } from "./nestjs/main"
import { ElectronService } from "./nestjs/services/electron.service"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { ConfigController } from "./nestjs/controllers/config.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { StudyController } from "./nestjs/controllers/study.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import express from 'express'
import { HttpStatus } from '@nestjs/common'

dotenv.config()

ffmpeg.setFfmpegPath(__dirname)

const isDev = process.env.NODE_ENV === "development"
const isLinux = process.platform === "linux"
const isWin = process.platform === "win32"
const isMac = process.platform === "darwin"

const APP_PROTOCOL = process.env.APP_PROTOCOL || "meta-note"
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || "5050", 10)
const WEB_SERVER_PORT = parseInt(process.env.WEB_SERVER_PORT || "5051", 10)
const DEV_SERVER_PORT = parseInt(process.env.DEV_SERVER_PORT || "5173", 10)
const WINDOW_WIDTH = parseInt(process.env.WINDOW_WIDTH || "1200", 10)
const WINDOW_HEIGHT = parseInt(process.env.WINDOW_HEIGHT || "800", 10)
const PROXY_URL = process.env.PROXY_URL || ""

let mainWindow: InstanceType<typeof BrowserWindow> | null = null
let llmControllerInstance: LLMController | null = null
let configControllerInstance: ConfigController | null = null
let authControllerInstance: AuthController | null = null
let studyControllerInstance: StudyController | null = null
let screenshotControllerInstance: ScreenshotController | null = null
let httpServer: any = null

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

const args = process.argv
console.log('Args:', args)
const wss = new WebSocketServer({ port: WEBSOCKET_PORT })
console.log(`WebSocketServer started on port ${WEBSOCKET_PORT}`)

app.on("window-all-closed", async () => {
    await llmService.stop()
    !isMac && app.quit()
})

void app.whenReady().then(() => {
    // 延迟解决莫名其妙的ready未完成问题：https://github.com/electron/electron/issues/16809
    isLinux ? setTimeout(originalInit, 300) : originalInit()
})

class Handler {
    static readFileInDirectory(directory: string) {
        const names = getIncludeFiles(directory)
        const paths = filename2path(names, directory)
        return {
            names,
            paths
        }
    }
}

function getIncludeFiles(path: string) {
    const dirents = fs.readdirSync(path, {
        withFileTypes: true
    }) as any[]
    if (dirents.length === 0) return []
    return dirents.filter(item => item.isFile()).map(item => item.name)
}

function filename2path(filenames: string[], prevFix: string): string[] {
    return filenames.map(filename => path.join(prevFix, filename))
}

async function mergeVideo(filePaths: string[], outputPath: string): Promise<any> {
    const ffmpegProcess = ffmpeg()
    filePaths.forEach(videoPath => {
        ffmpegProcess.addInput(videoPath)
    })
    ffmpegProcess.mergeToFile(`${outputPath}/generate.mp4`, outputPath)
    ffmpegProcess.on('progress', (progress: any) => {
        console.log("Merging... : " + progress.percent + "%")
    })
    return await new Promise((resolve, reject) => {
        ffmpegProcess.on('end', (stdout: string | null, stderr: string | null) => {
            console.info('Merging finished !')
            resolve({
                statusMsg: 'Merging finished !',
                outputPath
            })
        })
        ffmpegProcess.on('error', (error: Error, stdout: string | null, stderr: string | null) => {
            console.error('An error occurred: ' + error.message)
            console.log("ffmpeg stdout:\n" + stdout)
            console.log("ffmpeg stderr:\n" + stderr)
            reject({
                error,
                stdout,
                stderr
            })
        })
    })
}

ipcMain.handle("readFileInDirectory", (event, filePath: string) => Handler.readFileInDirectory(filePath))
ipcMain.handle("mergeVideo", async (event, videos: string[], outputPath: string) => await mergeVideo(videos, outputPath))

ipcMain.handle("llm:completion", async (event, prompt: string) => {
    return await llmService.completion(prompt)
})

ipcMain.handle(IPC_CHANNELS.OPEN_CHATGPT_WINDOW, () => {
    chatGPTMonitor.setupChatGPTMonitor()
})

ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, () => {
    chatGPTMonitor.openExternalLogin()
})


const originalInit = async () => {
    app.setAsDefaultProtocolClient(APP_PROTOCOL)
    try {
        await createWindow()
        const nestApp = await bootstrapNestJS()
        const electronService = nestApp.get(ElectronService)
        const studyService = nestApp.get(StudyService)
        llmControllerInstance = new LLMController()
        configControllerInstance = new ConfigController()
        authControllerInstance = new AuthController()
        studyControllerInstance = new StudyController(studyService)
        screenshotControllerInstance = new ScreenshotController()

        if (mainWindow) {
            electronService.setMainWindow(mainWindow)
        }
        startHTTPServer()
    } catch (err) {
        console.log("Initialization failed：" + JSON.stringify(err))
    }
}

function startHTTPServer() {
    const app = express()
    app.use(express.json())

    app.get('/api/config', (req, res) => {
        try {
            const result = configControllerInstance!.getConfig()
            res.json(result)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    app.get('/api/show', (req, res) => {
        try {
            const result = llmControllerInstance!.getShow()
            res.json(result)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    app.get('/api/tags', (req, res) => {
        try {
            const result = llmControllerInstance!.getTags()
            res.json(result)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    app.post('/v1/chat/completions', async (req, res) => {
        try {
            const payload = req.body
            const result = await llmControllerInstance!.chatCompletions(
                payload,
                () => chatGPTMonitor.getChatGPTMonitor(),
                () => chatGPTMonitor.getChatGPTEventBus(),
                () => deepSeekMonitor.getDeepSeekMonitor(),
                () => deepSeekMonitor.getDeepSeekEventBus()
            )

            if (result.status && result.status >= 400) {
                res.status(result.status).json({ error: result.error })
                return
            }

            if (payload.stream) {
                res.writeHead(HttpStatus.OK, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                })
                // @TODO 
                res.write(`data: ${JSON.stringify({ message: 'Streaming not yet implemented' })}\n\n`)
                res.write('data: [DONE]\n\n')
                res.end()
            } else {
                res.json(result.data || result)
            }
        } catch (error: any) {
            console.error('Error in chat completions:', error)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    app.post('/v1/auth/token', async (req, res) => {
        try {
            const payload = req.body
            const result = await authControllerInstance!.handleToken(
                payload,
                (token: string) => chatGPTMonitor.setSessionToken(token),
                (token: string) => deepSeekMonitor.setDeepSeekSessionToken(token)
            )

            if (result.status && result.status >= 400) {
                res.status(result.status).json({ error: result.error })
            } else {
                res.json(result)
            }
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })
    app.post('/api/study/request', async (req, res) => {
        try {
            const payload = req.body
            const result = await studyControllerInstance!.handleRequest(payload)

            if (result.status && result.status >= 400) {
                res.status(result.status).json({ error: result.error })
            } else {
                res.json(result)
            }
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })
    app.get('/screenshot/app', async (req, res) => {
        try {
            const result = await screenshotControllerInstance!.getAppScreenshot(mainWindow)

            if (result.status && result.status >= 400) {
                res.status(result.status).json({ error: result.error })
            } else if (result.contentType) {
                res.set('Content-Type', result.contentType)
                res.send(result.data)
            } else {
                res.json(result)
            }
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    app.get('/screenshot/desktop', async (req, res) => {
        try {
            const result = await screenshotControllerInstance!.getDesktopScreenshot(
                mainWindow,
                desktopCapturer,
                screen,
                systemPreferences
            )

            if (result.status && result.status >= 400) {
                res.status(result.status).json({ error: result.error })
            } else {
                res.json(result)
            }
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    })

    const port = WEB_SERVER_PORT
    httpServer = app.listen(port, () => {
        console.log(`HTTP server started on port ${port}`)
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
                if (token) {
                    chatGPTMonitor.setSessionToken(token)
                }
            } else if (u.host === 'auth-deepseek') {
                const token = u.searchParams.get('token')
                if (token) {
                    deepSeekMonitor.setDeepSeekSessionToken(token)
                }
            }
        }
    } catch (e) {
        console.error('Failed to parse incoming URL:', e)
    }
})

wss.on('connection', ws => {
    const socket = (ws as any)._socket
    if (socket && socket.remoteAddress && socket.remotePort) {
        console.log(`[WebSocket] New connection from ${socket.remoteAddress}:${socket.remotePort}`)
    } else {
        console.log('[WebSocket] New connection established')
    }

    ws.on('message', (data: object) => {
        const messageStr = data.toString()
        console.log('[WebSocket] Received:', messageStr)

        try {
            const message = JSON.parse(messageStr)
            if (message.type === 'login_request') {
                const model = message.model || 'chatgpt'
                console.log(`[WebSocket] Login request received for ${model}, opening external login...`)

                if (model === 'chatgpt') {
                    chatGPTMonitor.openExternalLogin()
                } else if (model === 'deepseek') {
                    deepSeekMonitor.openDeepSeekExternalLogin()
                } else {
                    ws.send(JSON.stringify({
                        type: 'login_response',
                        status: 'error',
                        error: 'Unsupported model'
                    }))
                    return
                }

                ws.send(JSON.stringify({
                    type: 'login_response',
                    status: 'success',
                    message: `External login initiated for ${model}`,
                    model
                }))
            } else {
                console.log('[WebSocket] Unknown message type:', message.type)
                ws.send(JSON.stringify({
                    type: 'error',
                    error: 'Unknown message type'
                }))
            }
        } catch (err) {
            console.log('[WebSocket] Non-JSON message or parse error:', messageStr)
            ws.send(`Hello from ${APP_PROTOCOL}!`)
        }
    })

    ws.on('error', (error) => {
        console.error('[WebSocket] Connection error:', error)
    })

    ws.on('close', () => {
        console.log('[WebSocket] Connection closed')
    })
    ws.send(JSON.stringify({
        type: 'welcome',
        protocol: APP_PROTOCOL,
        timestamp: Date.now(),
        supported_models: ['chatgpt', 'deepseek']
    }))
})

ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_WINDOW, () => {
    deepSeekMonitor.setupDeepSeekMonitor()
})

ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_EXTERNAL_LOGIN, () => {
    deepSeekMonitor.openDeepSeekExternalLogin()
})

export { llmService }
