(function () {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;

    if (!url.includes('/backend-api/f/conversation')) {
      return response;
    }

    console.log('[Monitor] Intercepting conversation stream:', url);

    const clone = response.clone();
    const reader = clone.body.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          console.log('SSE_RAW:' + btoa(unescape(encodeURIComponent(chunk))));
        }
      } catch (err) {
        console.error('[Monitor] Stream read error:', err);
      }
    })();
    return response;
  };

  window.automateChat = async (prompt) => {
    try {
      console.log('[Monitor] AutomateChat triggered with prompt:', prompt);

      const textarea = document.querySelector('#prompt-textarea') ||
        document.querySelector('div[contenteditable="true"]');

      if (!textarea) {
        console.error('[Monitor] Textarea not found');
        return { success: false, error: 'Input area not found' };
      }
      textarea.focus();
      if (textarea.tagName === 'TEXTAREA') {
        textarea.value = '';
      } else {
        textarea.innerText = '';
      }
      document.execCommand('insertText', false, prompt);
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 600));
      const sendBtn = document.getElementById("composer-submit-button") || document.querySelector('button[data-testid="send-button"]') ||
        document.querySelector('button[aria-label="Send prompt"]') ||
        document.querySelector('button.composer-submit-btn');

      if (!sendBtn || sendBtn.disabled) {
        const svgButtons = Array.from(document.querySelectorAll('button')).filter(btn => btn.querySelector('svg'));
        const fallbackBtn = svgButtons[svgButtons.length - 1];
        if (fallbackBtn && !fallbackBtn.disabled) {
          fallbackBtn.click();
          return { success: true };
        }
        return { success: false, error: 'Send button not found or disabled' };
      }

      sendBtn.click();
      console.log('[Monitor] Send button clicked');
      return { success: true };
    } catch (err) {
      console.error('[Monitor] Automation error:', err);
      return { success: false, error: err.message };
    }
  };

  console.log('[Monitor] Enhanced Fetch interceptor & Automation injected v2');
})();
