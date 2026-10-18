const { app, BrowserWindow, screen, ipcMain, shell, globalShortcut, Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let isVisible = true;
let isExpanded = false;
let tray = null;
let store = null;

const DOCK_WIDTH = 68;
const EXPANDED_WIDTH = 340;

const defaultShortcuts = [
  { id: '1', name: 'VS Code', path: 'code', iconType: 'svg', icon: 'code' },
  { id: '2', name: 'GitHub', path: 'https://github.com', iconType: 'url', icon: 'web' },
  { id: '3', name: 'Terminal', path: 'wt', iconType: 'svg', icon: 'terminal' }
];

const defaultSettings = {
  dockPosition: 'right', // 'right' | 'left'
  autoHide: false,
  hotkey: 'Alt+Space',
  launchOnBoot: true,
  accentColor: '#00f2fe'
};

function getSettings() {
  if (!store) return defaultSettings;
  return { ...defaultSettings, ...(store.get('settings') || {}) };
}

function updateWindowBounds(expanded = isExpanded) {
  if (!mainWindow) return;
  isExpanded = expanded;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const settings = getSettings();
  const targetWidth = isExpanded ? EXPANDED_WIDTH : DOCK_WIDTH;

  const x = settings.dockPosition === 'left' ? 0 : width - targetWidth;
  mainWindow.setBounds({
    x,
    y: 0,
    width: targetWidth,
    height
  });
}

function createSidebar() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const settings = getSettings();
  const x = settings.dockPosition === 'left' ? 0 : width - DOCK_WIDTH;

  mainWindow = new BrowserWindow({
    width: DOCK_WIDTH,
    height,
    x,
    y: 0,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Multi-monitor and resolution change listeners
  screen.on('display-metrics-changed', () => updateWindowBounds(isExpanded));
  screen.on('display-added', () => updateWindowBounds(isExpanded));
  screen.on('display-removed', () => updateWindowBounds(isExpanded));

  // Hide instead of close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      isVisible = false;
    }
  });

  // Auto-hide on blur if configured
  mainWindow.on('blur', () => {
    const currentSettings = getSettings();
    if (currentSettings.autoHide && isVisible && mainWindow) {
      mainWindow.hide();
      isVisible = false;
      isExpanded = false;
    }
  });
}

function registerHotkey(newHotkey) {
  globalShortcut.unregisterAll();
  const hotkey = newHotkey || getSettings().hotkey || 'Alt+Space';
  try {
    const registered = globalShortcut.register(hotkey, () => {
      toggleSidebar();
    });
    if (!registered) {
      console.warn(`Global shortcut ${hotkey} registration failed.`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to register global hotkey:', err);
    return false;
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  let trayIcon;

  try {
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
    } else {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  function rebuildContextMenu() {
    const settings = getSettings();
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Toggle Dock (${settings.hotkey})`,
        click: () => toggleSidebar()
      },
      {
        label: settings.autoHide ? 'Auto-Hide: Enabled' : 'Auto-Hide: Disabled',
        type: 'checkbox',
        checked: settings.autoHide,
        click: () => {
          const next = !settings.autoHide;
          settings.autoHide = next;
          store.set('settings', settings);
          if (mainWindow) {
            mainWindow.webContents.send('settings-updated', settings);
          }
          rebuildContextMenu();
        }
      },
      {
        label: `Dock Position: ${settings.dockPosition === 'left' ? 'Left Edge' : 'Right Edge'}`,
        submenu: [
          {
            label: 'Right Side',
            type: 'radio',
            checked: settings.dockPosition === 'right',
            click: () => {
              settings.dockPosition = 'right';
              store.set('settings', settings);
              updateWindowBounds(isExpanded);
              if (mainWindow) {
                mainWindow.webContents.send('settings-updated', settings);
              }
              rebuildContextMenu();
            }
          },
          {
            label: 'Left Side',
            type: 'radio',
            checked: settings.dockPosition === 'left',
            click: () => {
              settings.dockPosition = 'left';
              store.set('settings', settings);
              updateWindowBounds(isExpanded);
              if (mainWindow) {
                mainWindow.webContents.send('settings-updated', settings);
              }
              rebuildContextMenu();
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Quit EdgeDock',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }

  tray.setToolTip('EdgeDock - Quick Launcher');
  rebuildContextMenu();

  tray.on('click', () => {
    toggleSidebar();
  });
}

function toggleSidebar() {
  if (!mainWindow) return;
  if (isVisible) {
    mainWindow.hide();
    isVisible = false;
    isExpanded = false;
  } else {
    updateWindowBounds(false);
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
  }
}

// Second instance focus
app.on('second-instance', () => {
  if (mainWindow) {
    if (!isVisible) {
      mainWindow.show();
      isVisible = true;
    }
    mainWindow.focus();
  }
});

app.whenReady().then(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store({
    defaults: {
      shortcuts: defaultShortcuts,
      settings: defaultSettings
    }
  });

  if (app.isPackaged) {
    const settings = getSettings();
    app.setLoginItemSettings({
      openAtLogin: settings.launchOnBoot,
      path: process.execPath
    });
  }

  createSidebar();
  createTray();
  registerHotkey();
});

// IPC: Safe target launch
ipcMain.handle('launch-target', async (event, targetPath) => {
  try {
    if (!targetPath || typeof targetPath !== 'string') {
      return { success: false, error: 'Invalid path provided' };
    }

    const trimmed = targetPath.trim();

    // 1. URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      await shell.openExternal(trimmed);
      return { success: true };
    }

    // 2. File / Directory / Application path (contains slashes or drive colon)
    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':')) {
      const errorMessage = await shell.openPath(trimmed);
      if (errorMessage) {
        return { success: false, error: errorMessage };
      }
      return { success: true };
    }

    // 3. Recognized command line tools (e.g., 'code', 'wt', 'cmd')
    const child = spawn(trimmed, [], {
      detached: true,
      stdio: 'ignore',
      shell: false
    });
    child.on('error', (err) => {
      console.error('Command spawn error:', err);
    });
    child.unref();

    return { success: true };
  } catch (err) {
    console.error('Launch Error:', err);
    return { success: false, error: err.message || 'Execution failed' };
  }
});

// IPC: Window Expand / Collapse for flyouts and drawers
ipcMain.on('set-expanded', (event, expanded) => {
  updateWindowBounds(Boolean(expanded));
});

// IPC: Hotkey Update
ipcMain.handle('update-hotkey', (event, hotkey) => {
  const success = registerHotkey(hotkey);
  if (success && store) {
    const settings = getSettings();
    settings.hotkey = hotkey;
    store.set('settings', settings);
  }
  return success;
});

// IPC: Toggle Startup Launch
ipcMain.handle('set-login-item', (event, enable) => {
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enable),
      path: process.execPath
    });
  }
  if (store) {
    const settings = getSettings();
    settings.launchOnBoot = Boolean(enable);
    store.set('settings', settings);
  }
  return true;
});

// IPC: Native File Icon Extractor
ipcMain.handle('get-file-icon', async (event, filePath) => {
  try {
    if (!filePath || filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return null;
    }
    const icon = await app.getFileIcon(filePath, { size: 'normal' });
    if (icon && !icon.isEmpty()) {
      return icon.toDataURL();
    }
  } catch (e) {
    // Fallback
  }
  return null;
});

// IPC: Native File Selector
ipcMain.handle('select-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Application or File to Pin',
    properties: ['openFile'],
    filters: [
      { name: 'Programs & Shortcuts', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const name = path.basename(selectedPath, path.extname(selectedPath));
  let iconData = null;

  try {
    const icon = await app.getFileIcon(selectedPath, { size: 'normal' });
    if (icon && !icon.isEmpty()) {
      iconData = icon.toDataURL();
    }
  } catch {}

  return { path: selectedPath, name, iconData };
});

// IPC: Reveal in File Explorer
ipcMain.handle('show-in-folder', async (event, targetPath) => {
  if (targetPath && !targetPath.startsWith('http://') && !targetPath.startsWith('https://')) {
    shell.showItemInFolder(targetPath);
    return true;
  }
  return false;
});

// IPC: Shortcut Storage
ipcMain.handle('get-shortcuts', () => {
  if (!store) return defaultShortcuts;
  return store.get('shortcuts', defaultShortcuts);
});

ipcMain.handle('save-shortcuts', (event, shortcuts) => {
  if (store && Array.isArray(shortcuts)) {
    store.set('shortcuts', shortcuts);
  }
  return true;
});

// IPC: Settings Storage
ipcMain.handle('get-settings', () => {
  return getSettings();
});

ipcMain.handle('save-settings', (event, newSettings) => {
  if (store && typeof newSettings === 'object') {
    store.set('settings', newSettings);
    updateWindowBounds(isExpanded);
  }
  return true;
});

// IPC: Window visibility
ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
    isVisible = false;
    isExpanded = false;
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});