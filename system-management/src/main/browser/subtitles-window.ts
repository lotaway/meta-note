import { BrowserWindow, screen } from 'electron'
import path from 'node:path'

export class SubtitlesWindow {
    private window: BrowserWindow | null = null

    constructor(private isDev: boolean, private preloadPath: string, private distPath: string) {}

    public open() {
        if (this.window && !this.window.isDestroyed()) {
            this.window.show()
            this.window.focus()
            return
        }

        const { width } = screen.getPrimaryDisplay().workAreaSize

        this.window = new BrowserWindow({
            width: 800,
            height: 150,
            x: Math.floor((width - 800) / 2),
            y: 20, // 屏幕顶部
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

        // 在 macOS 上允许在全屏应用上方显示
        this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
        this.window.setAlwaysOnTop(true, 'screen-saver')

        // 使用 hash 路由区分字幕窗口
        const baseUrl = this.isDev 
            ? `http://localhost:5173` 
            : `file://${path.join(process.resourcesPath, 'app', this.distPath)}`
        
        const url = `${baseUrl}#subtitles`
        
        console.log('[SubtitlesWindow] Loading URL:', url)
        this.window.loadURL(url)

        this.window.on('closed', () => {
            this.window = null
        })
    }

    public updateText(text: string) {
        if (this.exists()) {
            this.window?.webContents.send('subtitles:text', text)
        }
    }

    public updateStyle(style: any) {
        if (this.exists()) {
            this.window?.webContents.send('subtitles:style', style)
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
