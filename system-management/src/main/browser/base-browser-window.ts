import { BrowserWindow, session, type BrowserWindowConstructorOptions } from 'electron'
import path from 'node:path'
import { APP_DISPLAY_NAME } from '../../brand'

export interface BaseBrowserWindowOptions extends BrowserWindowConstructorOptions {
    url: string
    partition?: string
}

export interface SessionCookieInput {
    url: string
    name: string
    value: string
    domain: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'strict' | 'lax' | 'unspecified'
}

export class BaseBrowserWindow extends BrowserWindow {
    protected readonly defaultUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    protected url: string
    protected readonly partition: string

    constructor(options: BaseBrowserWindowOptions) {
        const {
            url,
            width = 1200,
            height = 900,
            title = APP_DISPLAY_NAME,
            show = true,
            autoHideMenuBar = true,
            partition = 'persist:monitor',
            ...browserWindowOptions
        } = options

        const isDev = process.env.NODE_ENV === 'development'

        const webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
            preload: path.join(__dirname, '../preload/monitor-preload.js'),
            partition,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            devTools: isDev,
        }

        super({
            ...browserWindowOptions,
            width,
            height,
            title,
            show,
            autoHideMenuBar,
            webPreferences,
        })

        this.url = url
        this.partition = partition
        this.webContents.setUserAgent(this.defaultUserAgent)
    }

    public load(): void {
        void this.loadURL(this.url).catch(err => {
            console.error(`[${this.getTitle()}] Failed to load URL:`, err)
        })
    }

    public async setSessionCookie(cookie: SessionCookieInput): Promise<void> {
        const targetSession = session.fromPartition(this.partition)
        const cookieOptions = {
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'lax' as const,
            ...cookie,
        }
        await targetSession.cookies.set(cookieOptions as Electron.CookiesSetDetails)
        this.load()
    }

    public getUrl(): string {
        return this.url
    }

    public setUrl(url: string): void {
        this.url = url
    }

    public exists(): boolean {
        return !this.isDestroyed() && !this.webContents.isDestroyed()
    }

    public focus(): void {
        if (this.exists()) {
            super.focus()
        }
    }

    public close(): void {
        if (!this.isDestroyed()) {
            super.close()
        }
    }
}
