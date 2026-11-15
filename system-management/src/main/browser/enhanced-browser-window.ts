import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import { ipcMain } from 'electron'
import { BaseBrowserWindow, type BaseBrowserWindowOptions } from './base-browser-window'
import { AI_CHAT_CONSTANTS, IPC_CHANNELS } from '../constants'

export interface EnhancedBrowserWindowOptions extends BaseBrowserWindowOptions {
    injectScriptPath?: string
    sseChunkEvent?: string
}

export class EnhancedBrowserWindow extends BaseBrowserWindow {
    protected readonly eventBus = new EventEmitter()
    private readonly injectScriptPath?: string
    private readonly sseChunkEvent: string
    private readonly sseListener: (event: Electron.IpcMainEvent, chunk: unknown) => void

    constructor(options: EnhancedBrowserWindowOptions) {
        const { injectScriptPath, sseChunkEvent, ...baseOptions } = options
        super(baseOptions)

        this.injectScriptPath = injectScriptPath
        this.sseChunkEvent = sseChunkEvent || AI_CHAT_CONSTANTS.SSE_CHUNK_EVENT
        this.eventBus.setMaxListeners(0)

        this.sseListener = (event, chunk) => {
            if (event.sender.id !== this.webContents.id) return
            if (typeof chunk !== 'string' || chunk.length === 0) return
            this.eventBus.emit(this.sseChunkEvent, chunk)
        }

        ipcMain.on(IPC_CHANNELS.MONITOR_SSE_CHUNK, this.sseListener)
        this.on('closed', () => {
            ipcMain.removeListener(IPC_CHANNELS.MONITOR_SSE_CHUNK, this.sseListener)
        })

        this.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
            console.error(`[${this.getTitle()}] Failed to load ${validatedURL}:`, errorDescription, `(code: ${errorCode})`)
        })
        this.webContents.on('did-finish-load', () => this.injectScript())
    }

    public getEventBus(): EventEmitter {
        return this.eventBus
    }

    public injectScript(): void {
        const script = this.getInjectScript()
        if (!script) return
        void this.webContents.executeJavaScript(script).catch(err => {
            console.error(`[${this.getTitle()}] Injection failed:`, err)
        })
    }

    private getInjectScript(): string {
        if (!this.injectScriptPath) return ''
        if (!fs.existsSync(this.injectScriptPath)) {
            console.error(`[${this.getTitle()}] Inject script not found at:`, this.injectScriptPath)
            return ''
        }
        return fs.readFileSync(this.injectScriptPath, 'utf8')
    }
}
