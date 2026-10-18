const SVG_ICONS = {
  code: `<svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
  web: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-7l4 4-4 4-1.4-1.4L9.2 15l-2.6-2.6L8 11zm6 7h5v-2h-5v2z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
  default: `<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`
};

// -------------------------------------------------------------
// J.A.R.V.I.S. Audio Synthesizer (Zero-latency Web Audio SFX)
// -------------------------------------------------------------
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playJarvisSound(type = 'blip') {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'blip') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'engage') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {}
}

let shortcuts = [];
let currentSettings = {
  dockPosition: 'right',
  autoHide: false,
  hotkey: 'Alt+Space',
  launchOnBoot: true,
  showLabels: true
};

let activeContextMenuTarget = null;
let draggedItemIndex = null;
let temporaryPickedIcon = null;
let selectedDownloadFormat = 'mp4';
let clipboardCache = [];
let scratchpadSaveTimeout = null;
let isCapturingMouse = true;

// DOM Elements
const bodyEl = document.getElementById('dock-body');
const rail = document.getElementById('rail');
const listContainer = document.getElementById('launcher-list');
const toggleAddBtn = document.getElementById('toggle-add-btn');
const toggleAutoHideBtn = document.getElementById('toggle-autohide-btn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeBtn = document.getElementById('close-btn');

// Power Tools Buttons
const toolYtdlBtn = document.getElementById('tool-ytdl-btn');
const toolClipboardBtn = document.getElementById('tool-clipboard-btn');
const toolScratchpadBtn = document.getElementById('tool-scratchpad-btn');

// Add/Edit Drawer
const drawer = document.getElementById('drawer');
const drawerTitle = document.getElementById('drawer-title');
const shortcutForm = document.getElementById('shortcut-form');
const itemIdInput = document.getElementById('item-id');
const appNameInput = document.getElementById('app-name');
const appPathInput = document.getElementById('app-path');
const browseBtn = document.getElementById('browse-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Media Downloader Drawer
const ytdlDrawer = document.getElementById('ytdl-drawer');
const ytdlEngineBadge = document.getElementById('ytdl-engine-badge');
const ytdlSetupBox = document.getElementById('ytdl-setup-box');
const installEngineBtn = document.getElementById('install-engine-btn');
const setupProgressBar = document.getElementById('setup-progress-bar');
const setupProgressFill = document.getElementById('setup-progress-fill');
const ytdlSearchForm = document.getElementById('ytdl-search-form');
const ytdlQueryInput = document.getElementById('ytdl-query-input');
const searchMediaBtn = document.getElementById('search-media-btn');
const ytdlResultsList = document.getElementById('ytdl-results-list');
const ytdlFormatBtns = ytdlDrawer.querySelectorAll('.segmented-control .segment-btn');
const downloadProgressBox = document.getElementById('download-progress-box');
const downloadStatusText = document.getElementById('download-status-text');
const downloadProgressFill = document.getElementById('download-progress-fill');
const downloadMetaText = document.getElementById('download-meta-text');
const openDownloadsBtn = document.getElementById('open-downloads-btn');

// Clipboard Drawer
const clipboardDrawer = document.getElementById('clipboard-drawer');
const clipboardList = document.getElementById('clipboard-list');
const clipboardSearch = document.getElementById('clipboard-search');
const clearClipboardBtn = document.getElementById('clear-clipboard-btn');

// Scratchpad Drawer
const scratchpadDrawer = document.getElementById('scratchpad-drawer');
const scratchpadText = document.getElementById('scratchpad-text');
const scratchpadCounter = document.getElementById('scratchpad-counter');
const copyScratchpadBtn = document.getElementById('copy-scratchpad-btn');
const clearScratchpadBtn = document.getElementById('clear-scratchpad-btn');
const scratchpadSavedBadge = document.getElementById('scratchpad-saved-badge');

// Settings Drawer
const settingsDrawer = document.getElementById('settings-drawer');
const segmentBtns = document.querySelectorAll('#position-segmented .segment-btn');
const hotkeyInput = document.getElementById('hotkey-input');
const saveHotkeyBtn = document.getElementById('save-hotkey-btn');
const showLabelsSwitch = document.getElementById('show-labels-switch');
const launchBootSwitch = document.getElementById('launch-boot-switch');
const autohideSwitch = document.getElementById('autohide-switch');
const closeSettingsBtn = document.getElementById('close-settings-btn');

// Context Menu & Toast
const contextMenu = document.getElementById('context-menu');
const ctxLaunch = document.getElementById('ctx-launch');
const ctxReveal = document.getElementById('ctx-reveal');
const ctxEdit = document.getElementById('ctx-edit');
const ctxDelete = document.getElementById('ctx-delete');
const toastEl = document.getElementById('toast');

const allDrawers = [drawer, settingsDrawer, ytdlDrawer, clipboardDrawer, scratchpadDrawer];

// -------------------------------------------------------------
// Mouse Event Forwarding (Permanent fix for hover glitch)
// -------------------------------------------------------------
window.addEventListener('mousemove', (e) => {
  const overRail = rail.contains(e.target);
  const overDrawer = allDrawers.some((d) => d.classList.contains('open') && d.contains(e.target));
  const overCtx = contextMenu.classList.contains('visible') && contextMenu.contains(e.target);

  const shouldCapture = overRail || overDrawer || overCtx;
  if (shouldCapture !== isCapturingMouse) {
    isCapturingMouse = shouldCapture;
    if (window.dockAPI) {
      window.dockAPI.setIgnoreMouse(!shouldCapture);
    }
  }
});

async function init() {
  if (window.dockAPI) {
    shortcuts = (await window.dockAPI.getShortcuts()) || [];
    const savedSettings = await window.dockAPI.getSettings();
    if (savedSettings) currentSettings = { ...currentSettings, ...savedSettings };

    // Power Tool Listeners
    window.dockAPI.onClipboardUpdated((clips) => {
      clipboardCache = clips || [];
      renderClipboardList();
    });

    window.dockAPI.onDownloadProgress((prog) => {
      downloadProgressBox.classList.remove('hidden');
      downloadStatusText.textContent = `ACQUIRING STREAM... ${prog.percent}%`;
      downloadProgressFill.style.width = `${prog.percent}%`;
      downloadMetaText.textContent = `${prog.percent}% • ${prog.speed || '--'} • ETA ${prog.eta || '--'}`;
    });

    window.dockAPI.onDownloadComplete((res) => {
      if (res && res.success) {
        downloadStatusText.textContent = 'PROTOCOL COMPLETE';
        downloadProgressFill.style.width = '100%';
        playJarvisSound('engage');
        showToast('Stream acquisition complete! Saved to Downloads');
      } else {
        downloadStatusText.textContent = 'PROTOCOL FAILED';
        showToast(`Download aborted: ${res.error || 'Check stream source'}`);
      }
    });

    window.dockAPI.onSetupProgress((data) => {
      setupProgressBar.classList.remove('hidden');
      setupProgressFill.style.width = `${data.percent}%`;
      installEngineBtn.textContent = `SYNCHRONIZING CORE... ${data.percent}%`;
    });
  }

  applySettings(currentSettings);
  await loadMissingIcons();
  renderShortcuts();
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

function applySettings(settings) {
  // 1. Dock Position
  if (settings.dockPosition === 'left') {
    bodyEl.classList.add('dock-left');
  } else {
    bodyEl.classList.remove('dock-left');
  }
  segmentBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.position === settings.dockPosition);
  });

  // 2. Auto-Hide state
  if (settings.autoHide) {
    bodyEl.classList.add('autohide-active');
    toggleAutoHideBtn.classList.add('active');
    toggleAutoHideBtn.title = 'Cloak: Active (Click to Disengage)';
    autohideSwitch.checked = true;
  } else {
    bodyEl.classList.remove('autohide-active');
    rail.classList.remove('peek-hidden');
    toggleAutoHideBtn.classList.remove('active');
    toggleAutoHideBtn.title = 'Cloak: Off (Click to Engage)';
    autohideSwitch.checked = false;
  }

  // 3. Hotkey
  if (settings.hotkey) {
    hotkeyInput.value = settings.hotkey;
  }

  // 4. Show Labels
  showLabelsSwitch.checked = settings.showLabels !== false;

  // 5. Startup Launch
  launchBootSwitch.checked = Boolean(settings.launchOnBoot);
}

function closeAllDrawers() {
  allDrawers.forEach((d) => d.classList.remove('open'));
  temporaryPickedIcon = null;
}

rail.addEventListener('mouseenter', () => {
  if (currentSettings.autoHide) {
    rail.classList.remove('peek-hidden');
  }
  playJarvisSound('blip');
});

rail.addEventListener('mouseleave', () => {
  const isAnyDrawerOpen = allDrawers.some((d) => d.classList.contains('open'));
  if (currentSettings.autoHide && !isAnyDrawerOpen) {
    rail.classList.add('peek-hidden');
  }
});

// Pre-fetch native icons
async function loadMissingIcons() {
  if (!window.dockAPI) return;
  let changed = false;

  for (const item of shortcuts) {
    if (!item.iconData && !item.path.startsWith('http://') && !item.path.startsWith('https://')) {
      const icon = await window.dockAPI.getFileIcon(item.path);
      if (icon) {
        item.iconData = icon;
        changed = true;
      }
    }
  }

  if (changed) {
    await window.dockAPI.saveShortcuts(shortcuts);
  }
}

function getIconElement(item) {
  if (item.iconData) {
    const img = document.createElement('img');
    img.src = item.iconData;
    img.alt = item.name;
    return img;
  }

  if (item.path.startsWith('http://') || item.path.startsWith('https://')) {
    try {
      const url = new URL(item.path);
      const img = document.createElement('img');
      img.src = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
      img.alt = item.name;
      img.onerror = () => {
        img.replaceWith(createSvgElement(SVG_ICONS.web));
      };
      return img;
    } catch {
      return createSvgElement(SVG_ICONS.web);
    }
  }

  const lower = item.path.toLowerCase();
  if (lower.includes('code')) return createSvgElement(SVG_ICONS.code);
  if (lower.includes('wt') || lower.includes('cmd') || lower.includes('terminal') || lower.includes('powershell')) {
    return createSvgElement(SVG_ICONS.terminal);
  }
  if (lower.includes('/') || lower.includes('\\')) {
    return createSvgElement(SVG_ICONS.folder);
  }

  return createSvgElement(SVG_ICONS.default);
}

function createSvgElement(svgHtml) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svgHtml.trim();
  return wrapper.firstChild;
}

// Render Launcher List (Clean, NO Corner Names, High-Tech HUD Labels)
function renderShortcuts() {
  listContainer.innerHTML = '';

  shortcuts.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.className = 'cyber-tile';
    tile.setAttribute('data-title', item.name);
    tile.setAttribute('draggable', 'true');
    tile.dataset.index = index;

    // Icon Container
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'cyber-tile-icon';
    iconWrapper.appendChild(getIconElement(item));
    tile.appendChild(iconWrapper);

    // High-Tech Name Label Underneath
    if (currentSettings.showLabels !== false) {
      const label = document.createElement('span');
      label.className = 'tile-label';
      label.textContent = item.name;
      tile.appendChild(label);
    }

    // Launch shortcut
    tile.addEventListener('click', async () => {
      playJarvisSound('engage');
      if (window.dockAPI) {
        const result = await window.dockAPI.launchTarget(item.path);
        if (result && !result.success) {
          showToast(`Protocol Failed: ${result.error || 'Executable offline'}`);
        }
      }
    });

    // Right-click context menu
    tile.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      playJarvisSound('blip');
      showContextMenu(e.clientX, e.clientY, item);
    });

    // Drag-to-reorder handlers
    tile.addEventListener('dragstart', (e) => {
      draggedItemIndex = index;
      tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', index);
    });

    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
      clearDropIndicators();
    });

    tile.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      clearDropIndicators();
      const rect = tile.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) {
        tile.classList.add('drag-target-top');
      } else {
        tile.classList.add('drag-target-bottom');
      }
    });

    tile.addEventListener('dragleave', () => {
      tile.classList.remove('drag-target-top', 'drag-target-bottom');
    });

    tile.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = tile.getBoundingClientRect();
      const insertBefore = e.clientY < rect.top + rect.height / 2;
      let targetIndex = insertBefore ? index : index + 1;

      if (draggedItemIndex !== null && draggedItemIndex !== undefined) {
        const movedItem = shortcuts.splice(draggedItemIndex, 1)[0];
        if (draggedItemIndex < targetIndex) targetIndex--;
        shortcuts.splice(targetIndex, 0, movedItem);
        draggedItemIndex = null;
        clearDropIndicators();
        if (window.dockAPI) {
          await window.dockAPI.saveShortcuts(shortcuts);
        }
        renderShortcuts();
      }
    });

    listContainer.appendChild(tile);
  });
}

function clearDropIndicators() {
  document.querySelectorAll('.cyber-tile').forEach((t) => {
    t.classList.remove('drag-target-top', 'drag-target-bottom');
  });
}

// Drag & drop file to rail
rail.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (e.dataTransfer.types.includes('Files')) {
    rail.classList.add('external-drag-over');
  }
});

rail.addEventListener('dragleave', (e) => {
  if (!rail.contains(e.relatedTarget)) {
    rail.classList.remove('external-drag-over');
  }
});

rail.addEventListener('drop', async (e) => {
  e.preventDefault();
  rail.classList.remove('external-drag-over');

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    for (const file of e.dataTransfer.files) {
      let iconData = null;
      if (window.dockAPI) {
        iconData = await window.dockAPI.getFileIcon(file.path);
      }

      const nameParts = file.name.split('.');
      if (nameParts.length > 1) nameParts.pop();
      const displayName = nameParts.join('.') || file.name;

      shortcuts.push({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
        name: displayName,
        path: file.path,
        iconData
      });
    }

    if (window.dockAPI) {
      await window.dockAPI.saveShortcuts(shortcuts);
    }
    renderShortcuts();
    playJarvisSound('engage');
    showToast('New Protocol Pinned to HUD');
  }
});

// Context Menu Management
function showContextMenu(x, y, item) {
  activeContextMenuTarget = item;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;
  if (currentSettings.dockPosition === 'left') {
    contextMenu.style.left = '86px';
    contextMenu.style.right = 'auto';
  } else {
    contextMenu.style.right = '86px';
    contextMenu.style.left = 'auto';
  }
  contextMenu.classList.add('visible');

  if (item.path.startsWith('http')) {
    ctxReveal.style.display = 'none';
  } else {
    ctxReveal.style.display = 'flex';
  }
}

function hideContextMenu() {
  contextMenu.classList.remove('visible');
  activeContextMenuTarget = null;
}

document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    hideContextMenu();
  }
  const isInsideAnyDrawer = allDrawers.some((d) => d.contains(e.target));
  const isInsideActionBtns = [toggleAddBtn, openSettingsBtn, toolYtdlBtn, toolClipboardBtn, toolScratchpadBtn].some((btn) => btn.contains(e.target));
  if (!isInsideAnyDrawer && !isInsideActionBtns) {
    closeAllDrawers();
  }
});

ctxLaunch.addEventListener('click', async () => {
  if (activeContextMenuTarget && window.dockAPI) {
    playJarvisSound('engage');
    const res = await window.dockAPI.launchTarget(activeContextMenuTarget.path);
    if (res && !res.success) {
      showToast(`Protocol Failed: ${res.error || 'Execution fault'}`);
    }
  }
  hideContextMenu();
});

ctxReveal.addEventListener('click', async () => {
  if (activeContextMenuTarget && window.dockAPI) {
    playJarvisSound('blip');
    await window.dockAPI.showInFolder(activeContextMenuTarget.path);
  }
  hideContextMenu();
});

ctxEdit.addEventListener('click', () => {
  if (activeContextMenuTarget) {
    openAddDrawer(activeContextMenuTarget);
  }
  hideContextMenu();
});

ctxDelete.addEventListener('click', async () => {
  if (activeContextMenuTarget) {
    shortcuts = shortcuts.filter((s) => s.id !== activeContextMenuTarget.id);
    if (window.dockAPI) {
      await window.dockAPI.saveShortcuts(shortcuts);
    }
    renderShortcuts();
    playJarvisSound('engage');
    showToast('Protocol Purged from HUD');
  }
  hideContextMenu();
});

// Add/Edit Drawer
function openAddDrawer(itemToEdit = null) {
  closeAllDrawers();
  playJarvisSound('blip');
  if (itemToEdit) {
    drawerTitle.innerHTML = '<span>// RECALIBRATE PROTOCOL</span>';
    itemIdInput.value = itemToEdit.id;
    appNameInput.value = itemToEdit.name;
    appPathInput.value = itemToEdit.path;
    temporaryPickedIcon = itemToEdit.iconData || null;
  } else {
    drawerTitle.innerHTML = '<span>// ENGAGE NEW PROTOCOL</span>';
    itemIdInput.value = '';
    appNameInput.value = '';
    appPathInput.value = '';
    temporaryPickedIcon = null;
  }
  drawer.classList.add('open');
  appNameInput.focus();
}

toggleAddBtn.addEventListener('click', () => {
  if (drawer.classList.contains('open')) {
    closeAllDrawers();
  } else {
    openAddDrawer();
  }
});

cancelBtn.addEventListener('click', closeAllDrawers);

browseBtn.addEventListener('click', async () => {
  if (window.dockAPI) {
    playJarvisSound('blip');
    const selected = await window.dockAPI.selectFile();
    if (selected) {
      appPathInput.value = selected.path;
      if (!appNameInput.value) {
        appNameInput.value = selected.name;
      }
      temporaryPickedIcon = selected.iconData;
    }
  }
});

shortcutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = itemIdInput.value;
  const name = appNameInput.value.trim();
  const path = appPathInput.value.trim();

  if (!name || !path) return;

  let iconData = temporaryPickedIcon;
  if (!iconData && window.dockAPI && !path.startsWith('http')) {
    iconData = await window.dockAPI.getFileIcon(path);
  }

  if (id) {
    const existing = shortcuts.find((s) => s.id === id);
    if (existing) {
      existing.name = name;
      existing.path = path;
      if (iconData) existing.iconData = iconData;
    }
    showToast('Protocol Recalibrated');
  } else {
    shortcuts.push({
      id: Date.now().toString(),
      name,
      path,
      iconData
    });
    showToast('Protocol Engaged');
  }

  if (window.dockAPI) {
    await window.dockAPI.saveShortcuts(shortcuts);
  }

  playJarvisSound('engage');
  renderShortcuts();
  closeAllDrawers();
});

// -------------------------------------------------------------
// Power Tool 1: YouTube Downloader & Video Search
// -------------------------------------------------------------
async function openYtdlDrawer() {
  closeAllDrawers();
  playJarvisSound('blip');
  ytdlDrawer.classList.add('open');

  if (window.dockAPI) {
    const status = await window.dockAPI.checkYtdlStatus();
    if (status && status.installed) {
      ytdlEngineBadge.textContent = 'CORE READY';
      ytdlEngineBadge.className = 'engine-badge ready';
      ytdlSetupBox.classList.add('hidden');
    } else {
      ytdlEngineBadge.textContent = 'CORE OFFLINE';
      ytdlEngineBadge.className = 'engine-badge missing';
      ytdlSetupBox.classList.remove('hidden');
    }
  }
  ytdlQueryInput.focus();
}

toolYtdlBtn.addEventListener('click', () => {
  if (ytdlDrawer.classList.contains('open')) {
    closeAllDrawers();
  } else {
    openYtdlDrawer();
  }
});

installEngineBtn.addEventListener('click', async () => {
  if (!window.dockAPI) return;
  installEngineBtn.disabled = true;
  installEngineBtn.textContent = 'DOWNLOADING YT-DLP CORE...';
  setupProgressBar.classList.remove('hidden');

  const res = await window.dockAPI.installYtdl();
  if (res && res.success) {
    ytdlEngineBadge.textContent = 'CORE READY';
    ytdlEngineBadge.className = 'engine-badge ready';
    ytdlSetupBox.classList.add('hidden');
    playJarvisSound('engage');
    showToast('J.A.R.V.I.S. Media Core online!');
  } else {
    installEngineBtn.disabled = false;
    installEngineBtn.textContent = 'RETRY CORE SETUP';
    showToast(`Setup failed: ${res.error || 'Network error'}`);
  }
});

ytdlFormatBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    playJarvisSound('blip');
    ytdlFormatBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDownloadFormat = btn.dataset.format;
  });
});

// Search & Preview YouTube Videos
ytdlSearchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = ytdlQueryInput.value.trim();
  if (!query || !window.dockAPI) return;

  searchMediaBtn.disabled = true;
  searchMediaBtn.textContent = 'SCANNING...';
  ytdlResultsList.innerHTML = `<div class="search-placeholder">Scanning frequency for "${escapeHtml(query)}"...</div>`;

  playJarvisSound('blip');
  const results = await window.dockAPI.searchYouTube(query);
  searchMediaBtn.disabled = false;
  searchMediaBtn.textContent = 'SCAN';

  renderSearchResults(results);
});

function renderSearchResults(results) {
  ytdlResultsList.innerHTML = '';
  if (!results || results.length === 0) {
    ytdlResultsList.innerHTML = '<div class="search-placeholder">No video streams identified. Verify connection or query.</div>';
    return;
  }

  results.forEach((video) => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
      <div class="video-thumb-wrapper">
        <img src="${video.thumbnail || 'https://via.placeholder.com/120x68?text=JARVIS'}" alt="${escapeHtml(video.title)}" />
        ${video.duration ? `<span class="video-duration-badge">${video.duration}</span>` : ''}
      </div>
      <div class="video-info">
        <div class="video-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</div>
        <div class="video-channel">${escapeHtml(video.channel)}</div>
      </div>
      <div class="video-download-icon" title="Extract Stream">⚡</div>
    `;

    card.addEventListener('click', () => {
      triggerDownload(video.url, video.title);
    });

    ytdlResultsList.appendChild(card);
  });
}

async function triggerDownload(url, title) {
  if (!window.dockAPI) return;

  playJarvisSound('engage');
  downloadProgressBox.classList.remove('hidden');
  downloadStatusText.textContent = `ACQUIRING: ${title.substring(0, 26)}...`;
  downloadProgressFill.style.width = '0%';
  downloadMetaText.textContent = 'Engaging media pipeline...';
  showToast(`Initiating ${selectedDownloadFormat.toUpperCase()} download...`);

  const res = await window.dockAPI.startMediaDownload({
    url,
    format: selectedDownloadFormat
  });

  if (res && !res.success) {
    downloadStatusText.textContent = 'TRANSMISSION FAULT';
    showToast(res.error || 'Failed to initialize download stream');
  }
}

openDownloadsBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    playJarvisSound('blip');
    window.dockAPI.openDownloadsFolder();
  }
});

// -------------------------------------------------------------
// Power Tool 2: Clipboard History (Data Buffer)
// -------------------------------------------------------------
async function openClipboardDrawer() {
  closeAllDrawers();
  playJarvisSound('blip');
  clipboardDrawer.classList.add('open');

  if (window.dockAPI) {
    clipboardCache = (await window.dockAPI.getClipboardHistory()) || [];
  }
  renderClipboardList();
  clipboardSearch.value = '';
  clipboardSearch.focus();
}

toolClipboardBtn.addEventListener('click', () => {
  if (clipboardDrawer.classList.contains('open')) {
    closeAllDrawers();
  } else {
    openClipboardDrawer();
  }
});

function renderClipboardList() {
  clipboardList.innerHTML = '';
  const filter = (clipboardSearch.value || '').toLowerCase().trim();
  const filtered = clipboardCache.filter((item) => item.text.toLowerCase().includes(filter));

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.color = 'var(--text-dim)';
    empty.style.fontSize = '9.5px';
    empty.style.textAlign = 'center';
    empty.style.padding = '24px 0';
    empty.textContent = filter ? 'No matching data buffers found' : 'Data buffer is currently cleared';
    clipboardList.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'clip-card';
    card.innerHTML = `
      <div class="clip-card-header">
        <span class="clip-time">${item.time}</span>
        <span class="clip-copy-tag">LOAD TO BUFFER</span>
      </div>
      <div class="clip-text">${escapeHtml(item.text)}</div>
    `;

    card.addEventListener('click', async () => {
      if (window.dockAPI) {
        playJarvisSound('engage');
        await window.dockAPI.copyToClipboard(item.text);
        showToast('Data Loaded to Active Clipboard');
      }
    });

    clipboardList.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

clipboardSearch.addEventListener('input', renderClipboardList);

clearClipboardBtn.addEventListener('click', async () => {
  if (window.dockAPI) {
    playJarvisSound('engage');
    await window.dockAPI.clearClipboardHistory();
    clipboardCache = [];
    renderClipboardList();
    showToast('Data Buffer Purged');
  }
});

// -------------------------------------------------------------
// Power Tool 3: Quick Scratchpad (Tactical Memory)
// -------------------------------------------------------------
async function openScratchpadDrawer() {
  closeAllDrawers();
  playJarvisSound('blip');
  scratchpadDrawer.classList.add('open');

  if (window.dockAPI) {
    const text = (await window.dockAPI.getScratchpad()) || '';
    scratchpadText.value = text;
    updateScratchpadCounter(text);
  }
  scratchpadText.focus();
}

toolScratchpadBtn.addEventListener('click', () => {
  if (scratchpadDrawer.classList.contains('open')) {
    closeAllDrawers();
  } else {
    openScratchpadDrawer();
  }
});

function updateScratchpadCounter(text) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  scratchpadCounter.textContent = `${chars} BYTES // ${words} TOKENS`;
}

scratchpadText.addEventListener('input', () => {
  const text = scratchpadText.value;
  updateScratchpadCounter(text);
  scratchpadSavedBadge.textContent = 'SYNCING...';

  clearTimeout(scratchpadSaveTimeout);
  scratchpadSaveTimeout = setTimeout(async () => {
    if (window.dockAPI) {
      await window.dockAPI.saveScratchpad(text);
      scratchpadSavedBadge.textContent = 'SYNCED';
    }
  }, 400);
});

copyScratchpadBtn.addEventListener('click', async () => {
  const text = scratchpadText.value;
  if (text && window.dockAPI) {
    playJarvisSound('engage');
    await window.dockAPI.copyToClipboard(text);
    showToast('Scratchpad Extracted to Clipboard');
  }
});

clearScratchpadBtn.addEventListener('click', async () => {
  scratchpadText.value = '';
  updateScratchpadCounter('');
  if (window.dockAPI) {
    playJarvisSound('engage');
    await window.dockAPI.saveScratchpad('');
    showToast('Scratchpad Memory Purged');
  }
});

// -------------------------------------------------------------
// Settings Drawer
// -------------------------------------------------------------
function openSettings() {
  closeAllDrawers();
  playJarvisSound('blip');
  settingsDrawer.classList.add('open');
}

openSettingsBtn.addEventListener('click', () => {
  if (settingsDrawer.classList.contains('open')) {
    closeAllDrawers();
  } else {
    openSettings();
  }
});

closeSettingsBtn.addEventListener('click', closeAllDrawers);

segmentBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    playJarvisSound('blip');
    currentSettings.dockPosition = btn.dataset.position;
    if (window.dockAPI) {
      await window.dockAPI.saveSettings(currentSettings);
    }
    applySettings(currentSettings);
    showToast(`HUD Anchored to ${currentSettings.dockPosition} Flank`);
  });
});

showLabelsSwitch.addEventListener('change', async (e) => {
  currentSettings.showLabels = e.target.checked;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  renderShortcuts();
  showToast(currentSettings.showLabels ? 'Protocol Labels Visible' : 'Protocol Labels Hidden');
});

saveHotkeyBtn.addEventListener('click', async () => {
  const hotkey = hotkeyInput.value.trim();
  if (hotkey && window.dockAPI) {
    const success = await window.dockAPI.updateHotkey(hotkey);
    if (success) {
      playJarvisSound('engage');
      currentSettings.hotkey = hotkey;
      showToast(`Activation Key Calibrated: ${hotkey}`);
    } else {
      showToast('Hotkey Conflict or Reserved');
    }
  }
});

launchBootSwitch.addEventListener('change', async (e) => {
  currentSettings.launchOnBoot = e.target.checked;
  if (window.dockAPI) {
    await window.dockAPI.setLoginItem(currentSettings.launchOnBoot);
  }
  showToast(currentSettings.launchOnBoot ? 'Auto-Boot Initialized' : 'Auto-Boot Deactivated');
});

autohideSwitch.addEventListener('change', async (e) => {
  currentSettings.autoHide = e.target.checked;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  applySettings(currentSettings);
  showToast(currentSettings.autoHide ? 'Cloaking Engaged' : 'Cloaking Disengaged');
});

toggleAutoHideBtn.addEventListener('click', async () => {
  currentSettings.autoHide = !currentSettings.autoHide;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  applySettings(currentSettings);
  showToast(currentSettings.autoHide ? 'Cloaking Engaged' : 'Cloaking Disengaged');
});

closeBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    window.dockAPI.hideWindow();
  }
});

init();