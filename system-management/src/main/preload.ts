import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"
import os from "os"
import { IPC_CHANNELS } from "./constants"
import type { ReceiveFn, DesktopAPI } from "../global"

const desktopFn: DesktopAPI = {
  send: (channel: string, ...args: any) => {
    return ipcRenderer.invoke(channel, ...args).catch((e: any) => console.log(e))
  },
  receive: (channel: string, func: ReceiveFn) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, ...args: any) => func(...args))
  },
  ipcSendTo: (window_id: number, channel: string, ...args: any) => {
    (ipcRenderer as any).sendTo(window_id, channel, ...args)
  },
  ipcSend: (channel: string, ...args: any) => {
    ipcRenderer.send(channel, ...args)
  },
  ipcOn: (channel: string, listener: (event: any, ...args: any) => void) => {
    ipcRenderer.on(channel, (event: IpcRendererEvent, ...args: any) => listener(event, ...args))
  },
  ipcSendSync: (channel: string, ...args: any) => {
    return ipcRenderer.sendSync(channel, ...args)
  },
  ipcOnce: (channel: string, listener: (event: any, ...args: any) => void) => {
    ipcRenderer.once(channel, (event: IpcRendererEvent, ...args: any) => listener(event, ...args))
  },
  ipcRemoveListener: (channel: string, listener: (event: any, ...args: any) => void) => {
    ipcRenderer.removeListener(channel, listener as any)
  },
  ipcRemoveAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
  getOSNetworkInterfaces() {
    return os.networkInterfaces()
  },
  requestOpenChatGPTWindow: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_CHATGPT_WINDOW)
  },
  requestOpenExternalLogin: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN)
  },
  requestOpenDeepseekWindow: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_DEEPSEEK_WINDOW)
  },
  requestOpenDeepseekExternalLogin: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_DEEPSEEK_EXTERNAL_LOGIN)
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("desktop", desktopFn)
} else {
  window.desktop = desktopFn
}

Object.defineProperty(navigator, 'webdriver', {
  get: () => false
})

Object.defineProperty(navigator, 'plugins', {
  get: () => [1, 2, 3]
})

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en']
})

const originalQuery = navigator.permissions.query

navigator.permissions.query = (parameters: PermissionDescriptor) =>
  parameters.name === 'notifications'
    ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
    : originalQuery(parameters)

const getParameter = WebGLRenderingContext.prototype.getParameter

WebGLRenderingContext.prototype.getParameter = function (parameter) {
  if (parameter === 37445) return 'Apple'
  if (parameter === 37446) return 'Apple GPU'
  return getParameter.call(this, parameter)
}

const toDataURL = HTMLCanvasElement.prototype.toDataURL

HTMLCanvasElement.prototype.toDataURL = function (type?: string, quality?: number) {
  return toDataURL.call(this, type, quality)
}

window.addEventListener("DOMContentLoaded", () => {
  console.log('[Preload] Browser fingerprint correction applied')
})
export { }
