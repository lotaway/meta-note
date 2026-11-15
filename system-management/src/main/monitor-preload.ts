import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from './constants'

const MAX_CHUNK_LENGTH = 1_000_000

contextBridge.exposeInMainWorld('monitor', {
  reportSseChunk(chunk: unknown): void {
    if (typeof chunk !== 'string' || chunk.length === 0 || chunk.length > MAX_CHUNK_LENGTH) return
    ipcRenderer.send(IPC_CHANNELS.MONITOR_SSE_CHUNK, chunk)
  },
  requestOpenExternalLogin(provider: 'chatgpt' | 'deepseek'): Promise<unknown> {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, provider)
  },
})

export {}
