const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dockAPI', {
  // App Shortcuts & Launching
  launchTarget: (path) => ipcRenderer.invoke('launch-target', path),
  getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),
  selectFile: () => ipcRenderer.invoke('select-file'),
  showInFolder: (path) => ipcRenderer.invoke('show-in-folder', path),
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  saveShortcuts: (shortcuts) => ipcRenderer.invoke('save-shortcuts', shortcuts),

  // Settings & System
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  setExpanded: (expanded) => ipcRenderer.send('set-expanded', expanded),
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),
  updateHotkey: (hotkey) => ipcRenderer.invoke('update-hotkey', hotkey),
  updateQuickHotkey: (hotkey) => ipcRenderer.invoke('update-quick-hotkey', hotkey),
  setLoginItem: (enable) => ipcRenderer.invoke('set-login-item', enable),
  hideWindow: () => ipcRenderer.send('hide-window'),

  // Power Tool: Clipboard History
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  onClipboardUpdated: (callback) => ipcRenderer.on('clipboard-updated', (event, data) => callback(data)),

  // Power Tool: Scratchpad
  getScratchpad: () => ipcRenderer.invoke('get-scratchpad'),
  saveScratchpad: (text) => ipcRenderer.invoke('save-scratchpad', text),

  // Power Tool: Media / YouTube Downloader & Search
  checkYtdlStatus: () => ipcRenderer.invoke('check-ytdl-status'),
  installYtdl: () => ipcRenderer.invoke('install-ytdl'),
  searchYouTube: (query) => ipcRenderer.invoke('search-youtube', query),
  startMediaDownload: (options) => ipcRenderer.invoke('start-media-download', options),
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', (event, data) => callback(data)),
  onSetupProgress: (callback) => ipcRenderer.on('setup-progress', (event, data) => callback(data)),

  // J.A.R.V.I.S. Quick-Action Hologram Trigger
  onSummonQuickAction: (callback) => ipcRenderer.on('summon-quick-action', (event, text) => callback(text))
});