import { BrowserWindow, session, BrowserWindowConstructorOptions } from 'electron'
import path from 'node:path'

export interface BaseBrowserWindowOptions extends BrowserWindowConstructorOptions {
  url: string
  partition?: string
}

export class BaseBrowserWindow extends BrowserWindow {
  protected readonly defaultUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  protected url: string

  constructor(options: BaseBrowserWindowOptions) {
    const {
      url,
      width = 1200,
      height = 900,
      title = 'Browser Monitor',
      show = true,
      autoHideMenuBar = true,
      partition = 'persist:normal',
      ...browserWindowOptions
    } = options

    const webPreferences: BrowserWindowConstructorOptions['webPreferences'] = {
      preload: path.join(__dirname, 'preload.js'),
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      ...browserWindowOptions.webPreferences
    }

    super({
      width,
      height,
      title,
      show,
      autoHideMenuBar,
      webPreferences,
      ...browserWindowOptions
    })

    this.url = url

    this.webContents.setUserAgent(this.defaultUserAgent)

    this.on('closed', () => {
    })
  }

  public load(): void {
    this.loadURL(this.url)
  }
  public async setSessionCookie(cookie: {
    url: string
    name: string
    value: string
    domain: string
    path?: string
    secure?: boolean
    httpOnly?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
  }): Promise<void> {
    const defaultSession = session.defaultSession
    const cookieOptions = {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax' as any,
      ...cookie
    }

    try {
      await defaultSession.cookies.set(cookieOptions)
      console.log(`[${this.title}] Session cookie applied successfully`)
      this.loadURL(this.url)
    } catch (err) {
      console.error(`[${this.title}] Failed to set cookie:`, err)
      throw err
    }
  }

  public getUrl(): string {
    return this.url
  }

  public setUrl(url: string): void {
    this.url = url
  }

  public exists(): boolean {
    return !this.isDestroyed() && this.webContents && !this.webContents.isDestroyed()
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