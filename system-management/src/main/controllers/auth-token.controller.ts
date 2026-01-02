import { IncomingMessage, ServerResponse } from 'node:http'
import { ROUTE_PATHS } from '../constants'
import { setSessionToken } from '../desktop-chatgpt'
import { setDeepSeekSessionToken } from '../desktop-deepseek'
import { RouteController } from './route-controller.interface'

export class AuthTokenController implements RouteController {
    checker(req: IncomingMessage): boolean {
        return req.method === 'POST' && req.url === ROUTE_PATHS.AUTH_TOKEN
    }

    handler(req: IncomingMessage, res: ServerResponse): void {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
            try {
                const payload = JSON.parse(body)
                const { token, model = 'chatgpt' } = payload

                if (!token) {
                    res.writeHead(400)
                    res.end(JSON.stringify({ error: 'Missing token' }))
                    return
                }
                if (model === 'chatgpt') {
                    setSessionToken(token)
                } else if (model === 'deepseek') {
                    setDeepSeekSessionToken(token)
                } else {
                    res.writeHead(400)
                    res.end(JSON.stringify({ error: 'Unsupported model' }))
                    return
                }

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 'success', model }))
                console.log(`[API] Received session token for ${model} from external source`)
            } catch (err) {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
        })
    }
}