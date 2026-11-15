import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC_CHANNELS } from './constants'
import { applyFingerprintCorrection } from './browser-fingerprint'
import type {
  DesktopAPI,
  SubtitleTextListener,
  SubtitleStyleListener,
} from '../global'

type Listener = (...args: any[]) => void

function createSubscription(channel: string) {
  const wrappers = new WeakMap<Listener, Listener>()
  return {
    on(listener: Listener) {
      const wrapper: Listener = (_event: IpcRendererEvent, ...args: any[]) => listener(...args)
      wrappers.set(listener, wrapper)
      ipcRenderer.on(channel, wrapper)
    },
    off(listener: Listener) {
      const wrapper = wrappers.get(listener)
      if (!wrapper) return
      ipcRenderer.removeListener(channel, wrapper)
      wrappers.delete(listener)
    },
  }
}

const subtitlesText = createSubscription(IPC_CHANNELS.SUBTITLES_TEXT)
const subtitlesStyle = createSubscription(IPC_CHANNELS.SUBTITLES_STYLE)

const desktopFn: DesktopAPI = {
  selectDirectory: options => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY, options),
  readFileInDirectory: directory => ipcRenderer.invoke(IPC_CHANNELS.READ_FILE_IN_DIRECTORY, directory),
  mergeVideo: (videos, outputPath) => ipcRenderer.invoke(IPC_CHANNELS.MERGE_VIDEO, videos, outputPath),
  llmCompletion: prompt => ipcRenderer.invoke(IPC_CHANNELS.LLM_COMPLETION, prompt),
  openSubtitles: () => ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES_OPEN),
  closeSubtitles: () => ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES_CLOSE),
  updateSubtitles: text => ipcRenderer.invoke(IPC_CHANNELS.SUBTITLES_UPDATE, text),
  sendSubtitlesText: text => ipcRenderer.send(IPC_CHANNELS.SUBTITLES_TEXT, text),
  onSubtitlesText: (listener: SubtitleTextListener) => subtitlesText.on(listener),
  offSubtitlesText: (listener: SubtitleTextListener) => subtitlesText.off(listener),
  onSubtitlesStyle: (listener: SubtitleStyleListener) => subtitlesStyle.on(listener),
  offSubtitlesStyle: (listener: SubtitleStyleListener) => subtitlesStyle.off(listener),
  getAudioSources: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AUDIO_SOURCES),
  listAudioDevices: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_LIST_DEVICES),
  startAudioCapture: (deviceIndex, sampleRate) =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIO_START_CAPTURE, deviceIndex, sampleRate),
  stopAudioCapture: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_STOP_CAPTURE),
  getAudioData: () => ipcRenderer.invoke(IPC_CHANNELS.AUDIO_GET_DATA),
  getOSNetworkInterfaces: () => ipcRenderer.invoke(IPC_CHANNELS.GET_OS_NETWORK_INTERFACES),
  openExternal: target => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, target),
  getLocalApiToken: () => ipcRenderer.invoke(IPC_CHANNELS.GET_LOCAL_API_TOKEN),
  getGatewayToken: () => ipcRenderer.invoke(IPC_CHANNELS.GET_GATEWAY_TOKEN),
  invalidateGatewayToken: () => ipcRenderer.invoke(IPC_CHANNELS.INVALIDATE_GATEWAY_TOKEN),
  openMonitor: provider => ipcRenderer.invoke(IPC_CHANNELS.OPEN_MONITOR_WINDOW, provider),
  openExternalLogin: provider => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN, provider),
}

contextBridge.exposeInMainWorld('desktop', desktopFn)

applyFingerprintCorrection()

export { }
