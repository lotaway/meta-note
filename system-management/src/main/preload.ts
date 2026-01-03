import { contextBridge, ipcRenderer } from "electron"
import os from "os"
import { IPC_CHANNELS } from "./constants"

type ReceiveFn = (...args: any) => void

const desktopFn = {
  send: (channel: string, data: any) => {
    ipcRenderer.invoke(channel, data).catch(e => console.log(e))
  },
  receive: (channel: string, func: ReceiveFn) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  },
  ipcSend: (channel: string, ...arg: any) => {
    ipcRenderer.send(channel, ...arg)
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
  // @ts-ignore
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

navigator.permissions.query = parameters =>
  parameters.name === 'notifications'
    ? Promise.resolve({ state: Notification.permission })
    : originalQuery(parameters)

const getParameter = WebGLRenderingContext.prototype.getParameter

WebGLRenderingContext.prototype.getParameter = function (parameter) {
  if (parameter === 37445) return 'Apple'
  if (parameter === 37446) return 'Apple GPU'
  return getParameter.call(this, parameter)
}

const toDataURL = HTMLCanvasElement.prototype.toDataURL

HTMLCanvasElement.prototype.toDataURL = function () {
  return toDataURL.apply(this, arguments)
}

export { }
window.addEventListener("DOMContentLoaded", () => {
  console.log('[Preload] Browser fingerprint correction applied')
})
export { }
