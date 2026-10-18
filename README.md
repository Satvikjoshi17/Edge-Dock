# ⚡ EdgeDock

> A sleek, neo-glass native desktop overlay quick-launcher built with Electron.

![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/License-MIT-00f2fe?style=flat-square)

EdgeDock is a non-intrusive, ultra-fast sidebar launcher that docks neatly to the edge of your screen. It enables one-click launching of desktop applications, shell utilities, and web URLs, featuring native Windows file icon extraction, drag-and-drop auto-pinning, and fluid neo-glass cyberpunk aesthetics.

---

## ✨ Features

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
| **Pin Item** | Drop file from Explorer onto dock or click `+` |
| **Reorder Pins** | Drag and drop tiles inside the rail |
| **Context Menu** | Right-click any pinned tile |
| **Preferences** | Click Gear icon in the dock footer |
| **Hide Dock** | Top `X` button, `Alt+Space`, or click outside (if auto-hide enabled) |

---

## 🛠️ Tech Stack

- **Runtime**: Electron 31
- **Packaging**: `electron-builder` (NSIS & Portable target)
- **Storage**: `electron-store`
- **UI Architecture**: Vanilla HTML5, Neo-Glass CSS, Modular JavaScript
- **System APIs**: Electron ContextBridge, NativeImage, IPCMain / IPCRenderer, Screen Metrics

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
