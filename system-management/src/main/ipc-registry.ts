import { ipcMain } from "electron"
import { MediaService } from "./nestjs/services/media.service"
import { LLMService } from "./nestjs/services/llm.service"
import { IPC_CHANNELS } from "./constants"
import chatGPTMonitor from "./desktop-chatgpt"
import deepSeekMonitor from "./desktop-deepseek"
import { INestApplicationContext } from "@nestjs/common"

export class IpcRegistry {
    constructor(private getNestApp: () => INestApplicationContext | null) {}

    register() {
        ipcMain.handle(IPC_CHANNELS.READ_FILE_IN_DIRECTORY, (event, filePath) => {
            const nestApp = this.getNestApp()
            if (!nestApp) return null
            const mediaService = nestApp.get(MediaService)
            return mediaService.readFileInDirectory(filePath)
        })

        ipcMain.handle(IPC_CHANNELS.MERGE_VIDEO, async (event, videos, outputPath) => {
            const nestApp = this.getNestApp()
            if (!nestApp) return null
            const mediaService = nestApp.get(MediaService)
            return await mediaService.mergeVideo(videos, outputPath)
        })

        ipcMain.handle(IPC_CHANNELS.LLM_COMPLETION, async (event, prompt) => {
            const nestApp = this.getNestApp()
            if (!nestApp) return null
            const llmService = nestApp.get(LLMService)
            return await llmService.completion(prompt)
        })

        ipcMain.handle(IPC_CHANNELS.OPEN_CHATGPT_WINDOW, () => chatGPTMonitor.setupChatGPTMonitor())
        ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, () => chatGPTMonitor.openExternalLogin())
        ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_WINDOW, () => deepSeekMonitor.setupDeepSeekMonitor())
        ipcMain.handle(IPC_CHANNELS.OPEN_DEEPSEEK_EXTERNAL_LOGIN, () => deepSeekMonitor.openDeepSeekExternalLogin())
    }
}
