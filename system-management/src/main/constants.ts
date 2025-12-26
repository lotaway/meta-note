export const IPC_CHANNELS = {
    OPEN_CHATGPT_WINDOW: 'open-chatgpt-window',
    OPEN_EXTERNAL_LOGIN: 'open-external-login',
} as const;

export const CHATGPT_CONSTANTS = {
    SSE_RAW_PREFIX: '__SSE_PREFIX__',
    SESSION_COOKIE_NAME: '__Secure-next-auth.session-token',
    CHATGPT_HOST: 'https://chatgpt.com',
    COOKIE_DOMAIN: '.chatgpt.com',
} as const;
