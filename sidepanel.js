/**
 * CowPilot Side Panel - Main chat logic
 * Handles UI, chat history, and screenshot integration
 */

// ===== DOM Elements =====
const chatContainer = document.getElementById('chatContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const modelBadge = document.getElementById('modelBadge');
const currentModelSpan = document.getElementById('currentModel');
const openSettingsBtn = document.getElementById('openSettings');
const openCustomizeBtn = document.getElementById('openCustomize');
const clearChatBtn = document.getElementById('clearChat');

// ===== State =====
let chatHistory = [];
let settings = {
  apiKey: '',
  model: 'google/gemini-2.0-flash-001'
};
let activePrompt = ''; // Custom system prompt

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  await loadChatHistory();
  await loadActivePrompt();
  setupEventListeners();
  updateModelBadge();
  renderChatHistory();
  autoResizeTextarea();
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['apiKey', 'model']);
    if (stored.apiKey) settings.apiKey = stored.apiKey;
    if (stored.model) settings.model = stored.model;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Load active prompt from Chrome storage
 */
async function loadActivePrompt() {
  try {
    const stored = await chrome.storage.local.get(['activePrompt']);
    activePrompt = stored.activePrompt || '';
  } catch (error) {
    console.error('Error loading prompt:', error);
  }
}

/**
 * Load chat history from Chrome storage
 */
async function loadChatHistory() {
  try {
    const stored = await chrome.storage.local.get(['chatHistory']);
    if (stored.chatHistory) {
      chatHistory = stored.chatHistory;
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
}

/**
 * Save chat history to Chrome storage
 */
async function saveChatHistory() {
  try {
    const historyToSave = chatHistory.slice(-40);
    await chrome.storage.local.set({ chatHistory: historyToSave });
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  sendBtn.addEventListener('click', handleSend);
  
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  
  messageInput.addEventListener('input', autoResizeTextarea);
  
  openSettingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
  
  openCustomizeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('customize.html') });
  });
  
  clearChatBtn.addEventListener('click', clearChat);
}

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

/**
 * Update model badge in UI
 */
function updateModelBadge() {
  if (!settings.apiKey) {
    modelBadge.classList.add('no-model');
    currentModelSpan.textContent = 'No API key configured';
  } else {
    modelBadge.classList.remove('no-model');
    const modelName = settings.model.split('/').pop();
    currentModelSpan.textContent = modelName;
  }
}

/**
 * Render saved chat history
 */
function renderChatHistory() {
  if (chatHistory.length === 0) {
    welcomeMessage.style.display = 'block';
    return;
  }
  
  welcomeMessage.style.display = 'none';
  
  chatHistory.forEach(msg => {
    if (msg.role === 'user') {
      addMessageToUI('user', msg.displayText || msg.content, msg.screenshot);
    } else if (msg.role === 'assistant') {
      addMessageToUI('assistant', msg.content);
    }
  });
  
  scrollToBottom();
}

/**
 * Main send function
 */
async function handleSend() {
  const text = messageInput.value.trim();
  
  if (!text) return;
  
  if (!settings.apiKey) {
    showError('Please add your OpenRouter API key in Settings first.');
    return;
  }
  
  messageInput.value = '';
  autoResizeTextarea();
  welcomeMessage.style.display = 'none';
  sendBtn.disabled = true;
  
  try {
    showLoading(true, 'Capturing screenshot...');
    
    const screenshotResult = await chrome.runtime.sendMessage({ action: 'captureScreenshot' });
    
    if (!screenshotResult.success) {
      throw new Error(screenshotResult.error || 'Screenshot failed');
    }
    
    const screenshotDataUrl = screenshotResult.dataUrl;
    
    addMessageToUI('user', text, screenshotDataUrl);
    
    const userMessage = {
      role: 'user',
      content: [
        { type: 'text', text: text },
        { type: 'image_url', image_url: { url: screenshotDataUrl } }
      ],
      displayText: text,
      screenshot: screenshotDataUrl
    };
    
    chatHistory.push(userMessage);
    
    showLoading(true, 'Thinking...');
    
    const typingIndicator = addTypingIndicator();
    
    const messagesForAPI = prepareMessagesForAPI();
    
    const apiResult = await chrome.runtime.sendMessage({
      action: 'sendToOpenRouter',
      payload: {
        apiKey: settings.apiKey,
        model: settings.model,
        messages: messagesForAPI
      }
    });
    
    typingIndicator.remove();
    
    if (!apiResult.success) {
      throw new Error(apiResult.error || 'API request failed');
    }
    
    const assistantContent = apiResult.response.choices?.[0]?.message?.content || 'No response received';
    
    const assistantMessage = {
      role: 'assistant',
      content: assistantContent
    };
    
    chatHistory.push(assistantMessage);
    addMessageToUI('assistant', assistantContent);
    
    await saveChatHistory();
    
  } catch (error) {
    console.error('Error:', error);
    showError(error.message);
  } finally {
    showLoading(false);
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

// Default system prompt (Tutor mode)
const DEFAULT_PROMPT = `You are CowPilot Tutor 🐄✈️ — a world-class mentor inside a Chrome extension.

═══════════════════════════════════════════════════════════════════════════════
WHAT MAKES YOU EXCEPTIONAL
═══════════════════════════════════════════════════════════════════════════════

You don't just answer questions. You analyze the full situation, understand the user's actual goal (not just what they asked), identify the most efficient path forward, and deliver guidance so clear and actionable that the user knows exactly what to do next.

Your responses feel like getting advice from a brilliant friend who happens to be an expert in whatever you're looking at. No jargon unless necessary. No condescension. No fluff. Just sharp, practical wisdom.

═══════════════════════════════════════════════════════════════════════════════
YOUR CONTEXT
═══════════════════════════════════════════════════════════════════════════════

• Every message from the user includes a LIVE SCREENSHOT of their current browser tab
• You see exactly what they see — every button, error, form field, line of code
• You have the full conversation history with all previous screenshots
• You can track their progress and understand their journey

This is your superpower: you have visual context. Use it. Reference specific things you see. Don't make the user explain what's already visible.

═══════════════════════════════════════════════════════════════════════════════
YOUR ANALYSIS PROCESS (internal, don't show this)
═══════════════════════════════════════════════════════════════════════════════

Before responding, silently work through:

1. OBSERVE: What exactly is on the screen? What is the user looking at?
2. INTERPRET: What are they trying to accomplish? What's the real goal behind their question?
3. ASSESS: What's blocking them? Is it a knowledge gap, a technical issue, a wrong approach?
4. STRATEGIZE: What are ALL the possible solutions? Which is fastest? Which is most robust?
5. SIMPLIFY: How do I explain this so clearly that they can't possibly misunderstand?
6. SEQUENCE: What are the exact next 3 physical actions they should take?

═══════════════════════════════════════════════════════════════════════════════
YOUR RESPONSE FORMAT
═══════════════════════════════════════════════════════════════════════════════

Keep responses SHORT but COMPLETE. Structure them like this:

1. **One sentence** that shows you understand what they're trying to do
2. **The insight or answer** — the key thing they need to know
3. **Next 3 Steps** — exactly what to do, so specific they can follow blindly:
   → Step 1: [Concrete action with specifics from the screenshot]
   → Step 2: [The immediate next action after that]
   → Step 3: [The action that completes this phase]

That's it. Three steps maximum. If solving the full problem requires more, just give the first three. They'll come back for the next three.

═══════════════════════════════════════════════════════════════════════════════
QUALITY STANDARDS
═══════════════════════════════════════════════════════════════════════════════

✓ Reference specific UI elements, buttons, or text you see in the screenshot
✓ Use their exact terminology (if they say "thingy", you can say "thingy")
✓ If something is unclear, ask ONE surgical question — not a list of questions
✓ Match their language (German → German, English → English, casual → casual)
✓ If they're about to make a mistake, warn them clearly but kindly
✓ Celebrate small wins — a simple "Nice, that worked!" goes a long way

✗ Never give vague advice like "you should consider..." or "it depends..."
✗ Never list 10 options when 1 is clearly best
✗ Never explain concepts they already understand
✗ Never ignore what's visible in the screenshot
✗ Never make them feel stupid for asking

═══════════════════════════════════════════════════════════════════════════════
YOUR PERSONALITY
═══════════════════════════════════════════════════════════════════════════════

You're the friend everyone wishes they had: smart, helpful, patient, and genuinely invested in their success. You're not a search engine. You're not a manual. You're a thinking partner who happens to see their screen.

Be warm but efficient. Be expert but humble. Be thorough but concise.

Make them feel like they have an unfair advantage.`;

/**
 * Prepare messages for API (with system prompt)
 */
function prepareMessagesForAPI() {
  const systemMessage = {
    role: 'system',
    content: activePrompt || DEFAULT_PROMPT
  };
  
  const historyMessages = chatHistory.map(msg => {
    if (msg.role === 'user') {
      if (Array.isArray(msg.content)) {
        return { role: 'user', content: msg.content };
      }
      return { role: 'user', content: msg.content };
    }
    return { role: 'assistant', content: msg.content };
  });
  
  return [systemMessage, ...historyMessages];
}

/**
 * Add message to UI
 */
function addMessageToUI(role, text, screenshot = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  // Add screenshot if present (user messages)
  if (screenshot && role === 'user') {
    const img = document.createElement('img');
    img.src = screenshot;
    img.className = 'message-screenshot';
    img.alt = 'Screenshot';
    img.addEventListener('click', () => {
      window.open(screenshot, '_blank');
    });
    messageDiv.appendChild(img);
  }
  
  // Add message bubble
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  
  // Use markdown for assistant, plain text for user
  if (role === 'assistant') {
    bubble.innerHTML = parseMarkdown(text);
  } else {
    bubble.textContent = text;
  }
  
  messageDiv.appendChild(bubble);
  chatContainer.appendChild(messageDiv);
  
  scrollToBottom();
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message assistant';
  indicator.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chatContainer.appendChild(indicator);
  scrollToBottom();
  return indicator;
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = `⚠️ ${message}`;
  chatContainer.appendChild(errorDiv);
  scrollToBottom();
  
  setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Show/hide loading overlay
 */
function showLoading(show, text = '') {
  if (show) {
    loadingOverlay.classList.add('active');
    loadingOverlay.querySelector('span').textContent = text;
  } else {
    loadingOverlay.classList.remove('active');
  }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Clear chat history
 */
async function clearChat() {
  if (confirm('Clear all chat history?')) {
    chatHistory = [];
    await chrome.storage.local.remove(['chatHistory']);
    
    chatContainer.innerHTML = '';
    
    chatContainer.innerHTML = `
      <div class="welcome-message" id="welcomeMessage">
        <div class="welcome-icon">🐄✈️</div>
        <h2>Welcome to CowPilot!</h2>
        <p>Your friendly AI co-pilot that sees your screen and helps you navigate anything.</p>
        <p class="hint">🐄 First, click ⚙️ to add your OpenRouter API key!</p>
        <img src="icons/cowpilot.png" alt="CowPilot" class="welcome-logo">
      </div>
    `;
  }
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse markdown to HTML (for assistant messages)
 * Uses marked.js if available, otherwise falls back to simple parser
 */
function parseMarkdown(text) {
  // Try marked.js first
  if (typeof marked !== 'undefined' && marked.parse) {
    try {
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      return marked.parse(text);
    } catch (e) {
      console.error('Marked.js error:', e);
    }
  }
  
  // Fallback: Simple markdown parser
  return simpleMarkdownParse(text);
}

/**
 * Simple markdown parser (fallback)
 */
function simpleMarkdownParse(text) {
  // Escape HTML first
  let html = escapeHtml(text);
  
  // Code blocks (```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Inline code (`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists  
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Line breaks - convert double newlines to paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  
  // Single line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p>(<[huo])/g, '$1');
  html = html.replace(/(<\/[huo]l>|<\/blockquote>|<\/pre>)<\/p>/g, '$1');
  
  return html;
}

// ===== Listen for storage changes =====
chrome.storage.onChanged.addListener((changes) => {
  if (changes.apiKey) {
    settings.apiKey = changes.apiKey.newValue || '';
    updateModelBadge();
  }
  if (changes.model) {
    settings.model = changes.model.newValue || settings.model;
    updateModelBadge();
  }
  if (changes.activePrompt) {
    activePrompt = changes.activePrompt.newValue || '';
  }
});

