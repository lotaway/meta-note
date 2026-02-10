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
    TTS_STATUS: '/api/tts/status',
    TTS_SYNTHESIZE: '/api/tts/synthesize',
    TTS_DOWNLOAD: '/api/tts/download',
    TTS_DELETE: '/api/tts/delete',
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

export const TTS_CONSTANTS = {
    MODEL_VERSION: 'v2.0',
    MODEL_BASE_URL: 'https://huggingface.co/coqui/XTTS-v2/resolve/main',
} as const

export const TTS_MODEL_FILES = [
    { name: 'model.pth', required: true },
    { name: 'config.json', required: true },
    { name: 'vocab.json', required: true },
    { name: 'speakers_xtts.pth', required: true },
    { name: 'mel_stats.pth', required: true },
    { name: 'dvae.pth', required: true },
    { name: 'hash.md5', required: false }
] as const
