import * as CONSTANTS from "../constants"
import { htmlElementFocus } from "./utils"

(function (): void {
  if (!window.location.hostname.includes("deepseek.com")) {
    console.log('[DeepSeek Monitor] Script injected but wrong host:', window.location.hostname)
    return
  }

  console.log('[DeepSeek Monitor] Initializing Internal Script on:', window.location.href)

  const originalFetch = window.fetch

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const response = await originalFetch(...args)
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url

    if (!url.includes('/api/v0/chat/completion')) {
      return response
    }

    console.log('[DeepSeek Monitor] Target fetch detected:', url)
    const clone = response.clone()
    const reader = clone.body?.getReader()

    if (!reader) {
      return response
    }

    const decoder = new TextDecoder();

    (async (): Promise<void> => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[DeepSeek Monitor] Stream finished')
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            const base64 = btoa(unescape(encodeURIComponent(chunk)))
            console.log(CONSTANTS.AI_CHAT_CONSTANTS.SSE_RAW_PREFIX + base64)
          }
        }
      } catch (err) {
        console.error('[DeepSeek Monitor] Interceptor stream error:', err)
      }
    })()

    return response
  }

  (window as any).automateChat = async (prompt: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[DeepSeek Monitor] automateChat called with prompt length:', prompt.length)
    try {
      const textarea = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="消息"]') ||
        document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Message DeepSeek"]')

      if (!textarea) {
        return { success: false, error: 'Input area not found' }
      }
      htmlElementFocus(textarea, window)
      if (textarea.tagName === 'TEXTAREA') {
        (textarea as HTMLTextAreaElement).value = ''
      }

      const sendBtn = document.querySelector<HTMLDivElement>('div._7436101') ||
        document.querySelector<HTMLDivElement>('div.bcc55ca1') ||
        (() => {
          const btns = document.querySelectorAll<HTMLDivElement>('div.ds-icon-button')
          if (btns.length === 0) {
            return null
          }
          return btns[btns.length - 1]
        })() ||
        document.querySelector<HTMLDivElement>('div[role="button"] svg')
      sendBtn?.click()

      document.execCommand('insertText', false, prompt)
      if (textarea.value === "")
        textarea.value = prompt
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.dispatchEvent(new Event('change', { bubbles: true }))

      await new Promise<void>(r => setTimeout(r, 800))

      if (!sendBtn || sendBtn.classList.contains('disabled')) {
        const btns = Array.from(document.querySelectorAll<HTMLDivElement>('div'))
        const fallbackBtn = btns.filter(b => b.querySelector('svg')).pop()
        if (fallbackBtn && !fallbackBtn.classList.contains('disabled')) {
          fallbackBtn.click()
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

  console.log('[DeepSeek Monitor] Enhanced Interceptor & Automation Injected')

  function handleLoginClick(): void {
    console.log('[DeepSeek Monitor] Login button clicked')
  }

  if (window.location.href.includes("/login") || window.location.href.includes("/auth")) {
    const btn = document.querySelector<HTMLButtonElement>('button[type="submit"]') ||
      document.querySelector<HTMLButtonElement>('button[aria-label*="登录"]') ||
      document.querySelector<HTMLButtonElement>('button[aria-label*="Login"]')

    if (btn) {
      btn.addEventListener("click", handleLoginClick, false)
    }
  }
})()