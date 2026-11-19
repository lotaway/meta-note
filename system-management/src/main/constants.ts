export const IPC_CHANNELS = {
    READ_FILE_IN_DIRECTORY: 'readFileInDirectory',
    MERGE_VIDEO: 'mergeVideo',
    LLM_COMPLETION: 'llm:completion',
    SUBTITLES_OPEN: 'subtitles:open',
    SUBTITLES_CLOSE: 'subtitles:close',
    SUBTITLES_UPDATE: 'subtitles:update',
    SUBTITLES_TEXT: 'subtitles:text',
    SUBTITLES_STYLE: 'subtitles:style',
    GET_AUDIO_SOURCES: 'audio:get-sources',
    AUDIO_LIST_DEVICES: 'audio:list-devices',
    AUDIO_START_CAPTURE: 'audio:start-capture',
    AUDIO_STOP_CAPTURE: 'audio:stop-capture',
    AUDIO_GET_DATA: 'audio:get-data',
    SELECT_DIRECTORY: 'dialog:select-directory',
    OPEN_EXTERNAL: 'shell:open-external',
    GET_OS_NETWORK_INTERFACES: 'system:network-interfaces',
    GET_LOCAL_API_TOKEN: 'system:local-api-token',
    GET_GATEWAY_TOKEN: 'system:gateway-token',
    INVALIDATE_GATEWAY_TOKEN: 'system:gateway-token-invalidate',
    OPEN_MONITOR_WINDOW: 'monitor:open-window',
    OPEN_EXTERNAL_LOGIN: 'monitor:open-external-login',
    MONITOR_SSE_CHUNK: 'monitor:sse-chunk',
} as const

export const EXTERNAL_TARGETS = {
    chatgpt: 'https://chatgpt.com/',
    deepseek: 'https://chat.deepseek.com/',
    googleLogin: 'https://accounts.google.com/',
    deepseekLogin: 'https://chat.deepseek.com/',
} as const

export type ExternalTarget = keyof typeof EXTERNAL_TARGETS

export const MONITOR_PROVIDERS = ['chatgpt', 'deepseek'] as const
export type MonitorProvider = typeof MONITOR_PROVIDERS[number]

export const MONITOR_HOSTS = {
    chatgpt: 'https://chatgpt.com',
    deepseek: 'https://chat.deepseek.com',
} as const

export const AI_CHAT_CONSTANTS = {
    SSE_CHUNK_EVENT: 'sse-chunk',
    SESSION_COOKIE_NAME: '__Secure-next-auth.session-token',
    CHATGPT_HOST: 'https://chatgpt.com',
    COOKIE_DOMAIN: '.chatgpt.com',
} as const

export const SUBTITLES_WINDOW_CONSTANTS = {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 150,
    DEFAULT_TOP_OFFSET: 20,
    ROUTE_HASH: 'subtitles'
} as const

export const ROUTE_PATHS = {
    SHOW: '/api/show',
    TAGS: '/api/tags',
    AUTH_TOKEN: '/v1/auth/token',
    CHAT_COMPLETIONS: '/v1/chat/completions',
    CONFIG: '/api/config',
    SCREENSHOT_APP: '/screenshot/app',
    SCREENSHOT_DESKTOP: '/screenshot/desktop',
    DIRECTORY: '/api/directory',
    VIDEO_MERGE: '/api/video/merge',
    TTS_STATUS: '/api/tts/status',
    TTS_SYNTHESIZE: '/api/tts/synthesize',
    TTS_DOWNLOAD: '/api/tts/download',
    TTS_DELETE: '/api/tts/delete',
    STUDY_REQUEST: '/api/study/request',
    NOTE_GENERATE: '/api/note/generate',
    NOTE_STATUS: '/api/note/status/:id',
    NOTE_RESULT: '/api/note/:id',
} as const

export const STUDY_CONSTANTS = {
    STUDY_LIST_TOPIC: 'study_list',
    STUDYING_LIST_TOPIC: 'studying_list',
    STUDY_SUCCESS_COUNT_KEY: 'study_success_count',
    STUDY_TIME_KEY: 'study_total_time',
    STUDY_LIST_ERROR_KEY: 'study_list_error',
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
