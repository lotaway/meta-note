(function () {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;

    if (!url.includes('/backend-api/conversation') && !url.includes('/backend-api/f/conversation')) {
      return response;
    }
    console.log('[Monitor] Target fetch detected:', url);
    const clone = response.clone();
    const reader = clone.body.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[Monitor] Stream finished');
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            const base64 = btoa(unescape(encodeURIComponent(chunk)));
            console.log('__SSE_PREFIX__' + base64);
          }
        }
      } catch (err) {
        console.error('[Monitor] Interceptor stream error:', err);
      }
    })();

    return response;
  };

  window.automateChat = async (prompt) => {
    try {
      const textarea = document.querySelector('#prompt-textarea') ||
        document.querySelector('div[contenteditable="true"]');

      if (!textarea) return { success: false, error: 'Input area not found' };

      textarea.focus();

      if (textarea.tagName === 'TEXTAREA') {
        textarea.value = '';
      } else {
        textarea.innerText = '';
      }

      document.execCommand('insertText', false, prompt);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));

      await new Promise(r => setTimeout(r, 800));

      const sendBtn = document.getElementById("composer-submit-button") ||
        document.querySelector('button[data-testid="send-button"]') ||
        document.querySelector('button[aria-label="Send prompt"]') ||
        document.querySelector('button.composer-submit-btn');

      if (!sendBtn || sendBtn.disabled) {
        const btns = Array.from(document.querySelectorAll('button'));
        const fallbackBtn = btns.filter(b => b.querySelector('svg')).pop();
        if (fallbackBtn && !fallbackBtn.disabled) {
          fallbackBtn.click();
          return { success: true };
        }
        return { success: false, error: 'Send button state invalid' };
      }

      sendBtn.click();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  console.log('[Monitor] Enhanced Interceptor & Automation Injected');

  if (!window.location.href.endsWith("/login")) {
    return
  }
  const btn = document.querySelector('button[data-testid="login-button"]')
  if (!btn) {
    return
  }
  btn.addEventListener("click", () => console.log('[Monitor] Login click'), false);
})();
