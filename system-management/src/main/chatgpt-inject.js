(function() {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    
    if (url.includes('/backend-api/f/conversation')) {
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
    }
    return response;
  };

  window.automateChat = async (prompt) => {
    const textarea = document.querySelector('#prompt-textarea') || document.querySelector('div[contenteditable="true"]');
    if (!textarea) return { success: false, error: 'Textarea not found' };
    
    if (textarea.tagName === 'TEXTAREA') {
      textarea.value = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      textarea.innerText = prompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    await new Promise(r => setTimeout(r, 500));
    
    const sendBtn = document.querySelector('button[data-testid="send-button"]') || 
                    document.querySelector('button[aria-label="Send prompt"]') ||
                    document.querySelector('button.absolute.bottom-1.5.right-2');
                    
    if (!sendBtn) return { success: false, error: 'Send button not found' };
    sendBtn.click();
    return { success: true };
  };

  console.log('[Monitor] Enhanced Fetch interceptor & Automation injected');
})();
