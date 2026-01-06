import express from 'express'
import { ConfigController } from "./nestjs/controllers/config.controller"
import { LLMController } from "./nestjs/controllers/llm.controller"
import { AuthController } from "./nestjs/controllers/auth.controller"
import { StudyController } from "./nestjs/controllers/study.controller"
import { ScreenshotController } from "./nestjs/controllers/screenshot.controller"
import { SystemController } from "./nestjs/controllers/system.controller"
import { ROUTE_PATHS } from "./constants"

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
        private port: number
    ) {
        this.app = express()
        this.app.use(express.json())
        this.setupRoutes()
    }

    private setupRoutes() {
        this.app.get(ROUTE_PATHS.CONFIG, this.configController.getConfig.bind(this.configController))
        this.app.get(ROUTE_PATHS.SHOW, this.llmController.getShow.bind(this.llmController))
        this.app.get(ROUTE_PATHS.TAGS, this.llmController.getTags.bind(this.llmController))
        this.app.post(ROUTE_PATHS.CHAT_COMPLETIONS, this.llmController.chatCompletions.bind(this.llmController))
        this.app.post(ROUTE_PATHS.AUTH_TOKEN, this.authController.handleToken.bind(this.authController))
        this.app.post(ROUTE_PATHS.STUDY_REQUEST, this.studyController.handleRequest.bind(this.studyController))
        this.app.get(ROUTE_PATHS.SCREENSHOT_APP, this.screenshotController.getAppScreenshot.bind(this.screenshotController))
        this.app.get(ROUTE_PATHS.SCREENSHOT_DESKTOP, this.screenshotController.getDesktopScreenshot.bind(this.screenshotController))
        this.app.get(ROUTE_PATHS.DIRECTORY, this.systemController.readFileInDirectory.bind(this.systemController))
        this.app.post(ROUTE_PATHS.VIDEO_MERGE, this.systemController.mergeVideo.bind(this.systemController))
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
