const {contextBridge, ipcMain, ipcRenderer, BrowserWindow} = require("electron")
const os = require("os")

type ReceiveFn = (...args: any) => void

const desktopFn = {
    send: (channel: string, data: any) => {
        ipcRenderer.invoke(channel, data).catch(e => console.log(e))
    },
    receive: (channel: string, func: ReceiveFn) => {
        console.log("preload-receive called. args: ")
        ipcRenderer.on(channel, (event, ...args) => func(...args))
    },
    ipcSendTo: (window_id: number, channel: string, ...arg: any) => {
        ipcRenderer.sendTo(window_id, channel, arg)
    },
    ipcSend: (channel: string, ...arg: any) => {
        ipcRenderer.send(channel, arg)
    },
    ipcSendSync: (channel: string, ...arg: any) => {
        return ipcRenderer.sendSync(channel, arg)
    },
    ipcOn: (channel: string, listener: (event: any, ...arg: any) => void) => {
        ipcRenderer.on(channel, listener)
    },
    ipcOnce: (channel: string, listener: (event: any, ...arg: any) => void) => {
        ipcRenderer.once(channel, listener)
    },
    ipcRemoveListener: (channel: string, listener: (event: any, ...arg: any) =>
        void) => {
        ipcRenderer.removeListener(channel, listener)
    },
    ipcRemoveAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel)
    },
    getOSNetworkInterfaces() {
        const networkInterfaces = os.networkInterfaces()
        let macIp
        for (const i in networkInterfaces) {
            for (const j in networkInterfaces[i]) {
                if (networkInterfaces[i][j]["family"] === "IPv4" && networkInterfaces[i][j]["mac"] !== "00:00:00:00:00:00" && networkInterfaces[i][j]["address"] !== "127.0.0.1") {
                    macIp = networkInterfaces[i][j]["mac"]
                }
            }
        }
    }
}
if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("desktop", desktopFn)
} else {
    window.desktop = desktopFn
}
window.addEventListener("DOMContentLoaded", () => {

})
export {}
