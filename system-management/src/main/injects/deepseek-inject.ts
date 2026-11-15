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
    if (!window.location.hostname.includes('deepseek.com')) {
        return
    }

    const originalFetch = window.fetch

    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
        const response = await originalFetch(...args)
        const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
        if (!url.includes('/api/v0/chat/completion')) return response

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
                console.error('[DeepSeek Monitor] Interceptor stream error:', err)
            }
        })()

        return response
    }

    pageWindow.automateChat = async (prompt: string): Promise<AutomationResult> => {
        try {
            const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Message DeepSeek"]')

            if (!textarea) {
                return { success: false, error: 'Input area not found' }
            }
            htmlElementFocus(textarea, window)
            textarea.value = prompt
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.dispatchEvent(new Event('change', { bubbles: true }))

            await new Promise<void>(resolve => setTimeout(resolve, 800))

            const sendButton = document.querySelector<HTMLDivElement>('div._7436101') ||
                document.querySelector<HTMLDivElement>('div.bcc55ca1') ||
                document.querySelector<HTMLDivElement>('div[role="button"]')

            if (!sendButton || sendButton.classList.contains('disabled')) {
                return { success: false, error: 'Send button state invalid' }
            }

            sendButton.click()
            return { success: true }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    const handleLoginClick = (): void => {
        if (!pageWindow.monitor) return
        void pageWindow.monitor.requestOpenExternalLogin('deepseek').catch(err => {
            console.error('[DeepSeek Monitor] Failed to open external login:', err)
        })
    }

    if (!window.location.href.includes('/login') && !window.location.href.includes('/auth')) return
    const loginButton = document.querySelector<HTMLButtonElement>('button[type="submit"]')
    loginButton?.addEventListener('click', handleLoginClick, false)
}

init()
