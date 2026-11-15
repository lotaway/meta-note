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

function init(): void {
    if (!window.location.hostname.endsWith('chatgpt.com')) {
        return
    }

    const originalFetch = window.fetch

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const response = await originalFetch(...args)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        if (!url.includes('/backend-api/conversation') && !url.includes('/backend-api/f/conversation')) {
            return response
        }

        const reader = response.clone().body?.getReader()
        if (!reader) return response

        const decoder = new TextDecoder()
        void (async (): Promise<void> => {
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
        })()

        return response
    }

    pageWindow.automateChat = async (prompt: string): Promise<AutomationResult> => {
        try {
            const textarea = document.querySelector<HTMLTextAreaElement>('#prompt-textarea') ||
                document.querySelector<HTMLElement>('div[contenteditable="true"]')

            if (!textarea) {
                return { success: false, error: 'Input area not found' }
            }
            htmlElementFocus(textarea, window)
            if (textarea.tagName === 'TEXTAREA') {
                (textarea as HTMLTextAreaElement).value = ''
            } else {
                (textarea as HTMLElement).innerText = ''
            }

            document.execCommand('insertText', false, prompt)
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.dispatchEvent(new Event('change', { bubbles: true }))

            await new Promise<void>(resolve => setTimeout(resolve, 800))

            const sendBtn = document.getElementById('composer-submit-button') as HTMLButtonElement ||
                document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]') ||
                document.querySelector<HTMLButtonElement>('button[aria-label="Send prompt"]') ||
                document.querySelector<HTMLButtonElement>('button.composer-submit-btn')

            if (!sendBtn || sendBtn.disabled) {
                const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
                const fallback = buttons.filter(button => button.querySelector('svg')).pop()
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

    const handleLoginClick = (): void => {
        if (!pageWindow.monitor) return
        void pageWindow.monitor.requestOpenExternalLogin('chatgpt').catch(err => {
            console.error('[Monitor] Failed to open external login:', err)
        })
    }

    if (!window.location.href.endsWith('/login')) return
    const loginButton = document.querySelector<HTMLButtonElement>('button[data-testid="login-button"]')
    loginButton?.addEventListener('click', handleLoginClick, false)
}

init()
