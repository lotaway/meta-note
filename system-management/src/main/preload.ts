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
    openChatGPTWindow: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.OPEN_CHATGPT_WINDOW)
    },
    openExternalLogin: () => {
        return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_LOGIN)
    }
}

if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("desktop", desktopFn)
} else {
    // @ts-ignore
    window.desktop = desktopFn
}

export { }
window.addEventListener("DOMContentLoaded", () => {

})
export { }
