export class ScreenshotController {
    async getAppScreenshot(mainWindow: any): Promise<any> {
        if (!mainWindow) {
            return { status: 500, error: 'No main window' }
        }

        try {
            const image = await mainWindow.webContents.capturePage()
            const jpeg = image.toJPEG(80)
            return {
                status: 200,
                contentType: 'image/jpeg',
                data: jpeg
            }
        } catch (err: any) {
            console.debug(`截图失败:${err}`)
            return { status: 500, error: `截图失败:${err}` }
        }
    }

    async getDesktopScreenshot(
        mainWindow: any,
        desktopCapturer: any,
        screen: any,
        systemPreferences: any
    ): Promise<any> {
        if (!mainWindow) {
            return { status: 500, error: 'No main window' }
        }

        const accessStatus = systemPreferences.getMediaAccessStatus("screen")
        if (accessStatus === "denied") {
            console.debug("Screen access denied")
            return { status: 403, error: "Screen access denied" }
        }

        try {
            const displays = screen.getAllDisplays()
            const screenshots = []
            for (const display of displays) {
                const sources = await desktopCapturer.getSources({
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
                return { status: 200, data: screenshots }
            } else {
                return { status: 500, error: `截图失败` }
            }
        } catch (err: any) {
            console.error('Desktop screenshot error:', err)
            return { status: 500, error: `截图失败` }
        }
    }
}