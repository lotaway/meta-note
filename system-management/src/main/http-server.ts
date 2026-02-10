import express from 'express'
import { ConfigController } from "./nestjs/controllers/config.controller"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { NoteController } from "./nestjs/controllers/note.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { StudyController } from "./nestjs/controllers/study.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"
import { TTSController } from "./nestjs/controllers/tts.controller"

export class HttpServer {
    private app: express.Express
    private server: any

    constructor(
        private configController: ConfigController,
        private llmController: LLMController,
        private authController: AuthController,
        private studyController: StudyController,
        private screenshotController: ScreenshotController,
        private systemController: SystemController,
        private noteController: NoteController,
        private ttsController: TTSController,
        private port: number
    ) {
        this.app = express()
        this.setupCors()
        this.app.use(express.json())
        this.setupRoutes()
    }

    private setupCors() {
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
            if (req.method === 'OPTIONS') {
                res.sendStatus(204)
                return
            }
            next()
        })
    }

    private setupRoutes() {
        this.app.get('/api/config', this.configController.getConfig.bind(this.configController))
        this.app.post('/api/show', this.llmController.getShow.bind(this.llmController))
        this.app.get('/api/tags', this.llmController.getTags.bind(this.llmController))
        this.app.post('/v1/chat/completions', this.llmController.chatCompletions.bind(this.llmController))
        this.app.post('/v1/auth/token', this.authController.handleToken.bind(this.authController))
        this.app.post('/api/study/request', this.studyController.handleRequest.bind(this.studyController))
        this.app.get('/screenshot/app', this.screenshotController.getAppScreenshot.bind(this.screenshotController))
        this.app.get('/screenshot/desktop', this.screenshotController.getDesktopScreenshot.bind(this.screenshotController))
        this.app.get('/api/directory', this.systemController.readFileInDirectory.bind(this.systemController))
        this.app.post('/api/video/merge', this.systemController.mergeVideo.bind(this.systemController))
        this.app.post('/api/note/generate', this.noteController.generate.bind(this.noteController))
        this.app.get('/api/note/status/:id', this.noteController.getStatus.bind(this.noteController))
        this.app.get('/api/note/:id', this.noteController.getResult.bind(this.noteController))
        this.app.delete('/api/note/:id', this.noteController.deleteTask.bind(this.noteController))

        // TTS Routes
        this.app.get('/api/tts/status', this.ttsController.getStatus.bind(this.ttsController))
        this.app.post('/api/tts/synthesize', this.ttsController.synthesize.bind(this.ttsController))
        this.app.get('/api/tts/download', this.ttsController.download.bind(this.ttsController))
        this.app.post('/api/tts/delete', this.ttsController.delete.bind(this.ttsController))
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`HTTP server started on port ${this.port}`)
        })
        this.server.on('error', (error: any) => {
            console.error('HTTP server error:', error)
        })
        return this.server
    }
}
