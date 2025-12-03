/**
 * CowPilot Settings - Settings page logic
 * Manages API key and model selection with live data from OpenRouter
 */

// ===== DOM Elements =====
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyBtn = document.getElementById('toggleApiKey');
const modelSelect = document.getElementById('modelSelect');
const saveBtn = document.getElementById('saveBtn');
const statusMessage = document.getElementById('statusMessage');
const loadModelsBtn = document.getElementById('loadModelsBtn');
const modelsLoading = document.getElementById('modelsLoading');

// ===== State =====
let allModels = [];

// ===== Init =====
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  setupEventListeners();
  // Auto-load models if we have an API key
  if (apiKeyInput.value) {
    loadModelsFromAPI();
  }
}

/**
 * Load saved settings
 */
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['apiKey', 'model']);
    
    if (stored.apiKey) {
      apiKeyInput.value = stored.apiKey;
    }
    
    if (stored.model) {
      // Store the saved model to select it after loading models
      modelSelect.dataset.savedModel = stored.model;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  toggleApiKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleApiKeyBtn.textContent = isPassword ? '🙈' : '👁️';
  });
  
  saveBtn.addEventListener('click', saveSettings);
  
  apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
  
  // Load models button
  if (loadModelsBtn) {
    loadModelsBtn.addEventListener('click', loadModelsFromAPI);
  }
  
  // Auto-load models when API key is entered
  apiKeyInput.addEventListener('blur', () => {
    if (apiKeyInput.value && allModels.length === 0) {
      loadModelsFromAPI();
    }
  });
}

/**
 * Fetch models from OpenRouter API
 */
async function loadModelsFromAPI() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Enter API key first to load models', 'error');
    return;
  }
  
  try {
    // Show loading state
    if (modelsLoading) modelsLoading.style.display = 'flex';
    if (loadModelsBtn) loadModelsBtn.disabled = true;
    modelSelect.disabled = true;
    
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    allModels = data.data || [];
    
    // Filter for vision/multimodal models and sort by name
    const visionModels = allModels
      .filter(m => isVisionModel(m))
      .sort((a, b) => a.id.localeCompare(b.id));
    
    populateModelSelect(visionModels);
    showStatus(`✓ Loaded ${visionModels.length} vision models`, 'success');
    
  } catch (error) {
    console.error('Error loading models:', error);
    showStatus('Error loading models: ' + error.message, 'error');
  } finally {
    if (modelsLoading) modelsLoading.style.display = 'none';
    if (loadModelsBtn) loadModelsBtn.disabled = false;
    modelSelect.disabled = false;
  }
}

/**
 * Check if model supports vision/images
 */
function isVisionModel(model) {
  // Check model capabilities or known vision model patterns
  const id = model.id.toLowerCase();
  const desc = (model.description || '').toLowerCase();
  
  // Known vision model patterns
  const visionPatterns = [
    'gpt-4o', 'gpt-4-turbo', 'gpt-4-vision', 'gpt-5',
    'claude-3', 'claude-sonnet', 'claude-opus', 'claude-haiku',
    'gemini', 'gemini-pro', 'gemini-flash', 'gemini-2',
    'llama-3.2', 'llama-3.3', 'vision',
    'pixtral', 'qwen2-vl', 'qwen2.5-vl', 'qwen-vl',
    'internvl', 'cogvlm', 'yi-vision', 'deepseek-vl'
  ];
  
  // Check if model matches any vision pattern
  const matchesPattern = visionPatterns.some(p => id.includes(p));
  
  // Also check description for image/vision mentions
  const hasVisionDesc = desc.includes('vision') || 
                        desc.includes('image') || 
                        desc.includes('multimodal') ||
                        desc.includes('visual');
  
  // Check modality if available
  const hasImageModality = model.architecture?.modality?.includes('image') ||
                           model.architecture?.input_modalities?.includes('image');
  
  return matchesPattern || hasVisionDesc || hasImageModality;
}

/**
 * Format price for display
 */
function formatPrice(pricePerToken) {
  if (!pricePerToken || pricePerToken === 0) return 'Free';
  
  // Convert to price per million tokens
  const pricePerMillion = parseFloat(pricePerToken) * 1000000;
  
  if (pricePerMillion < 0.01) {
    return '<$0.01/M';
  } else if (pricePerMillion < 1) {
    return `$${pricePerMillion.toFixed(2)}/M`;
  } else {
    return `$${pricePerMillion.toFixed(2)}/M`;
  }
}

/**
 * Populate model select with fetched models
 */
function populateModelSelect(models) {
  const savedModel = modelSelect.dataset.savedModel;
  
  // Group models by provider
  const grouped = {};
  
  models.forEach(model => {
    const provider = model.id.split('/')[0] || 'Other';
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    if (!grouped[providerName]) {
      grouped[providerName] = [];
    }
    
    grouped[providerName].push(model);
  });
  
  // Clear and rebuild select
  modelSelect.innerHTML = '';
  
  // Sort providers alphabetically, but put popular ones first
  const priorityProviders = ['Openai', 'Anthropic', 'Google', 'Meta-llama'];
  const sortedProviders = Object.keys(grouped).sort((a, b) => {
    const aIndex = priorityProviders.indexOf(a);
    const bIndex = priorityProviders.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  
  sortedProviders.forEach(provider => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = provider;
    
    // Sort models within provider by name
    grouped[provider].sort((a, b) => {
      // Prioritize newer/better models
      const aName = a.id.toLowerCase();
      const bName = b.id.toLowerCase();
      return aName.localeCompare(bName);
    });
    
    grouped[provider].forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      
      // Format: Model Name ($X.XX/M input | $X.XX/M output)
      const modelName = model.id.split('/')[1] || model.id;
      const inputPrice = formatPrice(model.pricing?.prompt);
      const outputPrice = formatPrice(model.pricing?.completion);
      
      option.textContent = `${modelName} (${inputPrice} in | ${outputPrice} out)`;
      
      // Select saved model
      if (model.id === savedModel) {
        option.selected = true;
      }
      
      optgroup.appendChild(option);
    });
    
    modelSelect.appendChild(optgroup);
  });
  
  // If no saved model was selected, select first option
  if (!savedModel && modelSelect.options.length > 0) {
    modelSelect.selectedIndex = 0;
  }
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    apiKeyInput.focus();
    return;
  }
  
  if (!apiKey.startsWith('sk-or-') && !apiKey.startsWith('sk-')) {
    showStatus('API key should start with "sk-or-" or "sk-"', 'error');
    return;
  }
  
  if (!model) {
    showStatus('Please select a model', 'error');
    return;
  }
  
  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    
    await chrome.storage.local.set({
      apiKey: apiKey,
      model: model
    });
    
    showStatus('✓ Settings saved successfully!', 'success');
    
  } catch (error) {
    console.error('Error saving:', error);
    showStatus('Error saving: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="btn-icon">💾</span> Save Settings';
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
