import * as express from 'express'
import { HttpStatus } from '@nestjs/common'

export class AuthController {
    constructor(
        private readonly setSessionToken: (token: string) => void,
        private readonly setDeepSeekSessionToken: (token: string) => void
    ) { }

    async handleToken(req: express.Request, res: express.Response): Promise<void> {
        try {
            const { token, model = 'chatgpt' } = req.body

            if (!token) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing token' })
                return
            }

            if (model === 'chatgpt') {
                this.setSessionToken(token)
            } else if (model === 'deepseek') {
                this.setDeepSeekSessionToken(token)
            } else {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Unsupported model' })
                return
            }

            console.log(`[API] Received session token for ${model} from external source`)
            res.json({ status: 'success', model })
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }
}