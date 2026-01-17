/**
 * Grok Flows Bookmarklet
 * Injects "Grok Flows" into X.com sidebar with a chat interface
 *
 * Usage: Create a bookmark with URL: javascript:(paste minified version)
 * Or for development: Run this file in browser console on x.com
 */

(function() {
  'use strict';

  // Prevent double injection
  if (window.__grokFlowsInjected) {
    console.log('Grok Flows already injected');
    document.getElementById('grok-flows-overlay').style.display = 'flex';
    return;
  }
  window.__grokFlowsInjected = true;

  // ============ CONFIGURATION ============
  const CONFIG = {
    API_BASE: 'http://localhost:5173', // Vite dev server with proxy
    // Direct X API access (for when localhost isn't available)
    TWITTER_BEARER: 'AAAAAAAAAAAAAAAAAAAAAP9M7AEAAAAAQ1YUSSOHBX1HL6MDRjTosOwlDhY=PPyGMGnKYpGusSydUSltyXtQo78h4sZZJNObyHzGnq1NUU90lr',
    USE_DIRECT_API: false, // Set to false to use localhost proxy
  };

  // ============ STYLES ============
  const styles = `
    #grok-flows-overlay {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      height: 100vh;
      background: #000000;
      border-left: 1px solid #2f3336;
      z-index: 9999;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #grok-flows-overlay * {
      box-sizing: border-box;
    }

    .gf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #2f3336;
      background: #000;
    }

    .gf-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e7e9ea;
      font-size: 20px;
      font-weight: 700;
    }

    .gf-header-title svg {
      width: 24px;
      height: 24px;
    }

    .gf-close-btn {
      background: none;
      border: none;
      color: #71767b;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gf-close-btn:hover {
      background: rgba(239, 243, 244, 0.1);
      color: #e7e9ea;
    }

    .gf-workflows {
      padding: 12px 16px;
      border-bottom: 1px solid #2f3336;
    }

    .gf-workflows-title {
      color: #71767b;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .gf-workflow-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #16181c;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      color: #e7e9ea;
      font-size: 14px;
    }

    .gf-workflow-item:hover {
      background: #1d1f23;
    }

    .gf-workflow-dot {
      width: 8px;
      height: 8px;
      background: #1d9bf0;
      border-radius: 50%;
    }

    .gf-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .gf-message {
      margin-bottom: 16px;
    }

    .gf-message-user {
      display: flex;
      justify-content: flex-end;
    }

    .gf-message-user .gf-message-content {
      background: #1d9bf0;
      color: white;
      border-radius: 16px 16px 4px 16px;
      padding: 12px 16px;
      max-width: 85%;
    }

    .gf-message-bot {
      display: flex;
      justify-content: flex-start;
    }

    .gf-message-bot .gf-message-content {
      background: #16181c;
      color: #e7e9ea;
      border-radius: 16px 16px 16px 4px;
      padding: 12px 16px;
      max-width: 85%;
    }

    .gf-message-content {
      font-size: 15px;
      line-height: 1.4;
    }

    .gf-tweet-card {
      background: #000;
      border: 1px solid #2f3336;
      border-radius: 12px;
      padding: 12px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .gf-tweet-author {
      color: #1d9bf0;
      font-weight: 600;
      font-size: 14px;
    }

    .gf-tweet-text {
      color: #e7e9ea;
      font-size: 14px;
      margin-top: 4px;
      line-height: 1.3;
    }

    .gf-tweet-meta {
      color: #71767b;
      font-size: 12px;
      margin-top: 8px;
      display: flex;
      gap: 12px;
    }

    .gf-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .gf-action-btn {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .gf-action-btn-primary {
      background: #1d9bf0;
      color: white;
    }

    .gf-action-btn-primary:hover {
      background: #1a8cd8;
    }

    .gf-action-btn-secondary {
      background: transparent;
      color: #1d9bf0;
      border: 1px solid #1d9bf0;
    }

    .gf-action-btn-secondary:hover {
      background: rgba(29, 155, 240, 0.1);
    }

    .gf-input-area {
      padding: 12px 16px;
      border-top: 1px solid #2f3336;
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .gf-input {
      flex: 1;
      background: #16181c;
      border: 1px solid #2f3336;
      border-radius: 20px;
      padding: 12px 16px;
      color: #e7e9ea;
      font-size: 15px;
      resize: none;
      outline: none;
      min-height: 44px;
      max-height: 120px;
    }

    .gf-input::placeholder {
      color: #71767b;
    }

    .gf-input:focus {
      border-color: #1d9bf0;
    }

    .gf-send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1d9bf0;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .gf-send-btn:hover {
      background: #1a8cd8;
    }

    .gf-send-btn:disabled {
      background: #16181c;
      cursor: not-allowed;
    }

    .gf-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #71767b;
    }

    .gf-loading-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #2f3336;
      border-top-color: #1d9bf0;
      border-radius: 50%;
      animation: gf-spin 0.8s linear infinite;
    }

    @keyframes gf-spin {
      to { transform: rotate(360deg); }
    }

    .gf-error {
      background: rgba(244, 33, 46, 0.1);
      border: 1px solid rgba(244, 33, 46, 0.3);
      color: #f4212e;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }

    .gf-sidebar-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
      color: #e7e9ea;
    }

    .gf-sidebar-item:hover {
      background: rgba(231, 233, 234, 0.1);
    }

    .gf-sidebar-item span {
      font-size: 20px;
      font-weight: 400;
    }

    .gf-save-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #000;
      border: 1px solid #2f3336;
      border-radius: 16px;
      padding: 24px;
      z-index: 10000;
      width: 320px;
    }

    .gf-save-dialog h3 {
      color: #e7e9ea;
      margin: 0 0 16px 0;
      font-size: 18px;
    }

    .gf-save-dialog input {
      width: 100%;
      background: #16181c;
      border: 1px solid #2f3336;
      border-radius: 8px;
      padding: 12px;
      color: #e7e9ea;
      font-size: 15px;
      margin-bottom: 16px;
    }

    .gf-save-dialog-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .gf-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(91, 112, 131, 0.4);
      z-index: 9999;
    }

    /* Invoker indicator */
    .gf-invoker-indicator {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1d9bf0;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .gf-invoker-indicator:hover {
      background: #1a8cd8;
    }
  `;

  // ============ ICONS ============
  const icons = {
    grokFlows: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10.59 12L4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42L10.59 12z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
  };

  // ============ STATE ============
  let messages = [];
  let savedWorkflows = JSON.parse(localStorage.getItem('grokFlows') || '[]');
  let currentResult = null;
  let isLoading = false;

  // ============ INJECT STYLES ============
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ============ CREATE OVERLAY ============
  const overlay = document.createElement('div');
  overlay.id = 'grok-flows-overlay';
  overlay.innerHTML = `
    <div class="gf-header">
      <div class="gf-header-title">
        ${icons.grokFlows}
        <span>Grok Flows</span>
      </div>
      <button class="gf-close-btn" id="gf-close">${icons.close}</button>
    </div>

    <div class="gf-workflows" id="gf-workflows">
      <div class="gf-workflows-title">Saved Workflows</div>
      <div id="gf-workflow-list"></div>
    </div>

    <div class="gf-messages" id="gf-messages">
      <div class="gf-message gf-message-bot">
        <div class="gf-message-content">
          Welcome to Grok Flows! Type a workflow like:<br><br>
          <em>"find me elon musk's most recent 10 tweets"</em><br>
          <em>"notify me when theres 50 #crypto posts per hour"</em>
        </div>
      </div>
    </div>

    <div class="gf-input-area">
      <textarea class="gf-input" id="gf-input" placeholder="Ask anything..." rows="1"></textarea>
      <button class="gf-send-btn" id="gf-send">${icons.send}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // ============ CREATE INVOKER INDICATOR ============
  const invokerIndicator = document.createElement('div');
  invokerIndicator.className = 'gf-invoker-indicator';
  invokerIndicator.innerHTML = `
    <div class="gf-loading-spinner" style="display: none;"></div>
    ${icons.grokFlows}
    <span>Grok Flows Active</span>
  `;
  invokerIndicator.onclick = () => overlay.style.display = 'flex';
  document.body.appendChild(invokerIndicator);

  // ============ INJECT SIDEBAR ITEM ============
  function injectSidebarItem() {
    // Check if already injected
    if (document.getElementById('grok-flows-nav-item')) {
      console.log('Grok Flows sidebar already exists');
      return;
    }

    // Find the Grok link in sidebar
    const allLinks = document.querySelectorAll('a[href="/i/grok"]');
    const grokLink = allLinks[0];

    if (!grokLink) {
      console.log('Grok link not found, retrying in 1s...');
      setTimeout(injectSidebarItem, 1000);
      return;
    }

    // Get the parent container of the Grok link (the nav item wrapper)
    const grokNavItem = grokLink.closest('nav') ? grokLink : grokLink.parentElement?.parentElement?.parentElement;

    // Create our nav item - copy the structure from Grok's link
    const grokFlowsLink = document.createElement('a');
    grokFlowsLink.id = 'grok-flows-nav-item';
    grokFlowsLink.href = '#';
    grokFlowsLink.setAttribute('role', 'link');
    grokFlowsLink.style.cssText = grokLink.style.cssText;
    grokFlowsLink.className = grokLink.className;

    // Copy the inner HTML structure and modify it
    grokFlowsLink.innerHTML = grokLink.innerHTML;

    // Find and update the text
    const spans = grokFlowsLink.querySelectorAll('span');
    spans.forEach(span => {
      if (span.textContent.trim() === 'Grok') {
        span.textContent = 'Grok Flows';
      }
    });

    // Add click handler
    grokFlowsLink.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.style.display = 'flex';
    };

    // Insert after the Grok link
    if (grokLink.parentElement) {
      grokLink.parentElement.insertAdjacentElement('afterend', grokFlowsLink);
      console.log('Grok Flows sidebar item injected successfully!');
    }
  }

  // ============ RENDER FUNCTIONS ============
  function renderWorkflows() {
    const list = document.getElementById('gf-workflow-list');
    if (!list) return;

    if (savedWorkflows.length === 0) {
      list.innerHTML = '<div style="color: #71767b; font-size: 13px; padding: 8px 0;">No saved workflows yet</div>';
      return;
    }

    list.innerHTML = savedWorkflows.map(w => `
      <div class="gf-workflow-item" data-query="${encodeURIComponent(w.query)}">
        <div class="gf-workflow-dot"></div>
        ${w.name}
      </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.gf-workflow-item').forEach(item => {
      item.onclick = () => {
        const query = decodeURIComponent(item.dataset.query);
        document.getElementById('gf-input').value = query;
        executeQuery(query);
      };
    });
  }

  function renderMessages() {
    const container = document.getElementById('gf-messages');
    if (!container) return;

    let html = `
      <div class="gf-message gf-message-bot">
        <div class="gf-message-content">
          Welcome to Grok Flows! Type a workflow like:<br><br>
          <em>"find me elon musk's most recent 10 tweets"</em><br>
          <em>"notify me when theres 50 #crypto posts per hour"</em>
        </div>
      </div>
    `;

    messages.forEach(msg => {
      if (msg.type === 'user') {
        html += `
          <div class="gf-message gf-message-user">
            <div class="gf-message-content">${escapeHtml(msg.text)}</div>
          </div>
        `;
      } else if (msg.type === 'bot') {
        html += `
          <div class="gf-message gf-message-bot">
            <div class="gf-message-content">${msg.html || escapeHtml(msg.text)}</div>
          </div>
        `;
      } else if (msg.type === 'loading') {
        html += `
          <div class="gf-message gf-message-bot">
            <div class="gf-message-content">
              <div class="gf-loading">
                <div class="gf-loading-spinner"></div>
                <span>Searching X...</span>
              </div>
            </div>
          </div>
        `;
      } else if (msg.type === 'error') {
        html += `
          <div class="gf-message gf-message-bot">
            <div class="gf-message-content">
              <div class="gf-error">${escapeHtml(msg.text)}</div>
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // Attach action button handlers
    container.querySelectorAll('.gf-action-btn-primary').forEach(btn => {
      if (btn.textContent.includes('Canvas')) {
        btn.onclick = () => openInCanvas();
      }
    });
    container.querySelectorAll('.gf-action-btn-secondary').forEach(btn => {
      if (btn.textContent.includes('Save')) {
        btn.onclick = () => showSaveDialog();
      }
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============ API FUNCTIONS ============
  async function executeQuery(query) {
    if (isLoading) return;
    isLoading = true;

    // Add user message
    messages.push({ type: 'user', text: query });
    messages.push({ type: 'loading' });
    renderMessages();

    try {
      // Extract search query from natural language
      const searchQuery = extractSearchQuery(query);
      console.log('Searching for:', searchQuery);

      // Build search params
      const searchParams = new URLSearchParams({
        query: searchQuery,
        max_results: '20',
        'tweet.fields': 'created_at,public_metrics,author_id,text',
        'expansions': 'author_id',
        'user.fields': 'username,name,profile_image_url',
      });

      let searchResponse;

      if (CONFIG.USE_DIRECT_API) {
        // Direct X API call (with CORS proxy for browser)
        const corsProxy = 'https://corsproxy.io/?';
        const xApiUrl = `https://api.twitter.com/2/tweets/search/recent?${searchParams}`;
        console.log('Fetching via CORS proxy:', corsProxy + encodeURIComponent(xApiUrl));

        searchResponse = await fetch(corsProxy + encodeURIComponent(xApiUrl), {
          headers: {
            'Authorization': `Bearer ${CONFIG.TWITTER_BEARER}`,
          },
        });
      } else {
        // Use localhost proxy
        console.log('Fetching from localhost:', `${CONFIG.API_BASE}/api/twitter/2/tweets/search/recent?${searchParams}`);
        searchResponse = await fetch(`${CONFIG.API_BASE}/api/twitter/2/tweets/search/recent?${searchParams}`, {
          mode: 'cors',
          credentials: 'omit',
        });
      }

      console.log('Response status:', searchResponse.status);

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('X API error:', searchResponse.status, errorText);
        throw new Error(`X API error: ${searchResponse.status}`);
      }

      const data = await searchResponse.json();
      console.log('X API response:', data);

      // Map users
      const users = new Map((data.includes?.users || []).map(u => [u.id, u]));

      // Format tweets
      const tweets = (data.data || []).map(tweet => {
        const author = users.get(tweet.author_id);
        return {
          id: tweet.id,
          text: tweet.text,
          author: author?.name || 'Unknown',
          username: author?.username || 'unknown',
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
        };
      });

      currentResult = { query, searchQuery, tweets };

      // Remove loading, add results
      messages.pop();

      if (tweets.length === 0) {
        messages.push({ type: 'bot', text: 'No tweets found for that query. Try a different search term.' });
      } else {
        let tweetsHtml = `Found ${tweets.length} tweets for "${searchQuery}":<br><br>`;
        tweets.slice(0, 5).forEach((t, i) => {
          tweetsHtml += `
            <div class="gf-tweet-card">
              <div class="gf-tweet-author">@${t.username}</div>
              <div class="gf-tweet-text">${escapeHtml(t.text.slice(0, 200))}${t.text.length > 200 ? '...' : ''}</div>
              <div class="gf-tweet-meta">
                <span>${t.likes} likes</span>
                <span>${t.retweets} retweets</span>
              </div>
            </div>
          `;
        });
        if (tweets.length > 5) {
          tweetsHtml += `<div style="color: #71767b; font-size: 13px;">...and ${tweets.length - 5} more</div>`;
        }
        tweetsHtml += `
          <div class="gf-actions">
            <button class="gf-action-btn gf-action-btn-primary">Open in Canvas</button>
            <button class="gf-action-btn gf-action-btn-secondary">Save Workflow</button>
          </div>
        `;
        messages.push({ type: 'bot', html: tweetsHtml });
      }

      renderMessages();

    } catch (error) {
      console.error('Grok Flows error:', error);
      messages.pop(); // Remove loading
      messages.push({ type: 'error', text: `Error: ${error.message}` });
      renderMessages();
    }

    isLoading = false;
  }

  function extractSearchQuery(input) {
    const lowerInput = input.toLowerCase();

    // Check for hashtags first
    const hashtagMatch = input.match(/#\w+/g);
    if (hashtagMatch) return hashtagMatch.join(' ');

    // Check for @mentions - convert to "from:" query
    const mentionMatch = input.match(/@(\w+)/);
    if (mentionMatch) return `from:${mentionMatch[1]}`;

    // Check for "elon musk" or similar name patterns
    if (lowerInput.includes('elon') || lowerInput.includes('musk')) {
      return 'from:elonmusk';
    }

    // Check for specific keywords
    if (lowerInput.includes('crypto')) return '#crypto';
    if (lowerInput.includes('bitcoin') || lowerInput.includes('btc')) return '#bitcoin';
    if (lowerInput.includes('tesla')) return '#tesla OR from:tesla';
    if (lowerInput.includes('ai') || lowerInput.includes('artificial intelligence')) return '#AI';

    // Extract quoted text
    const quotedMatch = input.match(/"([^"]+)"/);
    if (quotedMatch) return quotedMatch[1];

    // Remove common filler words and use remaining keywords
    const words = input
      .replace(/find|me|search|get|show|recent|latest|most|tweets?|posts?|from|the|about|when|there'?s?|notify|per|hour|an?/gi, '')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'the', 'for'].includes(w.toLowerCase()));

    return words.join(' ') || input;
  }

  function openInCanvas() {
    if (!currentResult) return;
    const params = new URLSearchParams({
      query: currentResult.query,
      searchQuery: currentResult.searchQuery,
    });
    window.open(`${CONFIG.API_BASE}?${params}`, '_blank');
  }

  function showSaveDialog() {
    if (!currentResult) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'gf-backdrop';

    const dialog = document.createElement('div');
    dialog.className = 'gf-save-dialog';
    dialog.innerHTML = `
      <h3>Save Workflow</h3>
      <input type="text" id="gf-workflow-name" placeholder="Workflow name..." autofocus>
      <div class="gf-save-dialog-buttons">
        <button class="gf-action-btn gf-action-btn-secondary" id="gf-save-cancel">Cancel</button>
        <button class="gf-action-btn gf-action-btn-primary" id="gf-save-confirm">Save</button>
      </div>
    `;

    backdrop.onclick = () => {
      backdrop.remove();
      dialog.remove();
    };

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    document.getElementById('gf-save-cancel').onclick = () => {
      backdrop.remove();
      dialog.remove();
    };

    document.getElementById('gf-save-confirm').onclick = () => {
      const name = document.getElementById('gf-workflow-name').value.trim();
      if (name) {
        savedWorkflows.push({
          id: Date.now().toString(),
          name,
          query: currentResult.query,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('grokFlows', JSON.stringify(savedWorkflows));
        renderWorkflows();
        messages.push({ type: 'bot', text: `Workflow "${name}" saved! You can now use it by typing @${name.replace(/\s+/g, '-')} in comments or DMs.` });
        renderMessages();
      }
      backdrop.remove();
      dialog.remove();
    };

    document.getElementById('gf-workflow-name').onkeydown = (e) => {
      if (e.key === 'Enter') {
        document.getElementById('gf-save-confirm').click();
      }
    };
  }

  // ============ EVENT HANDLERS ============
  document.getElementById('gf-close').onclick = () => {
    overlay.style.display = 'none';
  };

  const inputEl = document.getElementById('gf-input');
  const sendBtn = document.getElementById('gf-send');

  inputEl.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  inputEl.oninput = () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  };

  sendBtn.onclick = sendMessage;

  function sendMessage() {
    const query = inputEl.value.trim();
    if (!query || isLoading) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    executeQuery(query);
  }

  // ============ COMMENT/DM MONITORING (Demo) ============
  function setupInvoker() {
    // Monitor for @workflow mentions in compose boxes
    const observer = new MutationObserver(() => {
      const composeBoxes = document.querySelectorAll('[data-testid="tweetTextarea_0"], [data-testid="dmComposerTextInput"]');
      composeBoxes.forEach(box => {
        if (box.dataset.grokFlowsMonitored) return;
        box.dataset.grokFlowsMonitored = 'true';

        box.addEventListener('input', () => {
          const text = box.textContent || '';
          // Check for @workflow-name pattern
          savedWorkflows.forEach(w => {
            const trigger = `@${w.name.replace(/\s+/g, '-')}`;
            if (text.includes(trigger)) {
              // Show indicator
              invokerIndicator.querySelector('span').textContent = `Running: ${w.name}`;
              invokerIndicator.querySelector('.gf-loading-spinner').style.display = 'block';

              // Execute the workflow
              setTimeout(() => {
                invokerIndicator.querySelector('span').textContent = 'Grok Flows Active';
                invokerIndicator.querySelector('.gf-loading-spinner').style.display = 'none';
                // Open overlay with results
                overlay.style.display = 'flex';
                executeQuery(w.query);
              }, 1500);
            }
          });
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============ INITIALIZE ============
  injectSidebarItem();
  renderWorkflows();
  setupInvoker();

  console.log('Grok Flows injected successfully!');
  console.log('Click "Grok Flows" in the sidebar or the indicator to open.');

})();
