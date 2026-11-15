import { app, BrowserWindow } from "electron"
import { LLMService } from "./nestjs/services/llm.service"
import { SubtitlesWindow } from "./browser/subtitles-window"
import { APP_DISPLAY_NAME } from "../brand"

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
    private subtitlesWindow: SubtitlesWindow | null = null

    constructor(
        private config: AppConfig,
        private getNestLLMService: () => LLMService | null,
        private onInit: () => Promise<void>
    ) {
        this.subtitlesWindow = new SubtitlesWindow(
            this.config.isDev, 
            this.config.preloadPath, 
            this.config.distPath
        )
    }

    getMainWindow() {
        return this.mainWindow
    }

    getSubtitlesWindow() {
        return this.subtitlesWindow
    }

    async createWindow() {
        this.mainWindow = new BrowserWindow({
            width: this.config.windowWidth,
            height: this.config.windowHeight,
            title: APP_DISPLAY_NAME,
            resizable: true,
            webPreferences: {
                devTools: this.config.isDev,
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                preload: this.config.preloadPath
            }
        })
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
        })

        void app.whenReady().then(() => {
            this.config.isLinux ? setTimeout(this.onInit, 300) : this.onInit()
        })
    }
}
