import * as CONSTANTS from "./constants"

(function (): void {
  if (!window.location.hostname.endsWith("chatgpt.com")) {
    console.log('[Monitor] Script injected but wrong host:', window.location.hostname)
    return
  }

  console.log('[Monitor] Initializing Internal Script on:', window.location.href)

  const originalFetch = window.fetch

  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    const response = await originalFetch(...args)
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url

    if (!url.includes('/backend-api/conversation') && !url.includes('/backend-api/f/conversation')) {
      return response
    }

    console.log('[Monitor] Target fetch detected:', url)
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
            console.log('[Monitor] Stream finished')
            break
          }
          const chunk = decoder.decode(value, { stream: true })
          if (chunk) {
            const base64 = btoa(unescape(encodeURIComponent(chunk)))
            console.log(CONSTANTS.CHATGPT_CONSTANTS.SSE_RAW_PREFIX + base64)
          }
        }
      } catch (err) {
        console.error('[Monitor] Interceptor stream error:', err)
      }
    })()

    return response
  }

  (window as any).automateChat = async (prompt: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Monitor] automateChat called with prompt length:', prompt.length)
    try {
      const textarea = document.querySelector<HTMLTextAreaElement>('#prompt-textarea') ||
        document.querySelector<HTMLElement>('div[contenteditable="true"]')

      if (!textarea) {
        return { success: false, error: 'Input area not found' }
      }

      textarea.focus()

      if (textarea.tagName === 'TEXTAREA') {
        (textarea as HTMLTextAreaElement).value = ''
      } else {
        (textarea as HTMLElement).innerText = ''
      }

      document.execCommand('insertText', false, prompt)
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      textarea.dispatchEvent(new Event('change', { bubbles: true }))

      await new Promise<void>(r => setTimeout(r, 800))

      const sendBtn = document.getElementById("composer-submit-button") as HTMLButtonElement ||
        document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]') ||
        document.querySelector<HTMLButtonElement>('button[aria-label="Send prompt"]') ||
        document.querySelector<HTMLButtonElement>('button.composer-submit-btn')

      if (!sendBtn || sendBtn.disabled) {
        const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
        const fallbackBtn = btns.filter(b => b.querySelector('svg')).pop()
        if (fallbackBtn && !fallbackBtn.disabled) {
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

  console.log('[Monitor] Enhanced Interceptor & Automation Injected')

  function handleLoginClick(): void {
    console.log('[Monitor] Login button clicked, starting OAuth flow')

    if ((window as any).desktop && typeof (window as any).desktop.requestOpenExternalLogin === 'function') {
      console.log('[Monitor] Calling window.desktop.requestOpenExternalLogin()');
      (window as any).desktop.requestOpenExternalLogin().then(() => {
        console.log('[Monitor] External login initiated via desktop API')
      }).catch((err: Error) => {
        console.error('[Monitor] Failed to call desktop API:', err)
        tryWebSocketFallback()
      })
      return
    }

    tryWebSocketFallback()
  }

  function tryWebSocketFallback(): void {
    console.log('[Monitor] Attempting WebSocket connection to localhost:5050')
    try {
      const ws = new WebSocket('ws://localhost:5050')

      ws.onopen = () => {
        console.log('[Monitor] WebSocket connected, sending login request')
        ws.send(JSON.stringify({
          type: 'login_request',
          timestamp: Date.now(),
          source: 'chatgpt_inject'
        }))
        setTimeout(() => ws.close(), 1000)
      }

      ws.onerror = (error: Event) => {
        console.error('[Monitor] WebSocket connection error:', error)
        console.log('[Monitor] OAuth flow cannot be initiated from browser. Please login manually in external browser.')
      }

      ws.onclose = () => {
        console.log('[Monitor] WebSocket connection closed')
      }
    } catch (err) {
      console.error('[Monitor] Failed to create WebSocket:', err)
      console.log('[Monitor] OAuth flow cannot be initiated from browser. Please login manually in external browser.')
    }
  }

  if (!window.location.href.endsWith("/login")) {
    return
  }

  const btn = document.querySelector<HTMLButtonElement>('button[data-testid="login-button"]')
  if (!btn) {
    return
  }

  btn.addEventListener("click", handleLoginClick, false)
})()