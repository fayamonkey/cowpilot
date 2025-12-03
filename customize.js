/**
 * CowPilot Customize - Personality modes and custom prompts
 * Now with i18n support!
 */

// Default mode
const DEFAULT_MODE = 'tutor';

// ===== DOM Elements =====
const modesGrid = document.getElementById('modesGrid');
const promptEditor = document.getElementById('promptEditor');
const charCount = document.getElementById('charCount');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const toggleLanguageBtn = document.getElementById('toggleLanguage');

// ===== State =====
let currentMode = DEFAULT_MODE;
let customPrompt = '';

// ===== Translations for Customize Page =====
const CUSTOMIZE_TRANSLATIONS = {
  en: {
    customize: 'Customize',
    personalityModes: 'Personality Modes',
    personalityDesc: 'Choose a preset personality or create your own custom prompt',
    systemPrompt: 'System Prompt',
    systemPromptDesc: 'This is what CowPilot knows about itself. Edit to customize its behavior.',
    characters: 'characters',
    resetDefault: 'Reset to Default',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    savedSuccess: '✓ Personality saved! CowPilot will use this in new chats.',
    resetSuccess: '✓ Reset to default Tutor mode',
    resetConfirm: 'Reset to the default Tutor mode?',
    tipsTitle: 'Prompt Tips:',
    tip1: 'Be specific about the personality and tone you want',
    tip2: 'Include context about screenshots being sent with each message',
    tip3: 'Define response format (bullet points, paragraphs, etc.)',
    tip4: 'Set language preferences if needed'
  },
  de: {
    customize: 'Anpassen',
    personalityModes: 'Persönlichkeitsmodi',
    personalityDesc: 'Wähle eine Preset-Persönlichkeit oder erstelle deinen eigenen Prompt',
    systemPrompt: 'System-Prompt',
    systemPromptDesc: 'Das ist, was CowPilot über sich selbst weiß. Bearbeite es, um das Verhalten anzupassen.',
    characters: 'Zeichen',
    resetDefault: 'Zurücksetzen',
    saveChanges: 'Speichern',
    saving: 'Speichere...',
    savedSuccess: '✓ Persönlichkeit gespeichert! CowPilot nutzt das in neuen Chats.',
    resetSuccess: '✓ Auf Standard-Tutor zurückgesetzt',
    resetConfirm: 'Auf den Standard-Tutor-Modus zurücksetzen?',
    tipsTitle: 'Prompt-Tipps:',
    tip1: 'Sei spezifisch über die gewünschte Persönlichkeit und den Ton',
    tip2: 'Erwähne, dass Screenshots mit jeder Nachricht gesendet werden',
    tip3: 'Definiere das Antwortformat (Aufzählungen, Absätze, etc.)',
    tip4: 'Lege Sprachpräferenzen fest, falls nötig'
  }
};

/**
 * Get customize translation
 */
function ct(key) {
  const lang = getCurrentLanguage();
  return CUSTOMIZE_TRANSLATIONS[lang]?.[key] || CUSTOMIZE_TRANSLATIONS.en[key] || key;
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadLanguage();
  await loadSettings();
  renderModes();
  setupEventListeners();
  applyTranslations();
}

/**
 * Apply translations to UI
 */
function applyTranslations() {
  const lang = getCurrentLanguage();
  
  document.getElementById('tagline').textContent = t('tagline');
  document.getElementById('headerSubtitle').textContent = ct('customize');
  document.getElementById('sectionTitleModes').textContent = ct('personalityModes');
  document.getElementById('sectionDescModes').textContent = ct('personalityDesc');
  document.getElementById('sectionTitlePrompt').textContent = ct('systemPrompt');
  document.getElementById('sectionDescPrompt').textContent = ct('systemPromptDesc');
  document.getElementById('charLabel').textContent = ct('characters');
  document.getElementById('resetLabel').textContent = ct('resetDefault');
  document.getElementById('saveLabel').textContent = ct('saveChanges');
  
  // Tips
  document.getElementById('tipsContent').innerHTML = `
    <strong>${ct('tipsTitle')}</strong>
    <ul>
      <li>${ct('tip1')}</li>
      <li>${ct('tip2')}</li>
      <li>${ct('tip3')}</li>
      <li>${ct('tip4')}</li>
    </ul>
  `;
  
  // Re-render modes with translated text
  renderModes();
}

/**
 * Get mode info for current language
 */
function getModeInfo() {
  const lang = getCurrentLanguage();
  
  const modes = [
    {
      id: 'tutor',
      icon: '📚',
      name: { en: 'Tutor', de: 'Tutor' },
      description: { 
        en: 'Precise guidance. Three actionable steps at a time.',
        de: 'Präzise Anleitung. Drei konkrete Schritte auf einmal.'
      }
    },
    {
      id: 'professor',
      icon: '🎓',
      name: { en: 'AI Professor', de: 'KI-Professor' },
      description: {
        en: 'Deep AI expertise. Historical context. Academic rigor.',
        de: 'Tiefes KI-Wissen. Historischer Kontext. Akademische Tiefe.'
      }
    },
    {
      id: 'coder',
      icon: '💻',
      name: { en: 'Code Reviewer', de: 'Code-Reviewer' },
      description: {
        en: 'Senior engineer. Clean code. Best practices.',
        de: 'Senior-Entwickler. Sauberer Code. Best Practices.'
      }
    },
    {
      id: 'creative',
      icon: '🎨',
      name: { en: 'Creative Partner', de: 'Kreativ-Partner' },
      description: {
        en: 'Brainstorming ally. Ideas and possibilities.',
        de: 'Brainstorming-Partner. Ideen und Möglichkeiten.'
      }
    },
    {
      id: 'debug',
      icon: '🔍',
      name: { en: 'Debug Detective', de: 'Debug-Detektiv' },
      description: {
        en: 'Systematic troubleshooter. Finds the root cause.',
        de: 'Systematische Fehlersuche. Findet die Ursache.'
      }
    }
  ];
  
  return modes.map(m => ({
    id: m.id,
    icon: m.icon,
    name: m.name[lang] || m.name.en,
    description: m.description[lang] || m.description.en
  }));
}

/**
 * Render mode selection cards
 */
function renderModes() {
  const modes = getModeInfo();
  const lang = getCurrentLanguage();
  const customName = lang === 'de' ? 'Eigener Prompt' : 'Custom';
  const customDesc = lang === 'de' ? 'Dein eigener Prompt. Volle Kontrolle.' : 'Your own custom prompt. Full control.';
  
  modesGrid.innerHTML = modes.map(mode => `
    <div class="mode-card ${currentMode === mode.id ? 'selected' : ''}" data-mode="${mode.id}">
      <div class="mode-icon">${mode.icon}</div>
      <div class="mode-info">
        <h3 class="mode-name">${mode.name}</h3>
        <p class="mode-description">${mode.description}</p>
      </div>
      <div class="mode-check">✓</div>
    </div>
  `).join('') + `
    <div class="mode-card ${currentMode === 'custom' ? 'selected' : ''}" data-mode="custom">
      <div class="mode-icon">⚡</div>
      <div class="mode-info">
        <h3 class="mode-name">${customName}</h3>
        <p class="mode-description">${customDesc}</p>
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
  
  // Language toggle
  toggleLanguageBtn.addEventListener('click', handleLanguageToggle);
}

/**
 * Handle language toggle
 */
async function handleLanguageToggle() {
  const newLang = await toggleLanguage();
  applyTranslations();
  updatePromptEditor(); // Update prompt to match new language
  
  // Show feedback
  const feedback = newLang === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English';
  toggleLanguageBtn.textContent = feedback;
  setTimeout(() => {
    toggleLanguageBtn.textContent = '🌐';
  }, 1500);
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
 * Get prompt for a mode (uses i18n.js)
 */
function getModePrompt(modeId) {
  const lang = getCurrentLanguage();
  return getPromptForMode(modeId, lang);
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
    saveBtn.innerHTML = `<span class="btn-icon">⏳</span> ${ct('saving')}`;
    
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
    
    showStatus(ct('savedSuccess'), 'success');
    
  } catch (error) {
    console.error('Error saving:', error);
    showStatus('Error: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<span class="btn-icon">💾</span> ${ct('saveChanges')}`;
  }
}

/**
 * Reset to default
 */
async function resetToDefault() {
  if (confirm(ct('resetConfirm'))) {
    currentMode = DEFAULT_MODE;
    customPrompt = '';
    
    await chrome.storage.local.set({
      personalityMode: DEFAULT_MODE,
      customPrompt: '',
      activePrompt: getModePrompt(DEFAULT_MODE)
    });
    
    updateModeSelection();
    updatePromptEditor();
    renderModes();
    showStatus(ct('resetSuccess'), 'success');
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
