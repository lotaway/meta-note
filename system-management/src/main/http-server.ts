import express from 'express'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { ConfigController } from "./nestjs/controllers/config.controller"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"
import { TTSController } from "./nestjs/controllers/tts.controller"
import { NoteController } from "./nestjs/controllers/note.controller"
import { StudyController } from "./nestjs/controllers/study.controller"

const LOOPBACK_HOST = '127.0.0.1'

export class HttpServer {
    private app: express.Express
    private server: any
    private readonly token: string

    constructor(
        private configController: ConfigController,
        private llmController: LLMController,
        private authController: AuthController,
        private screenshotController: ScreenshotController,
        private systemController: SystemController,
        private ttsController: TTSController,
        private noteController: NoteController,
        private studyController: StudyController,
        private port: number
    ) {
        this.token = process.env.LOCAL_API_TOKEN?.trim() || randomBytes(32).toString('hex')
        this.app = express()
        this.setupSecurity()
        this.app.use(express.json())
        this.setupRoutes()
    }

    getToken(): string {
        return this.token
    }

    private allowedOrigins(): Set<string> {
        const devPort = parseInt(process.env.DEV_SERVER_PORT || '5173', 10)
        return new Set([
            'null',
            `http://localhost:${devPort}`,
            `http://127.0.0.1:${devPort}`,
            `http://localhost:${this.port}`,
            `http://127.0.0.1:${this.port}`,
        ])
    }

    private setupSecurity() {
        const allowed = this.allowedOrigins()
        this.app.use((req, res, next) => {
            const origin = req.headers.origin
            if (origin && !allowed.has(origin)) {
                res.status(403).json({ error: 'Origin not allowed' })
                return
            }
            if (origin) {
                res.header('Access-Control-Allow-Origin', origin)
                res.header('Vary', 'Origin')
            }
            if (req.headers['access-control-request-private-network'] === 'true') {
                res.header('Access-Control-Allow-Private-Network', 'true')
            }
            res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Local-Api-Token')
            if (req.method === 'OPTIONS') {
                res.sendStatus(204)
                return
            }
            if (!this.isAuthorized(req)) {
                res.status(401).json({ error: 'Local API token required' })
                return
            }
            next()
        })
    }

    private isAuthorized(req: express.Request): boolean {
        const authorization = req.headers.authorization
        const bearer = typeof authorization === 'string' && authorization.startsWith('Bearer ')
            ? authorization.slice(7)
            : undefined
        const custom = req.headers['x-local-api-token']
        const queryToken = req.query.token
        const provided = bearer
            ?? (typeof custom === 'string' ? custom : undefined)
            ?? (typeof queryToken === 'string' ? queryToken : undefined)
        if (typeof provided !== 'string' || provided.length === 0) return false
        const expected = Buffer.from(this.token, 'utf8')
        const actual = Buffer.from(provided, 'utf8')
        if (expected.length !== actual.length) return false
        return timingSafeEqual(expected, actual)
    }

    private setupRoutes() {
        this.app.get('/api/config', this.configController.getConfig.bind(this.configController))
        this.app.post('/api/show', this.llmController.getShow.bind(this.llmController))
        this.app.get('/api/tags', this.llmController.getTags.bind(this.llmController))
        this.app.post('/v1/chat/completions', this.llmController.chatCompletions.bind(this.llmController))
        this.app.post('/v1/auth/token', this.authController.handleToken.bind(this.authController))
        this.app.get('/screenshot/app', this.screenshotController.getAppScreenshot.bind(this.screenshotController))
        this.app.get('/screenshot/desktop', this.screenshotController.getDesktopScreenshot.bind(this.screenshotController))
        this.app.get('/api/directory', this.systemController.readFileInDirectory.bind(this.systemController))
        this.app.post('/api/video/merge', this.systemController.mergeVideo.bind(this.systemController))

        // TTS Routes
        this.app.get('/api/tts/status', this.ttsController.getStatus.bind(this.ttsController))
        this.app.post('/api/tts/synthesize', this.ttsController.synthesize.bind(this.ttsController))
        this.app.get('/api/tts/download', this.ttsController.download.bind(this.ttsController))
        this.app.post('/api/tts/delete', this.ttsController.delete.bind(this.ttsController))

        // Note generation and study queue routes
        this.app.post('/api/note/generate', this.noteController.generate.bind(this.noteController))
        this.app.get('/api/note/status/:id', this.noteController.getStatus.bind(this.noteController))
        this.app.delete('/api/note/:id', this.noteController.deleteTask.bind(this.noteController))
        this.app.get('/api/note/:id', this.noteController.getResult.bind(this.noteController))
        this.app.post('/api/study/request', this.studyController.handleRequest.bind(this.studyController))
    }

    start() {
        this.server = this.app.listen(this.port, LOOPBACK_HOST, () => {
            console.log(`HTTP server started on ${LOOPBACK_HOST}:${this.port}`)
        })
        this.server.on('error', (error: any) => {
            console.error('HTTP server error:', error)
        })
        return this.server
    }
}
