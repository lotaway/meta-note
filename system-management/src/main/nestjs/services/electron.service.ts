import { Injectable } from '@nestjs/common'
import { BrowserWindow } from 'electron'

@Injectable()
export class ElectronService {
    private mainWindow: BrowserWindow | null = null;

    setMainWindow(window: BrowserWindow) {
        this.mainWindow = window
    }

    getMainWindow(): BrowserWindow | null {
        return this.mainWindow
    }
}
