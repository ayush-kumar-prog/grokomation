// Grok Canvas Redirect - Content Script
// Adds "OPEN IN CANVAS" button on Grok pages and intercepts Enter key

(function() {
  'use strict';

  const CANVAS_URL = 'http://localhost:5174';
  let fabAdded = false;
  let canvasWindow = null;
  let keyListenerAdded = false;

  // Find the Grok input field and get its value
  function getGrokInputValue() {
    const selectors = [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="ask"]',
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const value = el.value || el.textContent || el.innerText || '';
        if (value.trim()) {
          return value.trim();
        }
      }
    }

    return '';
  }

  // Find the Grok input element itself
  function getGrokInputElement() {
    const selectors = [
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="ask"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }

    return null;
  }

  // Send message to existing canvas tab or open new one
  function openCanvas(query) {
    console.log('[Grok Canvas] Opening with query:', query);

    // Use BroadcastChannel to communicate with existing canvas tab
    const channel = new BroadcastChannel('grok-canvas-channel');

    // Send the query to any listening canvas tabs
    channel.postMessage({
      type: 'GROK_QUERY',
      query: query,
      source: 'x.com',
      timestamp: Date.now()
    });

    // Check if we have a valid window reference
    if (canvasWindow && !canvasWindow.closed) {
      // Window is still open - just focus it
      canvasWindow.focus();
      console.log('[Grok Canvas] Focused existing window');
    } else {
      // Need to open a new window
      const params = new URLSearchParams();
      if (query) {
        params.set('query', query);
      }
      params.set('source', 'x.com');
      params.set('from', 'grok');

      const url = query ? `${CANVAS_URL}?${params.toString()}` : CANVAS_URL;

      // Open with specific window name to help reuse
      canvasWindow = window.open(url, 'GrokCanvasWindow');
      console.log('[Grok Canvas] Opened new window');
    }

    channel.close();
  }

  // Add keyboard listener to intercept Enter key in Grok input
  function addKeyboardListener() {
    if (keyListenerAdded) return;
    if (!window.location.href.includes('grok')) return;

    // Use capture phase to intercept before Grok's handlers
    document.addEventListener('keydown', (e) => {
      // Only on Grok pages
      if (!window.location.href.includes('grok')) return;

      // Check if Enter is pressed (with or without Cmd/Ctrl)
      if (e.key === 'Enter' && !e.shiftKey) {
        const target = e.target;

        // Check if we're in a text input area
        const isTextInput =
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.contentEditable === 'true' ||
          target.closest('[contenteditable="true"]');

        if (isTextInput) {
          const query = getGrokInputValue();

          if (query) {
            console.log('[Grok Canvas] Enter pressed, intercepting with query:', query);

            // Stop the event from reaching Grok
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Open canvas with the query
            openCanvas(query);

            return false;
          }
        }
      }
    }, true); // true = capture phase

    keyListenerAdded = true;
    console.log('[Grok Canvas] Keyboard listener added');
  }

  // Add the floating "OPEN IN CANVAS" button
  function addFAB() {
    if (fabAdded) return;
    if (!window.location.href.includes('grok')) return;

    const existing = document.getElementById('grok-canvas-fab');
    if (existing) existing.remove();

    const fab = document.createElement('div');
    fab.id = 'grok-canvas-fab';
    fab.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;">
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/>
      </svg>
      <span style="white-space:nowrap;">OPEN IN CANVAS</span>
    `;

    Object.assign(fab.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '2147483647',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: '#000000',
      color: '#ffffff',
      border: '3px solid #ffffff',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '700',
      fontSize: '12px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      borderRadius: '0'
    });

    fab.addEventListener('mouseenter', () => {
      fab.style.background = '#ffffff';
      fab.style.color = '#000000';
      fab.style.border = '3px solid #000000';
    });

    fab.addEventListener('mouseleave', () => {
      fab.style.background = '#000000';
      fab.style.color = '#ffffff';
      fab.style.border = '3px solid #ffffff';
    });

    fab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const query = getGrokInputValue();
      openCanvas(query);
    });

    document.body.appendChild(fab);
    fabAdded = true;
    console.log('[Grok Canvas] FAB added');
  }

  function isGrokPage() {
    return window.location.href.includes('grok');
  }

  function init() {
    if (isGrokPage()) {
      addFAB();
      addKeyboardListener();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      fabAdded = false;
      keyListenerAdded = false;
      setTimeout(init, 500);
    }
  }, 500);

  const observer = new MutationObserver(() => {
    if (isGrokPage() && !document.getElementById('grok-canvas-fab')) {
      fabAdded = false;
      addFAB();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
