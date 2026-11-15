import { Injectable } from '@nestjs/common'
import axios from 'axios'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface Transcript {
    text: string
    segments?: Array<{
        start: number
        end: number
        text: string
    }>
}

interface WhisperResponse {
    text?: string
}

@Injectable()
export class Transcriber {
    private readonly endpoint = process.env.WHISPER_URL || 'http://localhost:8080/v1/audio/transcriptions'
    private readonly model = process.env.WHISPER_MODEL || 'whisper-1'

    async transcribe(audioPath: string): Promise<Transcript> {
        const audio = await fs.readFile(audioPath)
        const form = this.buildForm(audio, audioPath)
        const response = await axios.post<WhisperResponse>(this.endpoint, form)
        if (!response.data?.text) {
            throw new Error(`Whisper endpoint returned no transcript: ${this.endpoint}`)
        }
        return { text: response.data.text }
    }

    private buildForm(audio: Buffer, audioPath: string): FormData {
        const form = new FormData()
        form.append('file', new Blob([new Uint8Array(audio)]), path.basename(audioPath))
        form.append('model', this.model)
        form.append('response_format', 'json')
        return form
    }
}
