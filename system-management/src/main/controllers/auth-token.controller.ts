import { IncomingMessage, ServerResponse } from 'node:http'
import { ROUTE_PATHS } from '../constants'
import { setSessionToken } from '../desktop-chatgpt'
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
                const { token } = JSON.parse(body)
                if (token) {
                    setSessionToken(token)
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ status: 'success' }))
                    console.log('[API] Received session token from external source')
                } else {
                    res.writeHead(400)
                    res.end(JSON.stringify({ error: 'Missing token' }))
                }
            } catch (err) {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Invalid JSON' }))
            }
        })
    }
}