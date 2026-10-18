const SVG_ICONS = {
  code: `<svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
  web: `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-7l4 4-4 4-1.4-1.4L9.2 15l-2.6-2.6L8 11zm6 7h5v-2h-5v2z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
  default: `<svg viewBox="0 0 24 24"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>`
};

let shortcuts = [];
let currentSettings = {
  dockPosition: 'right',
  autoHide: false,
  hotkey: 'Alt+Space',
  launchOnBoot: true,
  accentColor: '#00f2fe'
};

let activeContextMenuTarget = null;
let draggedItemIndex = null;
let temporaryPickedIcon = null;
let selectedDownloadFormat = 'mp4';
let clipboardCache = [];
let scratchpadSaveTimeout = null;

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
const ytdlForm = document.getElementById('ytdl-form');
const ytdlUrlInput = document.getElementById('ytdl-url-input');
const ytdlFormatBtns = ytdlDrawer.querySelectorAll('.segmented-control .segment-btn');
const downloadProgressBox = document.getElementById('download-progress-box');
const downloadStatusText = document.getElementById('download-status-text');
const downloadProgressFill = document.getElementById('download-progress-fill');
const downloadMetaText = document.getElementById('download-meta-text');
const openDownloadsBtn = document.getElementById('open-downloads-btn');
const startDownloadBtn = document.getElementById('start-download-btn');

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
const colorDots = document.querySelectorAll('.color-dot');
const hotkeyInput = document.getElementById('hotkey-input');
const saveHotkeyBtn = document.getElementById('save-hotkey-btn');
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

async function init() {
  if (window.dockAPI) {
    shortcuts = (await window.dockAPI.getShortcuts()) || [];
    const savedSettings = await window.dockAPI.getSettings();
    if (savedSettings) currentSettings = { ...currentSettings, ...savedSettings };

    // Register Power Tool Listeners
    window.dockAPI.onClipboardUpdated((clips) => {
      clipboardCache = clips || [];
      renderClipboardList();
    });

    window.dockAPI.onDownloadProgress((prog) => {
      downloadProgressBox.classList.remove('hidden');
      downloadStatusText.textContent = `Downloading... ${prog.percent}%`;
      downloadProgressFill.style.width = `${prog.percent}%`;
      downloadMetaText.textContent = `${prog.percent}% • ${prog.speed || '--'} • ETA ${prog.eta || '--'}`;
    });

    window.dockAPI.onDownloadComplete((res) => {
      startDownloadBtn.disabled = false;
      startDownloadBtn.textContent = 'Download';
      if (res && res.success) {
        downloadStatusText.textContent = 'Download Complete!';
        downloadProgressFill.style.width = '100%';
        showToast('Download finished! Saved to Downloads folder');
      } else {
        downloadStatusText.textContent = 'Download Failed';
        showToast(`Download failed: ${res.error || 'Check URL'}`);
      }
    });

    window.dockAPI.onSetupProgress((data) => {
      setupProgressBar.classList.remove('hidden');
      setupProgressFill.style.width = `${data.percent}%`;
      installEngineBtn.textContent = `Setting up engine... ${data.percent}%`;
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
  // 1. Accent Color
  if (settings.accentColor) {
    document.documentElement.style.setProperty('--accent', settings.accentColor);
    const hex = settings.accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 242;
    const b = parseInt(hex.substring(4, 6), 16) || 254;
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.4)`);
    document.documentElement.style.setProperty('--border-color', `rgba(${r}, ${g}, ${b}, 0.22)`);

    colorDots.forEach((dot) => {
      dot.classList.toggle('active', dot.dataset.color.toLowerCase() === settings.accentColor.toLowerCase());
    });
  }

  // 2. Dock Position
  if (settings.dockPosition === 'left') {
    bodyEl.classList.add('dock-left');
  } else {
    bodyEl.classList.remove('dock-left');
  }
  segmentBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.position === settings.dockPosition);
  });

  // 3. Auto-Hide state
  if (settings.autoHide) {
    bodyEl.classList.add('autohide-active');
    toggleAutoHideBtn.classList.add('active');
    toggleAutoHideBtn.title = 'Auto-Hide: Enabled (Click to Pin)';
    autohideSwitch.checked = true;
  } else {
    bodyEl.classList.remove('autohide-active');
    rail.classList.remove('peek-hidden');
    toggleAutoHideBtn.classList.remove('active');
    toggleAutoHideBtn.title = 'Auto-Hide: Disabled (Click to Enable)';
    autohideSwitch.checked = false;
  }

  // 4. Hotkey
  if (settings.hotkey) {
    hotkeyInput.value = settings.hotkey;
  }

  // 5. Startup Launch
  launchBootSwitch.checked = Boolean(settings.launchOnBoot);
}

// Window expansion management
function checkWindowExpansion() {
  const isAnyDrawerOpen = allDrawers.some((d) => d.classList.contains('open'));
  const isContextMenuOpen = contextMenu.classList.contains('visible');
  const isHovered = rail.matches(':hover');

  const shouldExpand = isAnyDrawerOpen || isContextMenuOpen || isHovered;
  if (window.dockAPI) {
    window.dockAPI.setExpanded(shouldExpand);
  }
}

function closeAllDrawers() {
  allDrawers.forEach((d) => d.classList.remove('open'));
  temporaryPickedIcon = null;
  checkWindowExpansion();
}

rail.addEventListener('mouseenter', () => {
  if (currentSettings.autoHide) {
    rail.classList.remove('peek-hidden');
  }
  checkWindowExpansion();
});

rail.addEventListener('mouseleave', () => {
  const isAnyDrawerOpen = allDrawers.some((d) => d.classList.contains('open'));
  if (currentSettings.autoHide && !isAnyDrawerOpen) {
    rail.classList.add('peek-hidden');
  }
  checkWindowExpansion();
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

function renderShortcuts() {
  listContainer.innerHTML = '';

  shortcuts.forEach((item, index) => {
    const tile = document.createElement('div');
    tile.className = 'cyber-tile';
    tile.setAttribute('data-title', item.name);
    tile.setAttribute('draggable', 'true');
    tile.dataset.index = index;

    const iconEl = getIconElement(item);
    tile.appendChild(iconEl);

    tile.addEventListener('click', async () => {
      if (window.dockAPI) {
        const result = await window.dockAPI.launchTarget(item.path);
        if (result && !result.success) {
          showToast(`Launch failed: ${result.error || 'Not found'}`);
        }
      }
    });

    tile.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, item);
    });

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
        if (draggedItemIndex < targetIndex) {
          targetIndex--;
        }
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
    showToast('Shortcut pinned');
  }
});

// Context Menu Management
function showContextMenu(x, y, item) {
  activeContextMenuTarget = item;
  contextMenu.style.top = `${Math.min(y, window.innerHeight - 150)}px`;
  if (currentSettings.dockPosition === 'left') {
    contextMenu.style.left = '76px';
    contextMenu.style.right = 'auto';
  } else {
    contextMenu.style.right = '76px';
    contextMenu.style.left = 'auto';
  }
  contextMenu.classList.add('visible');
  checkWindowExpansion();

  if (item.path.startsWith('http')) {
    ctxReveal.style.display = 'none';
  } else {
    ctxReveal.style.display = 'flex';
  }
}

function hideContextMenu() {
  contextMenu.classList.remove('visible');
  activeContextMenuTarget = null;
  checkWindowExpansion();
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
    const res = await window.dockAPI.launchTarget(activeContextMenuTarget.path);
    if (res && !res.success) {
      showToast(`Launch failed: ${res.error || 'Unknown error'}`);
    }
  }
  hideContextMenu();
});

ctxReveal.addEventListener('click', async () => {
  if (activeContextMenuTarget && window.dockAPI) {
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
    showToast('Shortcut removed');
  }
  hideContextMenu();
});

// Add/Edit Drawer
function openAddDrawer(itemToEdit = null) {
  closeAllDrawers();
  if (itemToEdit) {
    drawerTitle.textContent = 'Edit Shortcut';
    itemIdInput.value = itemToEdit.id;
    appNameInput.value = itemToEdit.name;
    appPathInput.value = itemToEdit.path;
    temporaryPickedIcon = itemToEdit.iconData || null;
  } else {
    drawerTitle.textContent = 'Add Shortcut';
    itemIdInput.value = '';
    appNameInput.value = '';
    appPathInput.value = '';
    temporaryPickedIcon = null;
  }
  drawer.classList.add('open');
  checkWindowExpansion();
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
    showToast('Shortcut updated');
  } else {
    shortcuts.push({
      id: Date.now().toString(),
      name,
      path,
      iconData
    });
    showToast('Shortcut added');
  }

  if (window.dockAPI) {
    await window.dockAPI.saveShortcuts(shortcuts);
  }

  renderShortcuts();
  closeAllDrawers();
});

// -------------------------------------------------------------
// Power Tool 1: YouTube / Media Downloader
// -------------------------------------------------------------
async function openYtdlDrawer() {
  closeAllDrawers();
  ytdlDrawer.classList.add('open');
  checkWindowExpansion();

  if (window.dockAPI) {
    const status = await window.dockAPI.checkYtdlStatus();
    if (status && status.installed) {
      ytdlEngineBadge.textContent = 'Engine Ready';
      ytdlEngineBadge.className = 'engine-badge ready';
      ytdlSetupBox.classList.add('hidden');
    } else {
      ytdlEngineBadge.textContent = 'Setup Required';
      ytdlEngineBadge.className = 'engine-badge missing';
      ytdlSetupBox.classList.remove('hidden');
    }
  }
  ytdlUrlInput.focus();
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
  installEngineBtn.textContent = 'Downloading yt-dlp.exe...';
  setupProgressBar.classList.remove('hidden');

  const res = await window.dockAPI.installYtdl();
  if (res && res.success) {
    ytdlEngineBadge.textContent = 'Engine Ready';
    ytdlEngineBadge.className = 'engine-badge ready';
    ytdlSetupBox.classList.add('hidden');
    showToast('Media engine installed successfully!');
  } else {
    installEngineBtn.disabled = false;
    installEngineBtn.textContent = 'Retry Setup';
    showToast(`Setup failed: ${res.error || 'Network error'}`);
  }
});

ytdlFormatBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    ytdlFormatBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDownloadFormat = btn.dataset.format;
  });
});

ytdlForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = ytdlUrlInput.value.trim();
  if (!url || !window.dockAPI) return;

  startDownloadBtn.disabled = true;
  startDownloadBtn.textContent = 'Starting...';
  downloadProgressBox.classList.remove('hidden');
  downloadStatusText.textContent = 'Connecting to stream...';
  downloadProgressFill.style.width = '0%';
  downloadMetaText.textContent = 'Initializing stream analyzer...';

  const res = await window.dockAPI.startMediaDownload({
    url,
    format: selectedDownloadFormat
  });

  if (res && !res.success) {
    startDownloadBtn.disabled = false;
    startDownloadBtn.textContent = 'Download';
    downloadStatusText.textContent = 'Failed to start';
    showToast(res.error || 'Download start error');
  }
});

openDownloadsBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    window.dockAPI.openDownloadsFolder();
  }
});

// -------------------------------------------------------------
// Power Tool 2: Clipboard History
// -------------------------------------------------------------
async function openClipboardDrawer() {
  closeAllDrawers();
  clipboardDrawer.classList.add('open');
  checkWindowExpansion();

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
    empty.style.fontSize = '10px';
    empty.style.textAlign = 'center';
    empty.style.padding = '20px 0';
    empty.textContent = filter ? 'No matching clips found' : 'Clipboard history is empty';
    clipboardList.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'clip-card';
    card.innerHTML = `
      <div class="clip-card-header">
        <span class="clip-time">${item.time}</span>
        <span class="clip-copy-tag">Click to Copy</span>
      </div>
      <div class="clip-text">${escapeHtml(item.text)}</div>
    `;

    card.addEventListener('click', async () => {
      if (window.dockAPI) {
        await window.dockAPI.copyToClipboard(item.text);
        showToast('Copied to clipboard!');
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
    await window.dockAPI.clearClipboardHistory();
    clipboardCache = [];
    renderClipboardList();
    showToast('Clipboard history cleared');
  }
});

// -------------------------------------------------------------
// Power Tool 3: Quick Scratchpad
// -------------------------------------------------------------
async function openScratchpadDrawer() {
  closeAllDrawers();
  scratchpadDrawer.classList.add('open');
  checkWindowExpansion();

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
  scratchpadCounter.textContent = `${chars} chars • ${words} words`;
}

scratchpadText.addEventListener('input', () => {
  const text = scratchpadText.value;
  updateScratchpadCounter(text);
  scratchpadSavedBadge.textContent = 'Saving...';

  clearTimeout(scratchpadSaveTimeout);
  scratchpadSaveTimeout = setTimeout(async () => {
    if (window.dockAPI) {
      await window.dockAPI.saveScratchpad(text);
      scratchpadSavedBadge.textContent = 'Saved';
    }
  }, 400);
});

copyScratchpadBtn.addEventListener('click', async () => {
  const text = scratchpadText.value;
  if (text && window.dockAPI) {
    await window.dockAPI.copyToClipboard(text);
    showToast('Scratchpad copied to clipboard!');
  }
});

clearScratchpadBtn.addEventListener('click', async () => {
  scratchpadText.value = '';
  updateScratchpadCounter('');
  if (window.dockAPI) {
    await window.dockAPI.saveScratchpad('');
    showToast('Scratchpad cleared');
  }
});

// -------------------------------------------------------------
// Preferences Drawer
// -------------------------------------------------------------
function openSettings() {
  closeAllDrawers();
  settingsDrawer.classList.add('open');
  checkWindowExpansion();
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
    currentSettings.dockPosition = btn.dataset.position;
    if (window.dockAPI) {
      await window.dockAPI.saveSettings(currentSettings);
    }
    applySettings(currentSettings);
    showToast(`Dock moved to ${currentSettings.dockPosition} edge`);
  });
});

colorDots.forEach((dot) => {
  dot.addEventListener('click', async () => {
    currentSettings.accentColor = dot.dataset.color;
    if (window.dockAPI) {
      await window.dockAPI.saveSettings(currentSettings);
    }
    applySettings(currentSettings);
    showToast('Theme accent applied');
  });
});

saveHotkeyBtn.addEventListener('click', async () => {
  const hotkey = hotkeyInput.value.trim();
  if (hotkey && window.dockAPI) {
    const success = await window.dockAPI.updateHotkey(hotkey);
    if (success) {
      currentSettings.hotkey = hotkey;
      showToast(`Hotkey set to ${hotkey}`);
    } else {
      showToast('Hotkey invalid or reserved');
    }
  }
});

launchBootSwitch.addEventListener('change', async (e) => {
  currentSettings.launchOnBoot = e.target.checked;
  if (window.dockAPI) {
    await window.dockAPI.setLoginItem(currentSettings.launchOnBoot);
  }
  showToast(currentSettings.launchOnBoot ? 'Auto-Launch on Boot enabled' : 'Auto-Launch on Boot disabled');
});

autohideSwitch.addEventListener('change', async (e) => {
  currentSettings.autoHide = e.target.checked;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  applySettings(currentSettings);
  showToast(currentSettings.autoHide ? 'Auto-Hide Enabled' : 'Dock Pinned');
});

toggleAutoHideBtn.addEventListener('click', async () => {
  currentSettings.autoHide = !currentSettings.autoHide;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  applySettings(currentSettings);
  showToast(currentSettings.autoHide ? 'Auto-Hide Enabled' : 'Dock Pinned');
});

closeBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    window.dockAPI.hideWindow();
  }
});

init();