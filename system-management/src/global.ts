export {}

type ApiKey = string | number

declare global {
    interface Window {
        "desktop": {
            send: (channel: string, ...arg: any) => void;
            receive: (channel: string, func: (event: any, ...arg: any) => void) => void
            ipcSendTo: (window_id: number, channel: string, ...arg: any) => void
            ipcSend: (channel: string, ...arg: any) => void
            ipcOn: (channel: string, listener: (event: any, ...arg: any) => void) => void
            ipcSendSync: (channel: string, ...arg: any) => void
            ipcOnce: (channel: string, listener: (event: any, ...arg: any) => void) =>
                void
            ipcRemoveListener:  (channel: string, listener: (event: any, ...arg: any) =>
                void) => void
            ipcRemoveAllListeners: (channel: string) => void
            [apiKey: ApiKey]: (...params: any) => any
        }
    }
}
