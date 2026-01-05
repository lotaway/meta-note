import { HttpStatus } from '@nestjs/common'
import { StudyService } from '../services/study.service'
import * as express from 'express'

export class StudyController {
    constructor(private readonly studyService: StudyService) { }

    async handleRequest(req: express.Request, res: express.Response): Promise<void> {
        try {
            const payload = req.body
            const { platform, target, targetType, studyType } = payload

            if (!platform || !target || !targetType || !studyType) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing required fields' })
                return
            }

            const limitReached = await this.studyService.checkLimitCount()
            if (limitReached) {
                res.status(HttpStatus.FORBIDDEN).json({ error: 'Daily study limit reached' })
                return
            }

            await this.studyService.addTask(payload)
            res.json({ success: true, message: 'Study task added to queue' })
        } catch (err: any) {
            console.error('[Study API] Error:', err)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: String(err) })
        }
    }
}