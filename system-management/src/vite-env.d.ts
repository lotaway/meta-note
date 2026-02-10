/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WEBSOCKET_PORT: string
    readonly VITE_WEB_SERVER_PORT: string
    readonly VITE_WEB_SERVER_URL: string
    readonly VITE_DEV_SERVER_PORT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
