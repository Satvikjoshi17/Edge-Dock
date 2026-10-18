# ⚡ EdgeDock // J.A.R.V.I.S. HUD

> A Stark Industries inspired holographic desktop quick-launcher & tactical productivity toolbox built with Electron.

![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?style=flat-square&logo=electron)
![License](https://img.shields.io/badge/License-MIT-00f0ff?style=flat-square)

EdgeDock transforms your desktop into an authentic, ultra-responsive **J.A.R.V.I.S. HUD** (Heads-Up Display). It combines non-intrusive edge-docked application launching with an interactive media acquisition engine, background data buffer (clipboard manager), and instant tactical memory scratchpad.

---

## 🦾 J.A.R.V.I.S. HUD Experience

- **⚡ Spinning Arc Reactor Core**: Animated, concentric spinning Arc Reactor in the HUD header with real-time status pulses and Stark telemetry readouts.
- **🏷️ Distinct App Labels & Monogram Badges**: Every pinned tool displays a high-visibility designation label and monogram badge (`CMD`, `TERM`, `CODE`, `WEB`, `DIR`), instantly distinguishing tools with identical system icons (e.g. Command Prompt vs. Windows Terminal).
- **🛡️ 100% Zero-Glitch Mouse Forwarding**: Fixed stable window dimensions paired with Electron's `setIgnoreMouseEvents` forwarder. Zero window jumping, zero flicker, and seamless click-through on transparent desktop areas.
- **🔊 Synthesized Tactical Audio**: Lightweight, zero-latency Web Audio sound blips and engagement chimes on hover and interactions.
- **🌈 Reactor Core Palettes**: Reconfigure your HUD with 5 Stark themes: **Arc Reactor Cyan**, **Stark Gold / Amber**, **Mark LXXXV Crimson**, **Vibranium Green**, and **Quantum Violet**.

---

## 🧰 Built-In Power Tools

### 1. 🎬 Media Acquisition Protocol (YouTube & Web Video)
- **Interactive Search Scanner**: Type any video title or topic (e.g. `Iron Man soundtrack`), scan live streams, and preview results with **16:9 thumbnails, channel names, and duration badges**.
- **1-Click Download**: Choose the exact video you want, select format (**MP4 1080p** or **MP3 320k**), and download with real-time progress, speed (MiB/s), and ETA readouts.
- **Direct Link Support**: Paste direct YouTube / video URLs for instant stream extraction.
- **Automated Engine Synchronizer**: 1-click automatic `yt-dlp` core installer if missing.

### 2. 📋 Data Buffer (Clipboard History)
- **Passive Memory Capture**: Automatically logs copied text, tokens, links, and code snippets in the background.
- **Instant Query Scanner**: Filter and search clips in real time.
- **1-Click Buffer Load**: Click any card to load it directly to your active Windows clipboard.

### 3. 📝 Tactical Scratchpad
- **Zero-Latency Memory Buffer**: Ephemeral notes, API keys, JSON payloads, or curl commands right on your screen edge.
- **Real-Time Auto-Save**: Seamlessly persisted across restarts and reboots.
- **Telemetry Counter**: Live character and word counters.

---

## ⌨️ Controls & Shortcuts

| Action | Shortcut / Trigger |
| :--- | :--- |
| **Toggle J.A.R.V.I.S. HUD** | `Alt+Space` (Configurable in Preferences) or Tray Icon |
| **Media Downloader** | Click Cloud / Download icon on HUD rail |
| **Data Buffer (Clipboard)** | Click Clipboard icon on HUD rail |
| **Tactical Scratchpad** | Click Pencil icon on HUD rail |
| **Pin Protocol** | Drop file from Explorer onto rail or click `+` |
| **Reorder Pins** | Drag and drop tiles inside the rail |
| **Calibrate Pin** | Right-click any pinned tile (Launch, Reveal, Edit, Purge) |
| **HUD Configuration** | Click Gear icon in the footer |
| **Cloak / Standby** | Top `X` button, `Alt+Space`, or click outside (if auto-cloak enabled) |

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

3. **Start J.A.R.V.I.S.:**
   ```bash
   npm start
   ```

4. **Build Windows Installer / Portable Executable:**
   ```bash
   npm run dist
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
