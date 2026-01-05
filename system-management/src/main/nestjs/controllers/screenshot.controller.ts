import * as express from 'express'
import { HttpStatus } from '@nestjs/common'

export class ScreenshotController {
    constructor(
        private readonly getMainWindow: () => any,
        private readonly desktopCapturer: any,
        private readonly screen: any,
        private readonly systemPreferences: any
    ) { }

    async getAppScreenshot(req: express.Request, res: express.Response): Promise<void> {
        const mainWindow = this.getMainWindow()
        if (!mainWindow) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'No main window' })
            return
        }

        try {
            const image = await mainWindow.webContents.capturePage()
            const jpeg = image.toJPEG(80)
            res.set('Content-Type', 'image/jpeg')
            res.send(jpeg)
        } catch (err: any) {
            console.debug(`截图失败:${err}`)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `截图失败:${err}` })
        }
    }

    async getDesktopScreenshot(req: express.Request, res: express.Response): Promise<void> {
        const mainWindow = this.getMainWindow()
        if (!mainWindow) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'No main window' })
            return
        }

        const accessStatus = this.systemPreferences.getMediaAccessStatus("screen")
        if (accessStatus === "denied") {
            console.debug("Screen access denied")
            res.status(HttpStatus.FORBIDDEN).json({ error: "Screen access denied" })
            return
        }

        try {
            const displays = this.screen.getAllDisplays()
            const screenshots = []
            for (const display of displays) {
                const sources = await this.desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: {
                        width: display.size.width,
                        height: display.size.height
                    }
                }).catch((err: any) => {
                    console.debug(`截图失败:${err}`)
                })

                const displaySource = sources?.find(
                    (s: any) => s.display_id === display.id.toString()
                ) ?? null

                if (displaySource) {
                    screenshots.push({
                        display: display,
                        image: displaySource.thumbnail.toJPEG(80).toString('base64'),
                    })
                }
            }

            if (screenshots.length > 0) {
                res.json(screenshots)
            } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `截图失败` })
            }
        } catch (err: any) {
            console.error('Desktop screenshot error:', err)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: `截图失败` })
        }
    }
}