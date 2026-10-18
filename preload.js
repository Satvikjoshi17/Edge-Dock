const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dockAPI', {
  launchTarget: (path) => ipcRenderer.invoke('launch-target', path),
  getFileIcon: (path) => ipcRenderer.invoke('get-file-icon', path),
  selectFile: () => ipcRenderer.invoke('select-file'),
  showInFolder: (path) => ipcRenderer.invoke('show-in-folder', path),
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  saveShortcuts: (shortcuts) => ipcRenderer.invoke('save-shortcuts', shortcuts),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  setExpanded: (expanded) => ipcRenderer.send('set-expanded', expanded),
  updateHotkey: (hotkey) => ipcRenderer.invoke('update-hotkey', hotkey),
  setLoginItem: (enable) => ipcRenderer.invoke('set-login-item', enable),
  hideWindow: () => ipcRenderer.send('hide-window')
});