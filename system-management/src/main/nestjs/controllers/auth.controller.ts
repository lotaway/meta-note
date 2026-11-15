import * as express from 'express'
import { HttpStatus } from '@nestjs/common'
import { MONITOR_PROVIDERS } from '../../constants'

const MAX_TOKEN_LENGTH = 8192

export class AuthController {
    constructor(
        private readonly setSessionToken: (token: string) => void,
        private readonly setDeepSeekSessionToken: (token: string) => void
    ) { }

    async handleToken(req: express.Request, res: express.Response): Promise<void> {
        try {
            const { token, model = 'chatgpt' } = req.body ?? {}

            if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing token' })
                return
            }

            if (typeof model !== 'string' || !(MONITOR_PROVIDERS as readonly string[]).includes(model)) {
                res.status(HttpStatus.BAD_REQUEST).json({ error: 'Unsupported model' })
                return
            }

            if (model === 'chatgpt') {
                this.setSessionToken(token)
            } else {
                this.setDeepSeekSessionToken(token)
            }

            res.json({ status: 'success', model })
        } catch (error: any) {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: error.message })
        }
    }
}
