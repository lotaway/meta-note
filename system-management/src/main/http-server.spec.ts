import { describe, it, expect, vi, afterEach } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { HttpServer } from './http-server'
import { NoteController } from './nestjs/controllers/note.controller'
import { StudyController } from './nestjs/controllers/study.controller'
import type { ConfigController } from './nestjs/controllers/config.controller'
import type { LLMController } from './nestjs/controllers/llm.controller'
import type { AuthController } from './nestjs/controllers/auth.controller'
import type { ScreenshotController } from './nestjs/controllers/screenshot.controller'
import type { SystemController } from './nestjs/controllers/system.controller'
import type { TTSController } from './nestjs/controllers/tts.controller'
import type { NoteService } from './nestjs/services/note.service'
import type { StudyService } from './nestjs/services/study.service'

let server: Server | undefined

afterEach(() => {
    server?.close()
    server = undefined
})

function handler() {
    return vi.fn((_req: unknown, res: { json: (body: unknown) => void }) => res.json({}))
}

async function startServer(noteService: NoteService, studyService: StudyService): Promise<{ port: number, token: string }> {
    const passthrough = {
        getConfig: handler(), getShow: handler(), getTags: handler(), chatCompletions: handler(),
        handleToken: handler(), getAppScreenshot: handler(), getDesktopScreenshot: handler(),
        readFileInDirectory: handler(), mergeVideo: handler(), getStatus: handler(),
        synthesize: handler(), download: handler(), delete: handler(),
    }
    const instance = new HttpServer(
        passthrough as unknown as ConfigController,
        passthrough as unknown as LLMController,
        passthrough as unknown as AuthController,
        passthrough as unknown as ScreenshotController,
        passthrough as unknown as SystemController,
        passthrough as unknown as TTSController,
        new NoteController(noteService),
        new StudyController(studyService),
        0
    )
    const httpServer = instance.start() as Server
    await new Promise<void>(resolve => httpServer.once('listening', () => resolve()))
    server = httpServer
    return {
        port: (httpServer.address() as AddressInfo).port,
        token: instance.getToken(),
    }
}

function createServices() {
    const noteService = { generateNote: vi.fn().mockReturnValue(new Promise(() => { })) } as unknown as NoteService
    const studyService = {
        checkLimitCount: vi.fn().mockResolvedValue(false),
        addTask: vi.fn().mockResolvedValue(undefined)
    } as unknown as StudyService
    return { noteService, studyService }
}

describe('HttpServer migrated routes', () => {
    it('serves note generation and status through Express', async () => {
        const { noteService, studyService } = createServices()
        const { port, token } = await startServer(noteService, studyService)
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        const created = await fetch(`http://127.0.0.1:${port}/api/note/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ video_url: 'https://example.com/v/1' })
        })
        const body = await created.json() as { code: number, data: { task_id: string } }
        expect(body.code).toBe(200)
        expect(noteService.generateNote).toHaveBeenCalledWith('https://example.com/v/1', undefined, undefined, undefined)
        const status = await fetch(`http://127.0.0.1:${port}/api/note/status/${body.data.task_id}`, { headers })
        expect(await status.json()).toEqual({ code: 200, data: { status: 'PROCESSING' } })
    })

    it('serves the study queue route', async () => {
        const { noteService, studyService } = createServices()
        const { port, token } = await startServer(noteService, studyService)
        const response = await fetch(`http://127.0.0.1:${port}/api/study/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ platform: 'bilibili' })
        })
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: 'Missing required fields' })
    })
})
