# ⚡ EdgeDock

> A sleek, neo-glass native desktop overlay quick-launcher & power productivity toolbox built with Electron.

![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/License-MIT-00f2fe?style=flat-square)

EdgeDock is a non-intrusive, ultra-fast sidebar launcher and productivity toolbox that docks neatly to the edge of your screen. In addition to one-click launching of desktop applications, shell utilities, and web URLs, it features built-in **Power Tools** including a YouTube/media downloader, clipboard history manager, and auto-saving scratchpad.

---

## 🧰 Built-In Power Tools

### 1. 🎬 Media & YouTube Downloader
- **Link & Search Support**: Paste any YouTube / web video link, or simply type a song / video title to search and download.
- **Multiple Formats**: One-click download as **MP4 Video** (highest resolution) or **MP3 Audio** (320kbps).
- **Self-Healing Engine**: Automatically checks for `yt-dlp` and provides a 1-click automatic setup helper that installs the official engine into user app data.
- **Live Progress**: Real-time download percentage, download speed (MiB/s), and estimated time remaining (ETA).
- **Quick Access**: Dedicated button to open the Downloads folder directly.

### 2. 📋 Clipboard History Manager
- **Background Clip Capture**: Automatically monitors and records copied text, URLs, and code snippets.
- **Search & Filter**: Real-time instant search across your clipboard history.
- **1-Click Copy**: Click any clip card to instantly copy it back to your active clipboard.
- **Clean Management**: Clear history anytime with one click.

### 3. 📝 Quick Scratchpad
- **Zero-Latency Notes**: An instant flyout scratchpad for temporary tokens, commands, scratch code, and quick ideas.
- **Instant Auto-Save**: Seamlessly persists across reboots and app launches with debounced background storage.
- **Word & Character Counters**: Live stats on your active note.
- **Fast Actions**: Quick "Copy All" and "Clear" buttons.

---

## ✨ Core Features

- **🛡️ Secure Native Execution**: Direct application execution and URL routing through Electron's native shell APIs—protecting against command injection.
- **🎨 Native Icon Extraction**: Automatically extracts high-resolution native icons from Windows `.exe`, `.lnk`, and system files using `app.getFileIcon()`. Web URLs fetch real favicons automatically.
- **🌈 Custom Theme Accents**: Choose between 5 cyberpunk neon themes (Cyan Glow, Synthwave Violet, Cyber Yellow, Matrix Emerald, Pulse Crimson).
- **📐 Left / Right Docking**: Dock cleanly on either the Left or Right screen edge with immediate UI repositioning.
- **📂 Explorer Drag-and-Drop**: Drag applications or files straight from Windows File Explorer onto the dock to instantly pin them.
- **↕️ Interactive Tile Reordering**: Drag and drop tiles within the launcher stream to rearrange them effortlessly.
- **🖱️ Right-Click Context Menu**: Instant options to Launch, Reveal in File Explorer, Edit, or Remove pins.
- **🗂️ Native File Picker**: Browse and select any program with the native Windows file dialog—no manual path typing required.
- **🖥️ Multi-Monitor & Resolution Resilient**: Automatically recalculates work area bounds and docks securely during monitor connect/disconnect or resolution changes.
- **🔍 Smart Window Expansion**: Dynamically expands transparent viewport bounds on hover to render full-fidelity holographic tooltips and flyouts with zero viewport clipping.
- **📌 Pin vs. Auto-Hide Peek**: Toggle between a pinned dock and auto-hide with edge-hover slide-in.
- **⚙️ Preferences Drawer**: Manage docking position, auto-launch on startup, custom global hotkeys, and accent colors directly inside the app.
- **🔒 Single Instance Lock**: Ensures only one background process runs with complete system tray management.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Windows 10/11

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Satvikjoshi17/Edge-Dock.git
   cd Edge-Dock
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start in development:**
   ```bash
   npm start
   ```

4. **Build Windows Installer / Portable Executable:**
   ```bash
   npm run dist
   ```

---

## ⌨️ Controls & Shortcuts

| Action | Shortcut / Trigger |
| :--- | :--- |
| **Toggle Dock Visibility** | `Alt+Space` (Configurable in Preferences) or Tray Icon |
| **Media Downloader** | Click Cloud / Download icon on dock rail |
| **Clipboard History** | Click Clipboard icon on dock rail |
| **Scratchpad** | Click Pencil icon on dock rail |
| **Pin Item** | Drop file from Explorer onto dock or click `+` |
| **Reorder Pins** | Drag and drop tiles inside the rail |
| **Context Menu** | Right-click any pinned tile |
| **Preferences** | Click Gear icon in the dock footer |
| **Hide Dock** | Top `X` button, `Alt+Space`, or click outside (if auto-hide enabled) |

---

## 🛠️ Tech Stack

- **Runtime**: Electron 31
- **Packaging**: `electron-builder` (NSIS & Portable target)
- **Media Engine**: `yt-dlp` (auto-installed or system binary)
- **Storage**: `electron-store`
- **UI Architecture**: Vanilla HTML5, Neo-Glass CSS, Modular JavaScript
- **System APIs**: Electron ContextBridge, Clipboard, NativeImage, IPCMain / IPCRenderer, Screen Metrics

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
