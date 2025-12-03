# 🐄✈️ CowPilot - The Better Co-Pilot

A Chrome browser extension that sees your screen and actually helps. No fluff, just answers.

![CowPilot](logo.png)

## ✨ Why CowPilot?

Built because we needed something more reliable than existing AI copilots. CowPilot:
- **Sees your screen** — captures screenshots automatically with each message
- **Actually understands context** — maintains conversation history with all screenshots
- **Uses the best AI models** — choose from GPT-4o, Claude, Gemini, and more via OpenRouter
- **Stays out of your way** — clean sidebar that doesn't block your work

## 🚀 Features

- **📸 Automatic Screenshots** — Every message includes a screenshot of your current tab
- **🤖 Multi-Model Support** — Choose from 50+ vision AI models via OpenRouter
- **💬 Contextual Memory** — Full conversation history with screenshot context
- **💰 Live Pricing** — See real-time costs per model before you choose
- **🔒 Privacy First** — Everything stays in your browser, your API key stays private
- **📖 Open Source** — Free to use, modify, and contribute

## 📦 Installation

### 1. Download or Clone

```bash
git clone https://github.com/fayamonkey/cowpilot.git
```

Or download as ZIP and extract.

### 2. Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **"Load unpacked"**
4. Select the `cowpilot` folder

### 3. Get an API Key

1. Create an account at [OpenRouter.ai](https://openrouter.ai/)
2. Go to [API Keys](https://openrouter.ai/keys) and create a new key
3. Click the CowPilot icon in Chrome → ⚙️ Settings
4. Paste your API key and click "Load Models"
5. Select a vision model and save!

### 4. Generate Icons (Optional)

Open `generate-icons.html` in your browser to create custom cow-themed icons.

## 🎯 How to Use

1. **Navigate** to any website
2. **Click** the CowPilot icon in your toolbar
3. **Ask** anything about what you see
4. CowPilot **captures your screen** and sends it to the AI
5. Get **helpful, concise answers**!

### Example Questions:
- "What's wrong with this error message?"
- "How do I fill out this form?"
- "Can you explain what this code does?"
- "Help me navigate this UI"

## 🤖 Supported Models

CowPilot fetches models live from OpenRouter. Popular vision models include:

| Model | Provider | Best For |
|-------|----------|----------|
| GPT-4o | OpenAI | All-around great |
| GPT-4o Mini | OpenAI | Fast & cheap |
| Claude Sonnet 4 | Anthropic | Detailed analysis |
| Gemini 2.0 Flash | Google | Speed |
| Llama 3.2 Vision | Meta | Open source |

## 🔒 Privacy & Security

- **Local Storage Only** — All data stored in your browser
- **Your API Key** — Stored locally, only sent to OpenRouter
- **Screenshots** — Sent directly to your chosen AI model, not stored
- **No Tracking** — We don't collect any data

## 📁 Project Structure

```
cowpilot/
├── manifest.json       # Chrome extension config
├── sidepanel.html/css/js   # Main chat interface
├── settings.html/css/js    # Settings page
├── background.js       # Service worker
├── popup.html/css/js   # Legacy popup (not used)
├── generate-icons.html # Icon generator
├── icons/              # Extension icons
└── README.md           # This file
```

## 🛠️ Development

### Requirements
- Chrome/Chromium browser
- OpenRouter API key

### Local Development
1. Make changes to the files
2. Go to `chrome://extensions/`
3. Click the refresh icon on CowPilot
4. Test your changes

## 👨‍💻 Developer

**Dirk Wonhoefer**  
AI Engineering  
📧 [dirk@ai-engineering.ai](mailto:dirk@ai-engineering.ai)

## 📄 License

MIT License — feel free to use, modify, and distribute.

## ⭐ Support

If CowPilot helps you, consider:
- ⭐ Starring this repo
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🔀 Contributing code

---

## 🤝 The Story Behind CowPilot

This extension was built in a single collaborative session between **Dirk Wonhoefer** and **Claude (Anthropic's AI assistant)** using Cursor IDE.

What started as a simple idea — *"I need something more reliable than existing copilots"* — turned into a fully functional Chrome extension in just a few hours of pair programming.

**The journey:**
- Started with a basic popup chat
- Evolved to a sleek side panel that doesn't block your work
- Added live model fetching from OpenRouter with real pricing
- Implemented markdown rendering for beautiful responses
- Crafted the warm, friendly CowPilot branding 🐄✈️

This project is a testament to what's possible when human creativity meets AI assistance. Every feature, every design decision, every bug fix — done together in real-time conversation.

*"The better Co-Pilot"* isn't just a tagline — it's the philosophy of building tools that actually help, without getting in your way.

---

Made with 🐄💙 by AI Engineering & Claude
