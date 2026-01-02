import { IncomingMessage, ServerResponse } from 'node:http'

export interface RouteController {

    checker(req: IncomingMessage): boolean

    handler(req: IncomingMessage, res: ServerResponse): void | Promise<void>
}