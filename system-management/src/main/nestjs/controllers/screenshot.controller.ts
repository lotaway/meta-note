import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { ElectronService } from '../services/electron.service';
import { desktopCapturer, screen, systemPreferences } from 'electron';

@Controller('screenshot')
export class ScreenshotController {
    constructor(private readonly electronService: ElectronService) { }

    @Get('app')
    async getAppScreenshot(@Res() res: express.Response) {
        const mainWindow = this.electronService.getMainWindow();
        if (!mainWindow) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('No main window');
            return;
        }

        try {
            const image = await mainWindow.webContents.capturePage();
            const jpeg = image.toJPEG(80);
            res.set('Content-Type', 'image/jpeg');
            res.send(jpeg);
        } catch (err) {
            console.debug(`截图失败:${err}`);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`截图失败:${err}`);
        }
    }

    @Get('desktop')
    async getDesktopScreenshot(@Res() res: express.Response) {
        const mainWindow = this.electronService.getMainWindow();
        if (!mainWindow) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('No main window');
            return;
        }

        const accessStatus = systemPreferences.getMediaAccessStatus("screen");
        if (accessStatus === "denied") {
            console.debug("Screen access denied");
            res.status(HttpStatus.FORBIDDEN).send("Screen access denied");
            return;
        }

        try {
            const displays = screen.getAllDisplays();
            const screenshots = [];
            for (const display of displays) {
                const sources = await desktopCapturer.getSources({
                    types: ['screen'],
                    thumbnailSize: {
                        width: display.size.width,
                        height: display.size.height
                    }
                }).catch(err => {
                    console.debug(`截图失败:${err}`);
                });

                const displaySource = sources?.find(
                    s => s.display_id === display.id.toString()
                ) ?? null;

                if (displaySource) {
                    screenshots.push({
                        display: display,
                        image: displaySource.thumbnail.toJPEG(80).toString('base64'), // Convert to base64 for JSON response
                    });
                }
            }

            if (screenshots.length > 0) {
                res.json(screenshots);
            } else {
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`截图失败`);
            }
        } catch (err) {
            console.error('Desktop screenshot error:', err);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`截图失败`);
        }
    }
}
