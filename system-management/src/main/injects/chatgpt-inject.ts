import { htmlElementFocus } from './utils'

interface MonitorBridge {
    reportSseChunk(chunk: string): void
    requestOpenExternalLogin(provider: 'chatgpt' | 'deepseek'): Promise<unknown>
}

interface AutomationResult {
    success: boolean
    error?: string
}

interface MonitorWindow extends Window {
    monitor?: MonitorBridge
    automateChat?: (prompt: string) => Promise<AutomationResult>
}

const pageWindow = window as unknown as MonitorWindow

function isConversationUrl(url: string): boolean {
    return url.includes('/backend-api/conversation') || url.includes('/backend-api/f/conversation')
}

async function reportStream(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
    const decoder = new TextDecoder()
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            if (chunk) pageWindow.monitor?.reportSseChunk(chunk)
        }
    } catch (err) {
        console.error('[Monitor] Interceptor stream error:', err)
    }
}

function installFetchInterceptor(): void {
    const originalFetch = window.fetch
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const response = await originalFetch(...args)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        if (!isConversationUrl(url)) return response

        const reader = response.clone().body?.getReader()
        if (reader) void reportStream(reader)
        return response
    }
}

function findInputArea(): HTMLElement | null {
    return document.querySelector<HTMLTextAreaElement>('#prompt-textarea') ||
        document.querySelector<HTMLElement>('div[contenteditable="true"]')
}

function clearInput(textarea: HTMLElement): void {
    if (textarea.tagName === 'TEXTAREA') {
        (textarea as HTMLTextAreaElement).value = ''
    } else {
        textarea.innerText = ''
    }
}

function findSendButton(): HTMLButtonElement | null {
    return document.getElementById('composer-submit-button') as HTMLButtonElement ||
        document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]') ||
        document.querySelector<HTMLButtonElement>('button[aria-label="Send prompt"]') ||
        document.querySelector<HTMLButtonElement>('button.composer-submit-btn')
}

function findFallbackSendButton(): HTMLButtonElement | null {
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    return buttons.filter(button => button.querySelector('svg')).pop() ?? null
}

async function automateChat(prompt: string): Promise<AutomationResult> {
    try {
        const textarea = findInputArea()
        if (!textarea) return { success: false, error: 'Input area not found' }

        htmlElementFocus(textarea, window)
        clearInput(textarea)
        document.execCommand('insertText', false, prompt)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))

        await new Promise<void>(resolve => setTimeout(resolve, 800))

        const sendBtn = findSendButton()
        if (!sendBtn || sendBtn.disabled) {
            const fallback = findFallbackSendButton()
            if (fallback && !fallback.disabled) {
                fallback.click()
                return { success: true }
            }
            return { success: false, error: 'Send button state invalid' }
        }

        sendBtn.click()
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

function installLoginHandler(): void {
    if (!window.location.href.endsWith('/login')) return
    const loginButton = document.querySelector<HTMLButtonElement>('button[data-testid="login-button"]')
    loginButton?.addEventListener('click', () => {
        if (!pageWindow.monitor) return
        void pageWindow.monitor.requestOpenExternalLogin('chatgpt').catch(err => {
            console.error('[Monitor] Failed to open external login:', err)
        })
    }, false)
}

function init(): void {
    if (!window.location.hostname.endsWith('chatgpt.com')) return
    installFetchInterceptor()
    pageWindow.automateChat = automateChat
    installLoginHandler()
}

init()
