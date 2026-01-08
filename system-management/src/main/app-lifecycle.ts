import { app, BrowserWindow } from "electron"
import * as remote from "@electron/remote/main"
import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"
import { LLMService } from "./nestjs/services/llm.service"

export interface AppConfig {
    isDev: boolean
    isMac: boolean
    isLinux: boolean
    devServerPort: number
    windowWidth: number
    windowHeight: number
    appProtocol: string
    preloadPath: string
    distPath: string
}

export class AppLifecycle {
    private mainWindow: BrowserWindow | null = null

    constructor(
        private config: AppConfig,
        private getNestLLMService: () => LLMService | null,
        private onInit: () => Promise<void>
    ) { }

    getMainWindow() {
        return this.mainWindow
    }

    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: this.config.windowWidth,
            height: this.config.windowHeight,
            resizable: true,
            webPreferences: {
                devTools: this.config.isDev,
                nodeIntegration: true,
                contextIsolation: false,
                preload: this.config.preloadPath
            }
        })
        remote.initialize()
        remote.enable(this.mainWindow.webContents)
        if (this.config.isDev) {
            await this.mainWindow.loadURL(`http://localhost:${this.config.devServerPort}`)
        } else {
            await this.mainWindow.loadFile(this.config.distPath)
        }
    }

    setupEventListeners() {
        const gotLock = app.requestSingleInstanceLock()
        if (!gotLock) {
            return app.quit()
        }

        app.on('second-instance', (event, argv) => {
            console.log('Re-launched args:', argv)
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore()
                this.mainWindow.focus()
            }
        })

        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length > 0 && this.mainWindow !== null) {
                return
            }
            void this.createWindow().catch(err => {
                console.error("重新创建窗口失败", err)
            })
        })

        app.on("window-all-closed", async () => {
            const llmService = this.getNestLLMService()
            if (llmService) {
                await llmService.stop()
            }
            !this.config.isMac && app.quit()
        })

        app.on('open-url', (event, url) => {
            event.preventDefault()
            console.log('Received URL:', url)
            try {
                const u = new URL(url)
                if (u.protocol !== `${this.config.appProtocol}:`) {
                    return
                }
                if (u.host === 'auth') {
                    const token = u.searchParams.get('token')
                    if (token) chatGPTMonitor.setSessionToken(token)
                } else if (u.host === 'auth-deepseek') {
                    const token = u.searchParams.get('token')
                    if (token) deepSeekMonitor.setDeepSeekSessionToken(token)
                }
            } catch (e) {
                console.error('Failed to parse incoming URL:', e)
            }
        })

        void app.whenReady().then(() => {
            this.config.isLinux ? setTimeout(this.onInit, 300) : this.onInit()
        })
    }
}
