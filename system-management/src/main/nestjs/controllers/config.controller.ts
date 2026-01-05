import { HttpStatus } from '@nestjs/common'
import * as express from 'express'

export class ConfigController {
    getConfig(req: express.Request, res: express.Response) {
        try {
            const config = {
                STUDY_LIST_LIMIT_COUNT: parseInt(process.env.STUDY_LIST_LIMIT_COUNT || '10'),
                STUDY_LIMIT_TIME: parseInt(process.env.STUDY_LIMIT_TIME || '45'),
                LOCAL_LLM_PROVIDER: !!process.env.LOCAL_LLM_PROVIDER,
            }
            res.json(config)
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }
}