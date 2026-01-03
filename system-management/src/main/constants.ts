export const IPC_CHANNELS = {
    OPEN_CHATGPT_WINDOW: 'open-chatgpt-window',
    OPEN_EXTERNAL_LOGIN: 'open-external-login',
    OPEN_DEEPSEEK_WINDOW: 'open-deepseek-window',
    OPEN_DEEPSEEK_EXTERNAL_LOGIN: 'open-deepseek-external-login',
} as const

export const AI_CHAT_CONSTANTS = {
    SSE_RAW_PREFIX: '__SSE_PREFIX__',
    SSE_CHUNK_EVENT: 'sse-chunk',
    SESSION_COOKIE_NAME: '__Secure-next-auth.session-token',
    CHATGPT_HOST: 'https://chatgpt.com',
    COOKIE_DOMAIN: '.chatgpt.com',
} as const

export const ROUTE_PATHS = {
    SHOW: '/show',
    TAGS: '/tags',
    AUTH_TOKEN: '/v1/auth/token',
    CHAT_COMPLETIONS: '/v1/chat/completions',
} as const
