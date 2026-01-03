export {}

type ApiKey = string | number
type ReceiveFn = (...args: any) => void

interface DesktopAPI {
  send: (channel: string, ...args: any) => void
  receive: (channel: string, func: ReceiveFn) => void
  ipcSendTo: (window_id: number, channel: string, ...args: any) => void
  ipcSend: (channel: string, ...args: any) => void
  ipcOn: (channel: string, listener: (event: any, ...args: any) => void) => void
  ipcSendSync: (channel: string, ...args: any) => any
  ipcOnce: (channel: string, listener: (event: any, ...args: any) => void) => void
  ipcRemoveListener: (channel: string, listener: (event: any, ...args: any) => void) => void
  ipcRemoveAllListeners: (channel: string) => void
  getOSNetworkInterfaces: () => Partial<Record<string, import("os").NetworkInterfaceInfo[]>>
  requestOpenChatGPTWindow: () => Promise<any>
  requestOpenExternalLogin: () => Promise<any>
  requestOpenDeepseekWindow: () => Promise<any>
  requestOpenDeepseekExternalLogin: () => Promise<any>
  [apiKey: ApiKey]: (...params: any) => any
}

declare global {
  interface Window {
    desktop: DesktopAPI
  }
}

export type { ReceiveFn, DesktopAPI }
