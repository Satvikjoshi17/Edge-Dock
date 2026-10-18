const { app, BrowserWindow, screen, ipcMain, shell, globalShortcut, Tray, Menu, nativeImage, dialog, clipboard, desktopCapturer } = require('electron');
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
let tray = null;
let store = null;

// Fixed stable window size - prevents any hover flicker / position jumping
const WINDOW_WIDTH = 380;
const DOCK_WIDTH = 78;

const defaultShortcuts = [
  { id: '1', name: 'VS Code', path: 'code', iconType: 'svg', icon: 'code' },
  { id: '2', name: 'GitHub', path: 'https://github.com', iconType: 'url', icon: 'web' },
  { id: '3', name: 'Terminal', path: 'wt', iconType: 'svg', icon: 'terminal' },
  { id: '4', name: 'Command Prompt', path: 'cmd', iconType: 'svg', icon: 'terminal' }
];

const defaultSettings = {
  dockPosition: 'right', // 'right' | 'left'
  autoHide: false,
  hotkey: 'Alt+Space',
  quickHotkey: 'Alt+Q',
  launchOnBoot: true,
  accentColor: '#00f0ff',
  showLabels: true
};

function getSettings() {
  if (!store) return defaultSettings;
  return { ...defaultSettings, ...(store.get('settings') || {}) };
}

function updateWindowBounds() {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const settings = getSettings();

  const x = settings.dockPosition === 'left' ? 0 : width - WINDOW_WIDTH;
  mainWindow.setBounds({
    x,
    y: 0,
    width: WINDOW_WIDTH,
    height
  });
}

function createSidebar() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const settings = getSettings();
  const x = settings.dockPosition === 'left' ? 0 : width - WINDOW_WIDTH;

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
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

  mainWindow.webContents.on('did-finish-load', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  });

  screen.on('display-metrics-changed', updateWindowBounds);
  screen.on('display-added', updateWindowBounds);
  screen.on('display-removed', updateWindowBounds);

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
    }
  });
}

function sanitizeAccelerator(accel, fallback = 'Alt+Q') {
  if (!accel || typeof accel !== 'string') return fallback;
  const clean = accel.trim();
  // Solitary modifiers are illegal in Electron globalShortcut
  if (/^(shift|alt|ctrl|control|meta|command)$/i.test(clean)) {
    return clean.toLowerCase() === 'shift' ? 'Shift+Space' : fallback;
  }
  return clean;
}

function registerGlobalHotkeys() {
  globalShortcut.unregisterAll();
  const settings = getSettings();
  const mainHotkey = sanitizeAccelerator(settings.hotkey, 'Alt+Space');
  const quickHotkey = sanitizeAccelerator(settings.quickHotkey, 'Alt+Q');

  try {
    globalShortcut.register(mainHotkey, () => {
      toggleSidebar();
    });
  } catch (err) {
    console.error('Failed to register main hotkey:', err);
  }

  try {
    globalShortcut.register(quickHotkey, () => {
      summonQuickAction();
    });
  } catch (err) {
    console.error('Failed to register quick action hotkey:', err);
  }
}

function summonQuickAction() {
  if (!mainWindow) return;
  const currentText = clipboard.readText() || '';
  if (!isVisible) {
    updateWindowBounds();
    mainWindow.show();
    isVisible = true;
  }
  mainWindow.focus();
  mainWindow.setIgnoreMouseEvents(false);
  mainWindow.webContents.send('summon-quick-action', currentText);
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
        label: `J.A.R.V.I.S. HUD (${settings.hotkey})`,
        click: () => toggleSidebar()
      },
      {
        label: `Quick Hologram Action (${settings.quickHotkey || 'Alt+Q'})`,
        click: () => summonQuickAction()
      },
      {
        label: settings.autoHide ? 'Auto-Cloak: Active' : 'Auto-Cloak: Off',
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
        label: `HUD Anchor: ${settings.dockPosition === 'left' ? 'Left Flank' : 'Right Flank'}`,
        submenu: [
          {
            label: 'Right Flank',
            type: 'radio',
            checked: settings.dockPosition === 'right',
            click: () => {
              settings.dockPosition = 'right';
              store.set('settings', settings);
              updateWindowBounds();
              if (mainWindow) {
                mainWindow.webContents.send('settings-updated', settings);
              }
              rebuildContextMenu();
            }
          },
          {
            label: 'Left Flank',
            type: 'radio',
            checked: settings.dockPosition === 'left',
            click: () => {
              settings.dockPosition = 'left';
              store.set('settings', settings);
              updateWindowBounds();
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
        label: 'Shutdown J.A.R.V.I.S.',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }

  tray.setToolTip('EdgeDock - J.A.R.V.I.S. Hologram HUD');
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
  } else {
    updateWindowBounds();
    mainWindow.show();
    mainWindow.focus();
    isVisible = true;
  }
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (!isVisible) {
      mainWindow.show();
      isVisible = true;
    }
    mainWindow.focus();
  }
});

// Mouse Event Forwarding
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
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
// Power Tool 2: YouTube / Media Engine & Search
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
    https.get(url, { headers: { 'User-Agent': 'EdgeDock-JARVIS-Engine' } }, (res) => {
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

// Search YouTube by name/query
ipcMain.handle('search-youtube', async (event, query) => {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return new Promise((resolve) => {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`;
      https.get(oembedUrl, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            resolve([{
              id: 'direct',
              title: data.title || 'Direct Video Stream',
              url: trimmed,
              channel: data.author_name || 'YouTube',
              thumbnail: data.thumbnail_url || '',
              duration: 'Direct Link'
            }]);
          } catch {
            resolve([{
              id: 'direct',
              title: trimmed,
              url: trimmed,
              channel: 'Direct Link',
              thumbnail: '',
              duration: ''
            }]);
          }
        });
      }).on('error', () => {
        resolve([{ id: 'direct', title: trimmed, url: trimmed, channel: 'Web Video', thumbnail: '', duration: '' }]);
      });
    });
  }

  return new Promise((resolve) => {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(trimmed)}`;
    https.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const match = data.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
        if (match) {
          try {
            const json = JSON.parse(match[1]);
            const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
            const results = [];
            for (const item of contents) {
              const v = item.videoRenderer;
              if (v && v.videoId) {
                const title = v.title?.runs?.[0]?.text || '';
                const channel = v.ownerText?.runs?.[0]?.text || '';
                const duration = v.lengthText?.simpleText || '';
                const thumbs = v.thumbnail?.thumbnails || [];
                const thumbnail = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

                results.push({
                  id: v.videoId,
                  title,
                  url: `https://www.youtube.com/watch?v=${v.videoId}`,
                  duration,
                  channel,
                  thumbnail
                });
                if (results.length >= 6) break;
              }
            }
            resolve(results);
            return;
          } catch (e) {
            console.error('YouTube search parse error:', e);
          }
        }
        resolve([]);
      });
    }).on('error', (err) => {
      console.error('YouTube search request error:', err);
      resolve([]);
    });
  });
});

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
  registerGlobalHotkeys();
  startClipboardMonitor();
});

// IPC: Safe target launch
ipcMain.handle('launch-target', async (event, targetPath) => {
  try {
    if (!targetPath || typeof targetPath !== 'string') {
      return { success: false, error: 'Invalid target path' };
    }

    const trimmed = targetPath.trim();

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      await shell.openExternal(trimmed);
      return { success: true };
    }

    if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes(':')) {
      const errorMessage = await shell.openPath(trimmed);
      if (errorMessage) {
        return { success: false, error: errorMessage };
      }
      return { success: true };
    }

    const child = spawn(trimmed, [], {
      detached: true,
      stdio: 'ignore',
      shell: false
    });
    child.on('error', (err) => {
      console.error('Spawn error:', err);
    });
    child.unref();

    return { success: true };
  } catch (err) {
    console.error('Launch Error:', err);
    return { success: false, error: err.message || 'Execution failed' };
  }
});

// IPC: Hotkey Updates
ipcMain.handle('update-hotkey', (event, hotkey) => {
  if (store && hotkey) {
    const settings = getSettings();
    settings.hotkey = sanitizeAccelerator(hotkey, 'Alt+Space');
    store.set('settings', settings);
    registerGlobalHotkeys();
    return true;
  }
  return false;
});

ipcMain.handle('update-quick-hotkey', (event, hotkey) => {
  if (store && hotkey) {
    const settings = getSettings();
    settings.quickHotkey = sanitizeAccelerator(hotkey, 'Alt+Q');
    store.set('settings', settings);
    registerGlobalHotkeys();
    return true;
  }
  return false;
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
    title: 'Select Application or Protocol for HUD',
    properties: ['openFile'],
    filters: [
      { name: 'Programs & Executables', extensions: ['exe', 'lnk', 'bat', 'cmd', 'url'] },
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
    updateWindowBounds();
  }
  return true;
});

// IPC: Window visibility
ipcMain.on('hide-window', () => {
  if (mainWindow) {
    mainWindow.hide();
    isVisible = false;
  }
});

// IPC: Mouse event forwarding (Pass-through for transparent regions)
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(Boolean(ignore), { forward: true });
  }
});

ipcMain.on('set-expanded', (event, expanded) => {
  // Handled via CSS drawers with fixed stable window
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

ipcMain.handle('install-ytdl', async () => {
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
      return { success: false, error: 'J.A.R.V.I.S. Media Core offline. Click "INITIALIZE CORE" to download yt-dlp engine.' };
    }

    if (!url || typeof url !== 'string') {
      return { success: false, error: 'Invalid media URL' };
    }

    const downloadsDir = app.getPath('downloads');
    const args = ['-P', downloadsDir, '--newline'];

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', '%(title)s.%(ext)s');
    } else {
      args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '-o', '%(title)s.%(ext)s');
    }

    args.push(url.trim());

    currentDownloadProcess = spawn(binary, args, { windowsHide: true });

    currentDownloadProcess.stdout.on('data', (data) => {
      const output = data.toString();
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

    currentDownloadProcess.on('close', (code) => {
      currentDownloadProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (code === 0) {
          mainWindow.webContents.send('download-complete', { success: true });
        } else {
          mainWindow.webContents.send('download-complete', { success: false, error: `Protocol exited with code ${code}` });
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

// Tactical Window Grid Manager
ipcMain.handle('snap-window', async (event, action) => {
  try {
    const scriptPath = path.join(__dirname, 'scripts', 'snap-window.ps1');
    return new Promise((resolve) => {
      const child = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-action', action], {
        windowsHide: true
      });
      child.on('close', (code) => {
        resolve({ success: code === 0 });
      });
      child.on('error', () => {
        resolve({ success: false });
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Instant HUD Screen Capture
ipcMain.handle('capture-screen', async () => {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });
    if (!sources || sources.length === 0) {
      return { success: false, error: 'No display source detected' };
    }
    const img = sources[0].thumbnail;
    clipboard.writeImage(img);

    const picturesDir = app.getPath('pictures');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath = path.join(picturesDir, `J.A.R.V.I.S._Capture_${timestamp}.png`);
    fs.writeFileSync(outPath, img.toPNG());

    return {
      success: true,
      filePath: outPath,
      dataUrl: img.toDataURL()
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// File & Media Converter / Storage
ipcMain.handle('save-converted-image', async (event, { base64Data, format, filename }) => {
  try {
    const picturesDir = app.getPath('pictures');
    const safeName = filename || `J.A.R.V.I.S._Converted_${Date.now()}.${format || 'png'}`;
    const targetPath = path.join(picturesDir, safeName);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(targetPath, buffer);

    try {
      const nativeImg = nativeImage.createFromBuffer(buffer);
      if (!nativeImg.isEmpty()) {
        clipboard.writeImage(nativeImg);
      }
    } catch {}

    return { success: true, filePath: targetPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (currentDownloadProcess) {
    try {
      currentDownloadProcess.kill();
    } catch (e) {}
  }
});