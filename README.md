# ⚡ EdgeDock // J.A.R.V.I.S. Open-Air Hologram HUD

> An authentic Stark Industries open-air holographic desktop quick-launcher & tactical productivity toolbox built with Electron.

![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=flat-square&logo=windows)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?style=flat-square&logo=electron)
![HUD](https://img.shields.io/badge/Interface-J.A.R.V.I.S._Hologram-00f0ff?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-00f0ff?style=flat-square)

EdgeDock transforms your Windows desktop into an authentic **Iron Man floating open-air holographic HUD**. Pinned applications, media search tools, and tactical utilities float seamlessly in translucent cyan glass with holographic scanlines, laser-sharp caliper brackets, and an animated Arc Reactor core.

---

## 🦾 Holographic HUD Architecture

- **🌐 Translucent Open-Air Glass**: Floating glass overlay (`backdrop-filter: blur(22px)`) with subtle holographic scanlines and glowing laser edges.
- **⚡ Spinning Multi-Ring Arc Reactor**: Concentric, counter-rotating HUD rings in the header with a pulsing white-hot core and radial aura.
- **🏷️ Holographic Designation Labels**: Clean, glowing typography directly beneath each icon (`CMD`, `TERMINAL`, `VS CODE`, `GITHUB`) with high readability—no cluttered corner badges.
- **🛡️ 100% Zero-Flicker Mouse Forwarding**: Fixed 380px stable window dimensions paired with Electron's `setIgnoreMouseEvents` forwarder. Zero window jumping, zero redraw flicker, and instant click-through on transparent desktop areas.
- **🔊 Synthesized Tactical Audio**: Lightweight, zero-latency Web Audio sound blips and engagement chimes on hover and interactions.
- **📐 Screen Flank Switching**: Anchor your HUD to either the **Right Flank** or **Left Flank** of your screen.

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
- **Telemetry Counter**: Live byte and token counters.

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
