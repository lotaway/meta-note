import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../../main/constants'
import { AudioSourceType, AUDIO_CONFIG, AudioRecordingError } from '../types/Audio'

const VOICE_API_URL = import.meta.env.VITE_VOICE_API_URL || 'http://localhost:8000'

interface AudioContextType {
    isStreaming: boolean
    startRecording: (sourceId: string, sourceType: AudioSourceType) => Promise<void>
    stopRecording: () => void
    requestTranscription: (file: File) => Promise<string>
    availableSources: Electron.DesktopCapturerSource[]
    reloadSources: () => Promise<void>
    latestTranscript: string
    updateTranscript: (text: string) => void
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
        const sources = await ipcRenderer.invoke(IPC_CHANNELS.GET_AUDIO_SOURCES)
        setAvailableSources(sources)
    }, [])

    const updateTranscript = useCallback((text: string) => {
        setLatestTranscript(text)
        ipcRenderer.send(IPC_CHANNELS.SUBTITLES_TEXT, text)
    }, [])

    const handleSSELine = useCallback((line: string) => {
        if (!line.startsWith(AUDIO_CONFIG.SSE_DATA_PREFIX)) return
        
        const data = line.slice(AUDIO_CONFIG.SSE_DATA_PREFIX.length)
        if (data === AUDIO_CONFIG.SSE_DONE_MARKER) return

        try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
                updateTranscript(parsed.text)
            }
        } catch {
            // Ignore parse errors for malformed chunks
        }
    }, [updateTranscript])

    const parseStream = async (stream: ReadableStream) => {
        const reader = stream.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                lines.forEach(handleSSELine)
            }
        } finally {
            reader.releaseLock()
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
        const mimeType = MediaRecorder.isTypeSupported(AUDIO_CONFIG.DEFAULT_MIME_TYPE) 
            ? AUDIO_CONFIG.DEFAULT_MIME_TYPE 
            : AUDIO_CONFIG.FALLBACK_MIME_TYPE
            
        return new MediaRecorder(stream, { mimeType })
    }

    const getAudioStream = async (sourceType: AudioSourceType, sourceId?: string) => {
        if (sourceType === AudioSourceType.Mic) {
            return navigator.mediaDevices.getUserMedia({ audio: true })
        }

        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    // @ts-ignore
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sourceId
                    }
                }
            })
        } catch {
            throw new AudioRecordingError('System audio unavailable', 'SYSTEM_AUDIO_FAILED')
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
        recorder.start(AUDIO_CONFIG.CHUNK_DURATION_MS)

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

    const requestTranscription = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('audio', file)

        const response = await fetch(`${VOICE_API_URL}/voice/to/text`, {
            method: 'POST',
            body: formData
        })
        
        if (!response.ok) throw new AudioRecordingError('Transcription failed', 'TRANSCRIBE_FAILED')
        
        const data = await response.json()
        return data.text || ''
    }

    return (
        <AudioContext.Provider value={{ 
            isStreaming, 
            startRecording, 
            stopRecording, 
            requestTranscription, 
            availableSources, 
            reloadSources, 
            latestTranscript,
            updateTranscript
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
