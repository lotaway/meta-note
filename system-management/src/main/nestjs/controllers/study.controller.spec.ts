import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type * as express from 'express'
import { StudyController } from './study.controller'
import type { StudyService } from '../services/study.service'

function createResponse() {
    const res = { status: vi.fn(), json: vi.fn() }
    res.status.mockReturnValue(res)
    return res
}

function createRequest(body: Record<string, unknown>) {
    return { body } as unknown as express.Request
}

const validPayload = { platform: 'bilibili', target: 'u', targetType: 'video', studyType: 'note' }

describe('StudyController', () => {
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => { }))
    afterEach(() => vi.restoreAllMocks())

    it('rejects a payload with missing fields', async () => {
        const service = { checkLimitCount: vi.fn(), addTask: vi.fn() } as unknown as StudyService
        const res = createResponse()
        await new StudyController(service).handleRequest(createRequest({ platform: 'bilibili' }), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' })
    })

    it('rejects a request once the daily limit is reached', async () => {
        const service = { checkLimitCount: vi.fn().mockResolvedValue(true), addTask: vi.fn() } as unknown as StudyService
        const res = createResponse()
        await new StudyController(service).handleRequest(createRequest(validPayload), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(403)
        expect(service.addTask).not.toHaveBeenCalled()
    })

    it('queues a valid task', async () => {
        const service = { checkLimitCount: vi.fn().mockResolvedValue(false), addTask: vi.fn().mockResolvedValue(undefined) } as unknown as StudyService
        const res = createResponse()
        await new StudyController(service).handleRequest(createRequest(validPayload), res as unknown as express.Response)
        expect(service.addTask).toHaveBeenCalledWith(validPayload)
        expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Study task added to queue' })
    })

    it('surfaces a queue failure as a 500 instead of succeeding silently', async () => {
        const service = {
            checkLimitCount: vi.fn().mockResolvedValue(false),
            addTask: vi.fn().mockRejectedValue(new Error('kafka unavailable'))
        } as unknown as StudyService
        const res = createResponse()
        await new StudyController(service).handleRequest(createRequest(validPayload), res as unknown as express.Response)
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('kafka unavailable') })
    })
})
