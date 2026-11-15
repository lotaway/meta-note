import { ipcMain, desktopCapturer, dialog, shell } from "electron"
import os from "node:os"
import fs from "node:fs"
import path from "node:path"
import { MediaService } from "./nestjs/services/media.service"
import { LLMService } from "./nestjs/services/llm.service"
import { IPC_CHANNELS, EXTERNAL_TARGETS, MONITOR_PROVIDERS, type ExternalTarget, type MonitorProvider } from "./constants"
import { INestApplicationContext } from "@nestjs/common"
import { getAudioManager } from "./rust-bridge"
import { DirectoryAllowlist, isNonEmptyString } from "./path-guard"

const MAX_PROMPT_LENGTH = 100_000

export interface IpcCallbacks {
    getLocalApiToken?: () => string | null
    getGatewayToken?: () => Promise<string | null> | string | null
    invalidateGatewayToken?: () => void
    openMonitorWindow?: (provider: MonitorProvider) => void
    openExternalLogin?: (provider: MonitorProvider) => void
}

export class IpcRegistry {
    private readonly allowlist = new DirectoryAllowlist()

    constructor(
        private getNestApp: () => INestApplicationContext | null,
        private getAppLifecycle: () => any,
        private callbacks: IpcCallbacks = {}
    ) { }

    register() {
        this.registerFileHandlers()
        this.registerSubtitleHandlers()
        this.registerAudioHandlers()
        this.registerSystemHandlers()
        this.registerMonitorHandlers()
    }

    private assertMonitorProvider(value: unknown): MonitorProvider {
        if (typeof value !== 'string' || !(MONITOR_PROVIDERS as readonly string[]).includes(value)) {
            throw new Error('Unknown monitor provider')
        }
        return value as MonitorProvider
    }

    private requireNestApp() {
        const nestApp = this.getNestApp()
        if (!nestApp) throw new Error('Nest application context is not ready')
        return nestApp
    }

    private canonical(input: string) {
        return fs.existsSync(input) ? fs.realpathSync(input) : path.resolve(input)
    }

    private assertAllowed(target: unknown, label: string): string {
        if (!isNonEmptyString(target)) {
            throw new Error(`${label} must be a non-empty path`)
        }
        if (!this.allowlist.isAllowed(this.canonical(target))) {
            throw new Error(`${label} is outside the granted directories`)
        }
        return target
    }

    private getSubtitlesWindow() {
        return this.getAppLifecycle().getSubtitlesWindow() ?? null
    }

    private registerFileHandlers() {
        ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, (_e, options) => this.selectDirectory(options))
        ipcMain.handle(IPC_CHANNELS.READ_FILE_IN_DIRECTORY, (_e, directory) => this.readDirectory(directory))
        ipcMain.handle(IPC_CHANNELS.MERGE_VIDEO, (_e, videos, output) => this.mergeVideo(videos, output))
        ipcMain.handle(IPC_CHANNELS.LLM_COMPLETION, (_e, prompt) => this.completePrompt(prompt))
    }

    private async selectDirectory(options: unknown) {
        const input = (options ?? {}) as { title?: unknown; defaultPath?: unknown }
        const title = isNonEmptyString(input.title) ? input.title : 'Select a directory'
        const requested = input.defaultPath
        const defaultPath = isNonEmptyString(requested) && this.allowlist.isAllowed(this.canonical(requested))
            ? requested
            : undefined
        const result = await dialog.showOpenDialog({ title, defaultPath, properties: ['openDirectory'] })
        if (result.canceled || result.filePaths.length === 0) return null
        const selected = result.filePaths[0]
        this.allowlist.grant(this.canonical(selected))
        return selected
    }

    private async readDirectory(directory: unknown) {
        const safeDirectory = this.assertAllowed(directory, 'Directory')
        const mediaService = this.requireNestApp().get(MediaService)
        return mediaService.readFileInDirectory(safeDirectory)
    }

    private async mergeVideo(videos: unknown, outputPath: unknown) {
        if (!Array.isArray(videos) || videos.length === 0) {
            throw new Error('At least one video path is required')
        }
        const safeVideos = videos.map((video, index) => this.assertAllowed(video, `Video ${index}`))
        const safeOutput = this.assertAllowed(outputPath, 'Output directory')
        const mediaService = this.requireNestApp().get(MediaService)
        return await mediaService.mergeVideo(safeVideos, safeOutput)
    }

    private async completePrompt(prompt: unknown) {
        if (!isNonEmptyString(prompt)) throw new Error('Prompt must be a non-empty string')
        if (prompt.length > MAX_PROMPT_LENGTH) throw new Error('Prompt exceeds the maximum length')
        const llmService = this.requireNestApp().get(LLMService)
        return await llmService.completion(prompt)
    }

    private registerSubtitleHandlers() {
        ipcMain.handle(IPC_CHANNELS.SUBTITLES_OPEN, () => this.getSubtitlesWindow()?.open())
        ipcMain.handle(IPC_CHANNELS.SUBTITLES_CLOSE, () => this.getSubtitlesWindow()?.close())
        ipcMain.handle(IPC_CHANNELS.SUBTITLES_UPDATE, (_e, text) => this.updateSubtitles(text))
        ipcMain.on(IPC_CHANNELS.SUBTITLES_TEXT, (_e, text) => this.forwardSubtitleText(text))
    }

    private async updateSubtitles(text: unknown) {
        if (typeof text !== 'string') throw new Error('Subtitle text must be a string')
        this.getSubtitlesWindow()?.updateText(text)
    }

    private forwardSubtitleText(text: unknown) {
        if (typeof text !== 'string') {
            console.warn('Ignoring invalid subtitle text payload')
            return
        }
        this.getSubtitlesWindow()?.updateText(text)
    }

    private registerAudioHandlers() {
        ipcMain.handle(IPC_CHANNELS.GET_AUDIO_SOURCES, () => this.getAudioSources())
        ipcMain.handle(IPC_CHANNELS.AUDIO_LIST_DEVICES, () => getAudioManager()?.listAudioDevices() ?? [])
        ipcMain.handle(IPC_CHANNELS.AUDIO_START_CAPTURE, (_e, index, rate) => this.startAudioCapture(index, rate))
        ipcMain.handle(IPC_CHANNELS.AUDIO_STOP_CAPTURE, () => getAudioManager()?.stopAudioCapture() ?? false)
        ipcMain.handle(IPC_CHANNELS.AUDIO_GET_DATA, () => getAudioManager()?.getAudioData() ?? null)
    }

    private async getAudioSources() {
        const sources = await desktopCapturer.getSources({
            types: ['window', 'screen'],
            thumbnailSize: { width: 0, height: 0 }
        })
        return sources.map(source => ({ id: source.id, name: source.name }))
    }

    private async startAudioCapture(deviceIndex: unknown, sampleRate: unknown) {
        if (!Number.isInteger(deviceIndex) || (deviceIndex as number) < 0) {
            throw new Error('Device index must be a non-negative integer')
        }
        const rate = sampleRate === undefined ? 0 : sampleRate
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) {
            throw new Error('Sample rate must be a non-negative number')
        }
        const audio = getAudioManager()
        if (!audio) throw new Error('Native audio module is unavailable')
        try {
            audio.startAudioCapture(deviceIndex as number, rate)
            return true
        } catch (error) {
            throw new Error(`Failed to start audio capture: ${String(error)}`)
        }
    }

    private registerSystemHandlers() {
        ipcMain.handle(IPC_CHANNELS.GET_OS_NETWORK_INTERFACES, () => os.networkInterfaces())
        ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, (_e, target) => this.openExternal(target))
    }

    private async openExternal(target: unknown) {
        if (typeof target !== 'string' || !Object.prototype.hasOwnProperty.call(EXTERNAL_TARGETS, target)) {
            throw new Error('Unknown external target')
        }
        const url = EXTERNAL_TARGETS[target as ExternalTarget]
        if (!url.startsWith('https://')) throw new Error('Only https targets are allowed')
        await shell.openExternal(url)
    }

    private registerMonitorHandlers() {
        ipcMain.handle(IPC_CHANNELS.GET_LOCAL_API_TOKEN, () => this.callbacks.getLocalApiToken?.() ?? null)
        ipcMain.handle(IPC_CHANNELS.GET_GATEWAY_TOKEN, () => this.callbacks.getGatewayToken?.() ?? null)
        ipcMain.handle(IPC_CHANNELS.INVALIDATE_GATEWAY_TOKEN, () => {
            this.callbacks.invalidateGatewayToken?.()
        })
        ipcMain.handle(IPC_CHANNELS.OPEN_MONITOR_WINDOW, (_e, provider) => {
            this.callbacks.openMonitorWindow?.(this.assertMonitorProvider(provider))
        })
        ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, (_e, provider) => {
            this.callbacks.openExternalLogin?.(this.assertMonitorProvider(provider))
        })
    }
}
