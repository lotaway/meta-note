import * as express from 'express'
import { HttpStatus } from '@nestjs/common'
import { MediaService } from '../services/media.service'

const MAX_PATH_LENGTH = 4096
const MAX_VIDEO_PATHS = 64

function validPath(value: unknown): value is string {
    if (typeof value !== 'string') return false
    if (value.length === 0 || value.length > MAX_PATH_LENGTH) return false
    if (value.includes('\0')) return false
    return !value.split(/[\\/]+/).includes('..')
}

export class SystemController {
    constructor(private readonly mediaService: MediaService) { }

    readFileInDirectory(req: express.Request, res: express.Response) {
        const { filePath } = req.query as { filePath?: unknown }
        if (!validPath(filePath)) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid filePath' })
            return
        }

        try {
            const result = this.mediaService.readFileInDirectory(filePath)
            res.json(result)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }

    async mergeVideo(req: express.Request, res: express.Response) {
        const { videos, outputPath } = (req.body ?? {}) as { videos?: unknown, outputPath?: unknown }

        if (!Array.isArray(videos) || videos.length === 0 || videos.length > MAX_VIDEO_PATHS || !videos.every(validPath)) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid videos' })
            return
        }
        if (!validPath(outputPath)) {
            res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid outputPath' })
            return
        }

        try {
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
