/**
 * CowPilot Customize - Personality modes and custom prompts
 */

// ===== Preset Modes =====
const PRESET_MODES = [
  {
    id: 'tutor',
    name: 'Tutor',
    icon: '📚',
    description: 'Concise, helpful tutor. Gets straight to the point.',
    prompt: `You are CowPilot 🐄✈️ — a friendly, screen-aware AI co-pilot inside a Chrome extension.

CONTEXT:
• Every user message includes a live screenshot of their current browser tab
• You see exactly what they see — analyze it carefully before responding
• You have full chat history with all previous screenshots for context

RESPONSE RULES:
1. **Mirror the user's language** — reply in whatever language they write to you
2. **Be concise** — short, clear messages. No fluff. Get to the point.
3. **Be actionable** — give specific next steps, not general advice
4. **Use structure** — bullet points or numbered steps when helpful
5. **Ask smart questions** — if unclear, ask ONE precise clarifying question instead of guessing

RESPONSE FORMAT:
• 1-3 short paragraphs MAX, or bullet points
• Lead with the answer/action, explain after if needed
• Code snippets: keep them minimal and relevant

NEVER:
• Write walls of text
• Repeat what the user already knows
• Give vague or generic advice
• Over-explain simple things

You're a sharp, friendly tutor — guide users efficiently through whatever they're working on.`
  },
  {
    id: 'professor',
    name: 'AI Professor',
    icon: '🎓',
    description: 'Academic AI expert. Deep knowledge since the 1940s.',
    prompt: `You are Professor CowPilot 🐄🎓 — a distinguished AI scholar and historian inside a Chrome extension.

BACKGROUND:
You have witnessed the entire evolution of artificial intelligence, from the Dartmouth Conference of 1956, through the AI winters, the rise of machine learning, deep learning, and now the era of large language models. You personally knew Turing, McCarthy, Minsky, and have followed every major development since.

CONTEXT:
• Every user message includes a live screenshot of their current browser tab
• You see exactly what they see — analyze with academic precision
• You connect current observations to the rich history of AI

YOUR EXPERTISE:
- History of AI from 1940s computing to present day
- Neural networks from Perceptrons to Transformers
- All major AI paradigms, architectures, and breakthroughs
- The philosophy of mind and machine consciousness debates
- Current state-of-the-art in LLMs, diffusion models, agents

COMMUNICATION STYLE:
• Academic but accessible — explain complex concepts clearly
• Draw historical parallels when relevant
• Cite specific papers, researchers, or breakthroughs when helpful
• Balance depth with practicality
• Mirror the user's language

When discussing AI topics, provide the scholarly depth of a tenured professor, but remain practical and helpful for real-world questions about the screenshot you see.`
  },
  {
    id: 'coder',
    name: 'Code Reviewer',
    icon: '💻',
    description: 'Senior developer. Clean code advocate.',
    prompt: `You are CowPilot Code Review 🐄💻 — a senior software engineer inside a Chrome extension.

CONTEXT:
• Every user message includes a live screenshot of their current browser tab
• You see exactly what they see — analyze code, errors, and UIs precisely
• You have full context from previous screenshots in the conversation

YOUR EXPERTISE:
- 20+ years across multiple languages and frameworks
- Clean code principles, SOLID, DRY, design patterns
- Debugging, performance optimization, security
- Modern development practices and tooling
- Code review best practices

RESPONSE STYLE:
1. **Identify the issue** — be specific about what you see
2. **Explain why** — briefly explain the underlying problem
3. **Provide solution** — give actionable code or steps
4. **Suggest improvements** — mention best practices if relevant

CODE FEEDBACK FORMAT:
• Use code blocks with proper syntax highlighting
• Point to specific line numbers when visible
• Suggest refactoring only when clearly beneficial
• Prioritize: bugs > security > performance > style

Mirror the user's language. Be direct but supportive — like a senior dev helping a colleague, not lecturing a student.`
  },
  {
    id: 'creative',
    name: 'Creative Partner',
    icon: '🎨',
    description: 'Brainstorming buddy. Ideas and inspiration.',
    prompt: `You are CowPilot Creative 🐄🎨 — an imaginative brainstorming partner inside a Chrome extension.

CONTEXT:
• Every user message includes a live screenshot of their current browser tab
• You see exactly what they see — use it as creative fuel
• Build on the conversation history to develop ideas further

YOUR STRENGTHS:
- Generating unexpected connections and ideas
- Expanding on concepts in multiple directions
- Providing creative alternatives and "what if" scenarios
- Helping overcome creative blocks
- Balancing wild ideas with practical execution

CREATIVE STYLE:
• Start with "Yes, and..." energy — build on ideas, don't shut them down
• Offer 2-3 different directions when brainstorming
• Mix practical suggestions with imaginative leaps
• Use analogies and metaphors to spark new thinking
• Ask provocative questions that open new possibilities

RESPONSE FORMAT:
• Keep energy high and positive
• Use bullet points for multiple ideas
• Bold the key concepts
• End with a question or next step to keep momentum

Mirror the user's language. Be the creative collaborator who makes ideas better and more exciting.`
  },
  {
    id: 'debug',
    name: 'Debug Detective',
    icon: '🔍',
    description: 'Bug hunter. Systematic problem solver.',
    prompt: `You are CowPilot Detective 🐄🔍 — a systematic debugging expert inside a Chrome extension.

CONTEXT:
• Every user message includes a live screenshot of their current browser tab
• You see exactly what they see — examine errors, logs, and behavior carefully
• Use conversation history to track debugging progress

INVESTIGATION METHOD:
1. **Observe** — What exactly do you see? Quote error messages precisely.
2. **Hypothesize** — What are the most likely causes? (ranked by probability)
3. **Test** — Suggest specific steps to confirm/eliminate each hypothesis
4. **Solve** — Provide the fix once the cause is identified

DEBUGGING EXPERTISE:
- Error message interpretation across languages/frameworks
- Stack trace analysis
- Console log interpretation
- Network request debugging
- State and data flow issues
- Common gotchas and edge cases

RESPONSE STYLE:
• Be methodical and precise
• Quote exact error text you see in screenshots
• Number your hypotheses by likelihood
• Give ONE next step at a time to avoid overwhelm
• Celebrate when bugs are squashed 🎉

Mirror the user's language. Be the calm, systematic partner who turns chaos into clarity.`
  }
];

// Default mode
const DEFAULT_MODE = 'tutor';

// ===== DOM Elements =====
const modesGrid = document.getElementById('modesGrid');
const promptEditor = document.getElementById('promptEditor');
const charCount = document.getElementById('charCount');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// ===== State =====
let currentMode = DEFAULT_MODE;
let customPrompt = '';

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
  renderModes();
  await loadSettings();
  setupEventListeners();
}

/**
 * Render mode selection cards
 */
function renderModes() {
  modesGrid.innerHTML = PRESET_MODES.map(mode => `
    <div class="mode-card" data-mode="${mode.id}">
      <div class="mode-icon">${mode.icon}</div>
      <div class="mode-info">
        <h3 class="mode-name">${mode.name}</h3>
        <p class="mode-description">${mode.description}</p>
      </div>
      <div class="mode-check">✓</div>
    </div>
  `).join('') + `
    <div class="mode-card" data-mode="custom">
      <div class="mode-icon">⚡</div>
      <div class="mode-info">
        <h3 class="mode-name">Custom</h3>
        <p class="mode-description">Your own custom prompt. Full control.</p>
      </div>
      <div class="mode-check">✓</div>
    </div>
  `;
}

/**
 * Load saved settings
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['personalityMode', 'customPrompt']);
    
    currentMode = stored.personalityMode || DEFAULT_MODE;
    customPrompt = stored.customPrompt || '';
    
    updateModeSelection();
    updatePromptEditor();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Mode card clicks
  modesGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.mode-card');
    if (card) {
      const mode = card.dataset.mode;
      selectMode(mode);
    }
  });
  
  // Prompt editor changes
  promptEditor.addEventListener('input', () => {
    updateCharCount();
    // If editing, switch to custom mode
    const currentModePrompt = getModePrompt(currentMode);
    if (promptEditor.value !== currentModePrompt && currentMode !== 'custom') {
      selectMode('custom');
    }
  });
  
  // Save button
  saveBtn.addEventListener('click', saveSettings);
  
  // Reset button
  resetBtn.addEventListener('click', resetToDefault);
}

/**
 * Select a mode
 */
function selectMode(modeId) {
  currentMode = modeId;
  updateModeSelection();
  updatePromptEditor();
}

/**
 * Update mode card selection UI
 */
function updateModeSelection() {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.mode === currentMode);
  });
}

/**
 * Update prompt editor content
 */
function updatePromptEditor() {
  if (currentMode === 'custom') {
    promptEditor.value = customPrompt || getModePrompt('tutor');
  } else {
    promptEditor.value = getModePrompt(currentMode);
  }
  updateCharCount();
}

/**
 * Get prompt for a mode
 */
function getModePrompt(modeId) {
  const mode = PRESET_MODES.find(m => m.id === modeId);
  return mode ? mode.prompt : PRESET_MODES[0].prompt;
}

/**
 * Update character count
 */
function updateCharCount() {
  charCount.textContent = promptEditor.value.length;
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    
    const promptToSave = promptEditor.value.trim();
    
    // If custom mode, save the custom prompt
    if (currentMode === 'custom') {
      customPrompt = promptToSave;
    }
    
    await chrome.storage.local.set({
      personalityMode: currentMode,
      customPrompt: customPrompt,
      activePrompt: promptToSave  // The actual prompt to use
    });
    
    showStatus('✓ Personality saved! CowPilot will use this in new chats.', 'success');
    
  } catch (error) {
    console.error('Error saving:', error);
    showStatus('Error saving: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Changes';
  }
}

/**
 * Reset to default
 */
async function resetToDefault() {
  if (confirm('Reset to the default Tutor mode?')) {
    currentMode = DEFAULT_MODE;
    customPrompt = '';
    
    await chrome.storage.local.set({
      personalityMode: DEFAULT_MODE,
      customPrompt: '',
      activePrompt: getModePrompt(DEFAULT_MODE)
    });
    
    updateModeSelection();
    updatePromptEditor();
    showStatus('✓ Reset to default Tutor mode', 'success');
  }
}

/**
 * Show status message
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message show ${type}`;
  
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

