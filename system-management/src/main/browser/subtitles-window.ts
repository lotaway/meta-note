import { BrowserWindow, screen } from 'electron'
import path from 'node:path'
import { IPC_CHANNELS, SUBTITLES_WINDOW_CONSTANTS } from '../constants'

export interface SubtitleStyle {
    color?: string
    strokeColor?: string
    fontSize?: number
    strokeWidth?: number
}

export class SubtitlesWindow {
    private window: BrowserWindow | null = null

    constructor(
        private isDev: boolean,
        private preloadPath: string,
        private distPath: string
    ) { }

    public open() {
        if (this.exists()) {
            this.window?.show()
            this.window?.focus()
            return
        }

        const { width } = screen.getPrimaryDisplay().workAreaSize
        const windowWidth = SUBTITLES_WINDOW_CONSTANTS.DEFAULT_WIDTH
        const windowHeight = SUBTITLES_WINDOW_CONSTANTS.DEFAULT_HEIGHT

        this.window = new BrowserWindow({
            width: windowWidth,
            height: windowHeight,
            x: Math.floor((width - windowWidth) / 2),
            y: SUBTITLES_WINDOW_CONSTANTS.DEFAULT_TOP_OFFSET,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: true,
            hasShadow: false,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                preload: this.preloadPath
            }
        })

        this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        this.window.setAlwaysOnTop(true, 'screen-saver')

        const baseUrl = this.isDev
            ? `http://localhost:${import.meta.env.VITE_DEV_SERVER_PORT || '5173'}`
            : `file://${path.join(process.resourcesPath, 'app', this.distPath)}`

        const url = `${baseUrl}#${SUBTITLES_WINDOW_CONSTANTS.ROUTE_HASH}`
        this.window.loadURL(url)

        this.window.on('closed', () => {
            this.window = null
        })
    }

    public updateText(text: string) {
        if (this.exists()) {
            this.window?.webContents.send(IPC_CHANNELS.SUBTITLES_TEXT, text)
        }
    }

    public updateStyle(style: SubtitleStyle) {
        if (this.exists()) {
            this.window?.webContents.send(IPC_CHANNELS.SUBTITLES_STYLE, style)
        }
    }

    public close() {
        if (this.exists()) {
            this.window?.close()
        }
    }

    public exists() {
        return this.window !== null && !this.window.isDestroyed()
    }
}
