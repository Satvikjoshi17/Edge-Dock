const { app, BrowserWindow, screen, ipcMain, shell, globalShortcut, Tray, Menu, nativeImage, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn, execSync } = require('child_process');

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

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      isVisible = false;
    }
  });

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

  tray.setToolTip('EdgeDock - Quick Launcher & Toolbox');
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

// -------------------------------------------------------------
// Power Tool 1: Clipboard History Monitor
// -------------------------------------------------------------
let lastClipboardText = '';
const clipboardHistory = [];

function startClipboardMonitor() {
  setInterval(() => {
    try {
      const text = clipboard.readText();
      if (text && text.trim() && text !== lastClipboardText) {
        lastClipboardText = text;
        const existsIndex = clipboardHistory.findIndex((item) => item.text === text);
        if (existsIndex !== -1) {
          clipboardHistory.splice(existsIndex, 1);
        }
        clipboardHistory.unshift({
          id: Date.now().toString(),
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        if (clipboardHistory.length > 35) {
          clipboardHistory.pop();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-updated', clipboardHistory);
        }
      }
    } catch (e) {}
  }, 1000);
}

// -------------------------------------------------------------
// Power Tool 2: YouTube / Media Engine Helper
// -------------------------------------------------------------
function getBundledYtdlPath() {
  const binDir = path.join(app.getPath('userData'), 'bin');
  return path.join(binDir, 'yt-dlp.exe');
}

function resolveYtdlPath() {
  const localBin = getBundledYtdlPath();
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  try {
    const stdout = execSync('where yt-dlp', { stdio: 'pipe' }).toString().split('\r\n')[0].trim();
    if (stdout && fs.existsSync(stdout)) {
      return stdout;
    }
  } catch (e) {}
  return null;
}

function downloadFileWithRedirects(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'EdgeDock-MediaDownloader' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFileWithRedirects(res.headers.location, destPath, onProgress).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Download failed with status: ${res.statusCode}`));
      }

      const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
      let downloadedBytes = 0;
      const fileStream = fs.createWriteStream(destPath);

      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0 && onProgress) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          onProgress(percent);
        }
      });

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// App Ready
app.whenReady().then(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store({
    defaults: {
      shortcuts: defaultShortcuts,
      settings: defaultSettings,
      scratchpad: ''
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
  startClipboardMonitor();
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

    // 2. File / Directory / Application path
    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':')) {
      const errorMessage = await shell.openPath(trimmed);
      if (errorMessage) {
        return { success: false, error: errorMessage };
      }
      return { success: true };
    }

    // 3. Recognized command line tools
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

// IPC: Window Expand / Collapse
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
  } catch (e) {}
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

// IPC: Shortcuts Storage
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

// -------------------------------------------------------------
// IPC: Power Tool - Clipboard History
// -------------------------------------------------------------
ipcMain.handle('get-clipboard-history', () => {
  return clipboardHistory;
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
  if (typeof text === 'string') {
    clipboard.writeText(text);
    lastClipboardText = text;
    return true;
  }
  return false;
});

ipcMain.handle('clear-clipboard-history', () => {
  clipboardHistory.length = 0;
  return true;
});

// -------------------------------------------------------------
// IPC: Power Tool - Scratchpad
// -------------------------------------------------------------
ipcMain.handle('get-scratchpad', () => {
  if (!store) return '';
  return store.get('scratchpad', '');
});

ipcMain.handle('save-scratchpad', (event, text) => {
  if (store && typeof text === 'string') {
    store.set('scratchpad', text);
    return true;
  }
  return false;
});

// -------------------------------------------------------------
// IPC: Power Tool - YouTube / Media Downloader
// -------------------------------------------------------------
ipcMain.handle('check-ytdl-status', () => {
  const binary = resolveYtdlPath();
  return { installed: Boolean(binary), path: binary };
});

ipcMain.handle('install-ytdl', async (event) => {
  try {
    const binDir = path.join(app.getPath('userData'), 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }
    const destPath = path.join(binDir, 'yt-dlp.exe');
    const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

    await downloadFileWithRedirects(downloadUrl, destPath, (percent) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('setup-progress', { percent });
      }
    });

    return { success: true, path: destPath };
  } catch (err) {
    console.error('Failed to setup yt-dlp:', err);
    return { success: false, error: err.message };
  }
});

let currentDownloadProcess = null;

ipcMain.handle('start-media-download', async (event, { url, format }) => {
  try {
    const binary = resolveYtdlPath();
    if (!binary) {
      return { success: false, error: 'Media engine not installed. Click "Setup Engine" first.' };
    }

    if (!url || typeof url !== 'string') {
      return { success: false, error: 'Please enter a valid YouTube/video URL or title' };
    }

    const downloadsDir = app.getPath('downloads');
    const args = ['-P', downloadsDir, '--newline'];

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', '%(title)s.%(ext)s');
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', '%(title)s.%(ext)s');
    }

    // Support searching by name: if not starting with http, prepend ytsearch1:
    const target = url.trim().startsWith('http') ? url.trim() : `ytsearch1:${url.trim()}`;
    args.push(target);

    currentDownloadProcess = spawn(binary, args, { windowsHide: true });

    currentDownloadProcess.stdout.on('data', (data) => {
      const output = data.toString();
      // Match [download]  45.2% of 15.00MiB at 4.20MiB/s ETA 00:02
      const match = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s\r\n]+)/);
      if (match && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('download-progress', {
          percent: parseFloat(match[1]),
          size: match[2],
          speed: match[3],
          eta: match[4]
        });
      }
    });

    currentDownloadProcess.stderr.on('data', (data) => {
      console.warn('yt-dlp stderr:', data.toString());
    });

    currentDownloadProcess.on('close', (code) => {
      currentDownloadProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (code === 0) {
          mainWindow.webContents.send('download-complete', { success: true });
        } else {
          mainWindow.webContents.send('download-complete', { success: false, error: `Process exited with code ${code}` });
        }
      }
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-downloads-folder', async () => {
  const dir = app.getPath('downloads');
  await shell.openPath(dir);
  return true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (currentDownloadProcess) {
    try {
      currentDownloadProcess.kill();
    } catch (e) {}
  }
});