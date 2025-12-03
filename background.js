/**
 * Background Service Worker for CowPilot
 * Handles screenshot capture, API communication, and side panel
 */

// ===== Open Side Panel when extension icon is clicked =====
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// ===== Message Handlers =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    captureCurrentTab()
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    // Wichtig: true zurückgeben für async response
    return true;
  }
  
  if (request.action === 'sendToOpenRouter') {
    sendToOpenRouter(request.payload)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true;
  }
});

/**
 * Capture Screenshot vom aktiven Tab
 * @returns {Promise<string>} Base64 Data URL des Screenshots
 */
async function captureCurrentTab() {
  try {
    // Aktiven Tab ermitteln
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('Kein aktiver Tab gefunden');
    }
    
    // Screenshot aufnehmen
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 85
    });
    
    return dataUrl;
  } catch (error) {
    console.error('Screenshot Fehler:', error);
    throw new Error(`Screenshot konnte nicht aufgenommen werden: ${error.message}`);
  }
}

/**
 * Sendet Anfrage an OpenRouter API
 * @param {Object} payload - API Request Payload
 * @returns {Promise<Object>} API Response
 */
async function sendToOpenRouter(payload) {
  const { apiKey, model, messages } = payload;
  
  if (!apiKey) {
    throw new Error('Kein API-Key konfiguriert. Bitte in den Einstellungen hinzufügen.');
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'chrome-extension://llmsight',
        'X-Title': 'CowPilot Chrome Extension'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 2048
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Fehler: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OpenRouter API Fehler:', error);
    throw error;
  }
}

