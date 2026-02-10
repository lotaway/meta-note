export const IPC_CHANNELS = {
    OPEN_CHATGPT_WINDOW: 'open-chatgpt-window',
    OPEN_EXTERNAL_LOGIN: 'open-external-login',
    OPEN_DEEPSEEK_WINDOW: 'open-deepseek-window',
    OPEN_DEEPSEEK_EXTERNAL_LOGIN: 'open-deepseek-external-login',
    READ_FILE_IN_DIRECTORY: 'readFileInDirectory',
    MERGE_VIDEO: 'mergeVideo',
    LLM_COMPLETION: 'llm:completion',
    SUBTITLES_OPEN: 'subtitles:open',
    SUBTITLES_CLOSE: 'subtitles:close',
    SUBTITLES_UPDATE: 'subtitles:update',
    SUBTITLES_TEXT: 'subtitles:text',
    SUBTITLES_STYLE: 'subtitles:style',
    GET_AUDIO_SOURCES: 'audio:get-sources',
    TTS_DOWNLOAD_PROGRESS: 'tts:download-progress',
} as const

export const SUBTITLES_WINDOW_CONSTANTS = {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 150,
    DEFAULT_TOP_OFFSET: 20,
    ROUTE_HASH: 'subtitles'
} as const

export const AI_CHAT_CONSTANTS = {
    SSE_RAW_PREFIX: '__SSE_PREFIX__',
    SSE_CHUNK_EVENT: 'sse-chunk',
    SESSION_COOKIE_NAME: '__Secure-next-auth.session-token',
    CHATGPT_HOST: 'https://chatgpt.com',
    COOKIE_DOMAIN: '.chatgpt.com',
} as const

export const ROUTE_PATHS = {
    SHOW: '/api/show',
    TAGS: '/api/tags',
    AUTH_TOKEN: '/v1/auth/token',
    CHAT_COMPLETIONS: '/v1/chat/completions',
    STUDY_REQUEST: '/api/study/request',
    CONFIG: '/api/config',
    SCREENSHOT_APP: '/screenshot/app',
    SCREENSHOT_DESKTOP: '/screenshot/desktop',
    DIRECTORY: '/api/directory',
    VIDEO_MERGE: '/api/video/merge',
} as const

export const STUDY_CONSTANTS = {
    STUDY_LIST_TOPIC: 'study_list',
    STUDYING_LIST_TOPIC: 'studying_list',
    STUDY_SUCCESS_COUNT_KEY: 'study_success_count',
    STUDY_TIME_KEY: 'study_total_time',
    STUDY_LIST_ERROR_KEY: 'study_list_error',
} as const

export const SERVER_PORTS = {
    WEBSOCKET_PORT: parseInt(process.env.WEBSOCKET_PORT || "5050", 10),
    WEB_SERVER_PORT: parseInt(process.env.WEB_SERVER_PORT || "5051", 10),
    DEV_SERVER_PORT: parseInt(process.env.DEV_SERVER_PORT || "5173", 10),
} as const

export const SERVER_URLS = {
    WEBSOCKET_URL: `ws://localhost:${SERVER_PORTS.WEBSOCKET_PORT}`,
    DEV_SERVER_URL: `http://localhost:${SERVER_PORTS.DEV_SERVER_PORT}`,
    WEB_SERVER_URL: `http://localhost:${SERVER_PORTS.WEB_SERVER_PORT}`,
} as const
