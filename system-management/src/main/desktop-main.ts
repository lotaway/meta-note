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
        if (mainWindow) {
            electronService.setMainWindow(mainWindow)
        }
    } catch (err) {
        console.log("Initialization failed：" + JSON.stringify(err))
    }
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
