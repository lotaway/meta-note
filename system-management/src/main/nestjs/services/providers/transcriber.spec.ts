import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const mocks = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('axios', () => ({ default: { post: mocks.post } }))

import { Transcriber } from './transcriber'

const audioPath = path.join(os.tmpdir(), 'wb-transcriber-spec.wav')

beforeEach(async () => {
    mocks.post.mockReset()
    await fs.writeFile(audioPath, Buffer.from('fake-wav-bytes'))
})

afterAll(async () => {
    await fs.unlink(audioPath).catch(() => undefined)
})

describe('Transcriber', () => {
    it('sends the audio file to a Whisper compatible endpoint', async () => {
        mocks.post.mockResolvedValue({ data: { text: 'real transcript' } })
        const result = await new Transcriber().transcribe(audioPath)
        expect(result).toEqual({ text: 'real transcript' })
        const [url, form] = mocks.post.mock.calls[0]
        expect(url).toContain('/v1/audio/transcriptions')
        expect(form).toBeInstanceOf(FormData)
        expect(form.get('model')).toBe('whisper-1')
        expect(form.get('response_format')).toBe('json')
        expect(form.get('file')).toBeInstanceOf(Blob)
    })

    it('throws when the endpoint returns no transcript', async () => {
        mocks.post.mockResolvedValue({ data: {} })
        await expect(new Transcriber().transcribe(audioPath)).rejects.toThrow(/returned no transcript/)
    })

    it('propagates transport errors instead of returning placeholder text', async () => {
        mocks.post.mockRejectedValue(new Error('whisper offline'))
        await expect(new Transcriber().transcribe(audioPath)).rejects.toThrow('whisper offline')
    })
})
