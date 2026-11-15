import { describe, it, expect, vi } from 'vitest'
import type * as express from 'express'
import { NoteController } from './note.controller'
import type { NoteService } from '../services/note.service'

function createResponse() {
    const res = { status: vi.fn(), json: vi.fn() }
    res.status.mockReturnValue(res)
    return res
}

function createRequest(overrides: Record<string, unknown> = {}) {
    return { body: {}, params: {}, ...overrides } as unknown as express.Request
}

function createController() {
    const generateNote = vi.fn()
    const service = { generateNote } as unknown as NoteService
    return { controller: new NoteController(service), generateNote }
}

describe('NoteController', () => {
    it('rejects a request without video_url', () => {
        const { controller, generateNote } = createController()
        const res = createResponse()
        controller.generate(createRequest({ body: {} }), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(generateNote).not.toHaveBeenCalled()
    })

    it('starts a background task and returns its id', () => {
        const { controller, generateNote } = createController()
        generateNote.mockResolvedValue('# summary')
        const res = createResponse()
        const body = { video_url: 'https://example.com/v/1', style: 'minimal' }
        controller.generate(createRequest({ body }), res as unknown as express.Response)
        expect(generateNote).toHaveBeenCalledWith(body.video_url, body.style, undefined, undefined)
        expect(res.json).toHaveBeenCalledWith({ code: 200, data: { task_id: expect.any(String) } })
    })

    it('exposes the generated markdown once the task succeeds', async () => {
        const { controller, generateNote } = createController()
        generateNote.mockResolvedValue('# summary')
        const startRes = createResponse()
        controller.generate(createRequest({ body: { video_url: 'u' } }), startRes as unknown as express.Response)
        const taskId = startRes.json.mock.calls[0][0].data.task_id
        await vi.waitFor(() => {
            const statusRes = createResponse()
            controller.getStatus(createRequest({ params: { id: taskId } }), statusRes as unknown as express.Response)
            expect(statusRes.json).toHaveBeenCalledWith({
                code: 200,
                data: { status: 'SUCCESS', markdown: '# summary' }
            })
        })
    })

    it('reports a failed task instead of swallowing the error', async () => {
        const { controller, generateNote } = createController()
        generateNote.mockRejectedValue(new Error('transcription failed'))
        const startRes = createResponse()
        controller.generate(createRequest({ body: { video_url: 'u' } }), startRes as unknown as express.Response)
        const taskId = startRes.json.mock.calls[0][0].data.task_id
        await vi.waitFor(() => {
            const statusRes = createResponse()
            controller.getStatus(createRequest({ params: { id: taskId } }), statusRes as unknown as express.Response)
            expect(statusRes.json).toHaveBeenCalledWith({
                code: 200,
                data: { status: 'FAILED', error: 'transcription failed' }
            })
        })
    })

    it('returns 404 for an unknown task', () => {
        const { controller } = createController()
        const res = createResponse()
        controller.getStatus(createRequest({ params: { id: 'missing' } }), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(404)
    })

    it('withholds the result until the task succeeds', () => {
        const { controller, generateNote } = createController()
        generateNote.mockReturnValue(new Promise(() => { }))
        const startRes = createResponse()
        controller.generate(createRequest({ body: { video_url: 'u' } }), startRes as unknown as express.Response)
        const taskId = startRes.json.mock.calls[0][0].data.task_id
        const res = createResponse()
        controller.getResult(createRequest({ params: { id: taskId } }), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(404)
    })

    it('removes a task on delete', () => {
        const { controller, generateNote } = createController()
        generateNote.mockReturnValue(new Promise(() => { }))
        const startRes = createResponse()
        controller.generate(createRequest({ body: { video_url: 'u' } }), startRes as unknown as express.Response)
        const taskId = startRes.json.mock.calls[0][0].data.task_id
        controller.deleteTask(createRequest({ params: { id: taskId } }), createResponse() as unknown as express.Response)
        const res = createResponse()
        controller.getStatus(createRequest({ params: { id: taskId } }), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(404)
    })
})
