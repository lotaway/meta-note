import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { ipcRenderer } from 'electron'

const VOICE_API_URL = import.meta.env.VITE_VOICE_API_URL || 'http://localhost:8000'
const CHUNK_DURATION_MS = 2000
const DEFAULT_MIME_TYPE = 'audio/webm;codecs=opus'
const FALLBACK_MIME_TYPE = 'audio/ogg;codecs=opus'

enum AudioSourceType {
    Mic = 'mic',
    System = 'system'
}

interface AudioContextType {
    isStreaming: boolean
    startRecording: (sourceId: string, sourceType: AudioSourceType) => Promise<void>
    stopRecording: () => void
    transcribeFile: (file: File) => Promise<string | null>
    availableSources: Electron.DesktopCapturerSource[]
    reloadSources: () => Promise<void>
    latestTranscript: string
}

class AudioRecordingError extends Error {
    constructor(message: string, public code: string) {
        super(message)
    }
}

const AudioContext = createContext<AudioContextType | null>(null)

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isStreaming, setIsStreaming] = useState(false)
    const [availableSources, setAvailableSources] = useState<Electron.DesktopCapturerSource[]>([])
    const [latestTranscript, setLatestTranscript] = useState('')
    
    const recorderRef = useRef<MediaRecorder | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)
    const sessionIdRef = useRef<string | null>(null)
    const responseRef = useRef<Response | null>(null)

    const reloadSources = useCallback(async () => {
        const sources = await ipcRenderer.invoke('audio:get-sources')
        setAvailableSources(sources)
    }, [])

    const sendSubtitle = (text: string) => {
        ipcRenderer.send('subtitles:text', text)
    }

    const parseStream = async (stream: ReadableStream) => {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                
                const data = line.slice(6)
                if (data === '[DONE]') continue

                try {
                    const parsed = JSON.parse(data)
                    if (parsed.text) {
                        setLatestTranscript(parsed.text)
                        sendSubtitle(parsed.text)
                    }
                } catch {
                    console.error('SSE parse error')
                }
            }
        }
    }

    const uploadChunk = async (data: Blob, sessionId: string) => {
        const formData = new FormData()
        formData.append('chunk', data, 'chunk.webm')
        formData.append('session_id', sessionId)

        await fetch(`${VOICE_API_URL}/voice/to/text`, {
            method: 'POST',
            body: formData
        })
    }

    const initStreamSession = async (sessionId: string) => {
        const response = await fetch(
            `${VOICE_API_URL}/voice/to/text?stream=true&session_id=${sessionId}`,
            { method: 'POST', body: JSON.stringify({}) }
        )
        if (!response.ok) throw new AudioRecordingError('Stream init failed', 'STREAM_INIT_FAILED')
        return response
    }

    const createRecorder = (stream: MediaStream) => {
        const mimeType = MediaRecorder.isTypeSupported(DEFAULT_MIME_TYPE) 
            ? DEFAULT_MIME_TYPE 
            : FALLBACK_MIME_TYPE
            
        return new MediaRecorder(stream, { mimeType })
    }

    const getAudioStream = async (sourceType: AudioSourceType, sourceId?: string) => {
        if (sourceType === AudioSourceType.Mic) {
            return navigator.mediaDevices.getUserMedia({ audio: true })
        }

        try {
            // @ts-ignore
            return navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                }
            })
        } catch {
            throw new AudioRecordingError('System audio unavailable, falling back to mic', 'SYSTEM_AUDIO_FAILED')
        }
    }

    const startRecording = async (sourceId: string, sourceType: AudioSourceType) => {
        const stream = await getAudioStream(sourceType, sourceId)
        const sessionId = crypto.randomUUID()
        
        sessionIdRef.current = sessionId
        abortControllerRef.current = new AbortController()

        const response = await initStreamSession(sessionId)
        responseRef.current = response
        setIsStreaming(true)

        if (response.body) {
            parseStream(response.body)
        }

        const recorder = createRecorder(stream)
        recorderRef.current = recorder
        recorder.start(CHUNK_DURATION_MS)

        recorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && sessionIdRef.current) {
                await uploadChunk(e.data, sessionIdRef.current)
            }
        }

        recorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop())
        }
    }

    const stopRecording = () => {
        recorderRef.current?.stop()
        abortControllerRef.current?.abort()
        
        if (responseRef.current?.body) {
            responseRef.current.body.getReader().cancel()
        }

        recorderRef.current = null
        abortControllerRef.current = null
        responseRef.current = null
        sessionIdRef.current = null
        setIsStreaming(false)
    }

    const transcribeFile = async (file: File) => {
        const formData = new FormData()
        formData.append('audio', file)

        const response = await fetch(`${VOICE_API_URL}/voice/to/text`, {
            method: 'POST',
            body: formData
        })
        
        if (!response.ok) throw new AudioRecordingError('Transcription failed', 'TRANSCRIBE_FAILED')
        
        const data = await response.json()
        const text = data.text || ''
        setLatestTranscript(text)
        sendSubtitle(text)
        return text
    }

    return (
        <AudioContext.Provider value={{ 
            isStreaming, 
            startRecording, 
            stopRecording, 
            transcribeFile, 
            availableSources, 
            reloadSources, 
            latestTranscript 
        }}>
            {children}
        </AudioContext.Provider>
    )
}

export const useAudio = () => {
    const context = useContext(AudioContext)
    if (!context) throw new Error('useAudio must be used within AudioProvider')
    return context
}
