export enum AudioSourceType {
    Mic = 'mic',
    System = 'system'
}

export const AUDIO_CONFIG = {
    CHUNK_DURATION_MS: 2000,
    DEFAULT_MIME_TYPE: 'audio/webm;codecs=opus',
    FALLBACK_MIME_TYPE: 'audio/ogg;codecs=opus',
    SSE_DATA_PREFIX: 'data: ',
    SSE_DONE_MARKER: '[DONE]'
} as const

export class AudioRecordingError extends Error {
    constructor(message: string, public code: string) {
        super(message)
    }
}
