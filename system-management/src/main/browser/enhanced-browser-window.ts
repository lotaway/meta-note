import { EventEmitter } from 'node:events'
import fs from 'node:fs'
import { BaseBrowserWindow, BaseBrowserWindowOptions } from './base-browser-window'

export interface EnhancedBrowserWindowOptions extends BaseBrowserWindowOptions {
  injectScriptPath?: string
  sseRawPrefix?: string
  sseChunkEvent?: string
}

export class EnhancedBrowserWindow extends BaseBrowserWindow {
  protected eventBus: EventEmitter
  protected injectScriptPath?: string
  protected sseRawPrefix: string
  protected sseChunkEvent: string

  constructor(options: EnhancedBrowserWindowOptions) {
    super(options)

    this.eventBus = new EventEmitter()
    this.injectScriptPath = options.injectScriptPath
    this.sseRawPrefix = options.sseRawPrefix || '__SSE_PREFIX__'
    this.sseChunkEvent = options.sseChunkEvent || 'sse-chunk'

    this.setupConsoleMonitoring()
    this.setupInjection()
  }

  private setupConsoleMonitoring(): void {
    this.webContents.on('console-message', (event, level, message) => {
      if (message.startsWith(this.sseRawPrefix)) {
        const base64Data = message.substring(this.sseRawPrefix.length)
        try {
          const rawChunk = decodeURIComponent(escape(atob(base64Data)))
          this.eventBus.emit(this.sseChunkEvent, rawChunk)
        } catch (e) {
          console.error(`[${this.title}] Failed to decode raw chunk:`, e)
        }
      } else {
        console.log(`[${this.title} Web] ${message}`)
      }
    })
  }

  private setupInjection(): void {
    const inject = () => {
      const script = this.getInjectScript()
      if (!script) return

      this.webContents.executeJavaScript(script)
        .then(() => console.log(`[${this.title}] Injection success`))
        .catch(err => console.error(`[${this.title}] Injection failed:`, err))
    }

    this.webContents.on('did-finish-load', inject)
    this.webContents.on('did-navigate', inject)
    this.webContents.on('dom-ready', inject)
  }

  private getInjectScript(): string {
    if (!this.injectScriptPath) {
      return ''
    }

    if (fs.existsSync(this.injectScriptPath)) {
      return fs.readFileSync(this.injectScriptPath, 'utf8')
    }

    console.error(`[${this.title}] Inject script not found at:`, this.injectScriptPath)
    return ''
  }

  public getEventBus(): EventEmitter {
    return this.eventBus
  }

  public injectScript(): void {
    const script = this.getInjectScript()
    if (!script) return

    this.webContents.executeJavaScript(script)
      .then(() => console.log(`[${this.title}] Manual injection success`))
      .catch(err => console.error(`[${this.title}] Manual injection failed:`, err))
  }
}