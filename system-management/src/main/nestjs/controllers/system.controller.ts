import * as express from 'express'
import { HttpStatus } from '@nestjs/common'
import { MediaService } from '../services/media.service'

export class SystemController {
    constructor(private readonly mediaService: MediaService) { }

    readFileInDirectory(req: express.Request, res: express.Response) {
        try {
            const { filePath } = req.query as { filePath: string }
            if (!filePath) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing filePath' })
                return
            }

            const result = this.mediaService.readFileInDirectory(filePath)
            res.json(result)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }

    async mergeVideo(req: express.Request, res: express.Response) {
        try {
            const { videos, outputPath } = req.body as { videos: string[], outputPath: string }
            if (!videos || !outputPath) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing videos or outputPath' })
                return
            }

            const result = await this.mediaService.mergeVideo(videos, outputPath)
            res.json(result)
        } catch (error: any) {
            console.error('Merge video error:', error)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: error.error?.message || error.message,
                stdout: error.stdout,
                stderr: error.stderr
            })
        }
    }
}
