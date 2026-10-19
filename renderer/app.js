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

function playJarvisTone(freq = 1400, duration = 0.04) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq + 70, now + duration);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {}
}

let shortcuts = [];
let currentSettings = {
  dockPosition: 'right',
  autoHide: false,
  hotkey: 'Alt+Space',
  quickHotkey: 'Alt+Q',
  launchOnBoot: true,
  showLabels: true,
  hudBlur: 26,
  hudOpacity: 65
};

let activeContextMenuTarget = null;
let draggedItemIndex = null;
let temporaryPickedIcon = null;
let selectedDownloadFormat = 'mp4';
let clipboardCache = [];
let scratchpadSaveTimeout = null;
let isCapturingMouse = true;
let currentQuickText = '';

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
const toolPodsBtn = document.getElementById('tool-pods-btn');
const toolWindowsBtn = document.getElementById('tool-windows-btn');
const toolCaptureBtn = document.getElementById('tool-capture-btn');

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
const quickHotkeyInput = document.getElementById('quick-hotkey-input');
const saveQuickHotkeyBtn = document.getElementById('save-quick-hotkey-btn');
const showLabelsSwitch = document.getElementById('show-labels-switch');
const launchBootSwitch = document.getElementById('launch-boot-switch');
const autohideSwitch = document.getElementById('autohide-switch');
const closeSettingsBtn = document.getElementById('close-settings-btn');

// Holographic Optics & Visibility Controls
const blurSlider = document.getElementById('blur-slider');
const blurValTag = document.getElementById('blur-val-tag');
const opacitySlider = document.getElementById('opacity-slider');
const opacityValTag = document.getElementById('opacity-val-tag');
const opticsPresetBtns = document.querySelectorAll('#optics-presets .segment-btn');

// Tactical Window Grid Manager
const windowsDrawer = document.getElementById('windows-drawer');
const closeWindowsBtn = document.getElementById('close-windows-btn');
const gridCardBtns = document.querySelectorAll('.grid-card-btn');

// File & Media Converter Lab
const mediaDrawer = document.getElementById('media-drawer');
const closeMediaBtn = document.getElementById('close-media-btn');
const mediaDropZone = document.getElementById('media-drop-zone');
const mediaPreviewBox = document.getElementById('media-preview-box');
const mediaPreviewImg = document.getElementById('media-preview-img');
const mediaFileMeta = document.getElementById('media-file-meta');
const mediaFormatBtns = document.querySelectorAll('#media-format-segmented .segment-btn');
const mediaConvertBtn = document.getElementById('media-convert-btn');
const quickScreenshotBtn = document.getElementById('quick-screenshot-btn');

let activeMediaConvertFormat = 'webp';
let currentLoadedImage = null; // { file, dataUrl, width, height, size }

// J.A.R.V.I.S. Holographic Drop Pods
const hologramPodsDrawer = document.getElementById('hologram-pods-drawer');
const closePodsBtn = document.getElementById('close-pods-btn');
const podsPreviewText = document.getElementById('pods-preview-text');
const podsFootStatus = document.getElementById('pods-foot-status');
const dropPods = document.querySelectorAll('.drop-pod');

// Context Menu & Toast
const contextMenu = document.getElementById('context-menu');
const ctxLaunch = document.getElementById('ctx-launch');
const ctxReveal = document.getElementById('ctx-reveal');
const ctxEdit = document.getElementById('ctx-edit');
const ctxDelete = document.getElementById('ctx-delete');
const toastEl = document.getElementById('toast');

const allDrawers = [drawer, settingsDrawer, ytdlDrawer, clipboardDrawer, scratchpadDrawer, windowsDrawer, mediaDrawer, hologramPodsDrawer];

// -------------------------------------------------------------
// Mouse Event Forwarding (Permanent fix for hover glitch)
// -------------------------------------------------------------
window.addEventListener('mousemove', (e) => {
  const isAnyDrawerOpen = allDrawers.some((d) => d.classList.contains('open'));
  const overRail = rail.contains(e.target);
  const overDrawer = allDrawers.some((d) => d.classList.contains('open') && d.contains(e.target));
  const overCtx = contextMenu.classList.contains('visible') && contextMenu.contains(e.target);

  // If ANY drawer is open, keep capturing mouse over the entire drawer + rail area (380px)
  const overActiveArea = isAnyDrawerOpen && (
    currentSettings.dockPosition === 'left' ? e.clientX <= 380 : e.clientX >= (window.innerWidth - 380)
  );

  const shouldCapture = overRail || overDrawer || overCtx || overActiveArea;
  if (shouldCapture !== isCapturingMouse) {
    isCapturingMouse = shouldCapture;
    if (window.dockAPI) {
      window.dockAPI.setIgnoreMouse(!shouldCapture);
    }
  }
});

// Dismiss drawers when clicking in the dock outside any open drawer
window.addEventListener('mousedown', (e) => {
  const isAnyDrawerOpen = allDrawers.some((d) => d.classList.contains('open'));
  const overDrawer = allDrawers.some((d) => d.classList.contains('open') && d.contains(e.target));
  const overCtx = contextMenu.classList.contains('visible') && contextMenu.contains(e.target);
  const overInteractiveBtn = e.target.closest('.hud-action-btn') || e.target.closest('.tool-btn') || e.target.closest('.cyber-tile');

  if (isAnyDrawerOpen && !overDrawer && !overInteractiveBtn) {
    closeAllDrawers();
  }
  if (!overCtx) {
    contextMenu.classList.remove('visible');
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

    window.dockAPI.onSummonQuickAction((text) => {
      toggleHologramPods(text);
    });

    // When clicking outside the sidebar into other windows, close sub-drawers while dock stays pinned
    if (window.dockAPI.onWindowBlur) {
      window.dockAPI.onWindowBlur(() => {
        closeAllDrawers();
        if (contextMenu) contextMenu.classList.remove('visible');
        if (currentSettings.autoHide) {
          rail.classList.add('peek-hidden');
        }
      });
    }
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
  if (settings.quickHotkey && quickHotkeyInput) {
    quickHotkeyInput.value = settings.quickHotkey;
  }

  // 4. Show Labels
  showLabelsSwitch.checked = settings.showLabels !== false;

  // 5. Startup Launch
  launchBootSwitch.checked = Boolean(settings.launchOnBoot);

  // 6. Holographic Optics (Backdrop Blur & Tint Density)
  const blurVal = settings.hudBlur !== undefined ? Number(settings.hudBlur) : 26;
  const opacityVal = settings.hudOpacity !== undefined ? Number(settings.hudOpacity) : 75;
  const frac = (opacityVal / 100).toFixed(2);
  document.documentElement.style.setProperty('--hud-blur', `${blurVal}px`);
  document.documentElement.style.setProperty('--hud-tint-opacity', frac);
  document.documentElement.style.setProperty('--hud-bg-color', `rgba(2, 12, 28, ${frac})`);

  if (blurSlider) blurSlider.value = blurVal;
  if (blurValTag) blurValTag.textContent = `${blurVal}px`;
  if (opacitySlider) opacitySlider.value = opacityVal;
  if (opacityValTag) opacityValTag.textContent = `${opacityVal}%`;
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
  const isInsideAnyDrawer = allDrawers.some((d) => d && d.contains(e.target));
  const isInsideRail = rail && rail.contains(e.target);
  if (!isInsideAnyDrawer && !isInsideRail) {
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
      await window.dockAPI.saveSettings(currentSettings);
      showToast(`Activation Key Calibrated: ${hotkey}`);
    } else {
      showToast('Hotkey Conflict or Reserved');
    }
  }
});

saveQuickHotkeyBtn.addEventListener('click', async () => {
  const quickHotkey = quickHotkeyInput.value.trim();
  if (quickHotkey && window.dockAPI) {
    const success = await window.dockAPI.updateQuickHotkey(quickHotkey);
    if (success) {
      playJarvisSound('engage');
      currentSettings.quickHotkey = quickHotkey;
      await window.dockAPI.saveSettings(currentSettings);
      showToast(`Quick Action Key Calibrated: ${quickHotkey}`);
    } else {
      showToast('Quick Hotkey Conflict or Reserved');
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

// Holographic Optics & Visibility Adjusters
if (blurSlider) {
  blurSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    document.documentElement.style.setProperty('--hud-blur', `${val}px`);
    if (blurValTag) blurValTag.textContent = `${val}px`;
    currentSettings.hudBlur = val;
  });

  blurSlider.addEventListener('change', async () => {
    if (window.dockAPI) {
      await window.dockAPI.saveSettings(currentSettings);
    }
  });
}

if (opacitySlider) {
  opacitySlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    const frac = (val / 100).toFixed(2);
    document.documentElement.style.setProperty('--hud-tint-opacity', frac);
    document.documentElement.style.setProperty('--hud-bg-color', `rgba(2, 12, 28, ${frac})`);
    if (opacityValTag) opacityValTag.textContent = `${val}%`;
    currentSettings.hudOpacity = val;
  });

  opacitySlider.addEventListener('change', async () => {
    if (window.dockAPI) {
      await window.dockAPI.saveSettings(currentSettings);
    }
  });
}

if (opticsPresetBtns && opticsPresetBtns.length > 0) {
  opticsPresetBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      opticsPresetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.dataset.preset;
      if (preset === 'crystal') {
        currentSettings.hudBlur = 10;
        currentSettings.hudOpacity = 35;
      } else if (preset === 'contrast') {
        currentSettings.hudBlur = 38;
        currentSettings.hudOpacity = 90;
      } else {
        // balanced
        currentSettings.hudBlur = 26;
        currentSettings.hudOpacity = 65;
      }
      applySettings(currentSettings);
      if (window.dockAPI) {
        await window.dockAPI.saveSettings(currentSettings);
      }
      showToast(`Optics Calibrated: ${preset.toUpperCase()}`);
    });
  });
}

closeBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    window.dockAPI.hideWindow();
  }
});

// -------------------------------------------------------------
// J.A.R.V.I.S. Holographic Drop Pods (Zero-Friction Ingestion)
// -------------------------------------------------------------
const POD_FREQUENCIES = {
  scratchpad: 1400,
  clipboard: 1550,
  media: 1650,
  youtube: 1750,
  weblink: 1850,
  voice: 2000
};

function openHologramPods(text = '') {
  currentQuickText = (text || '').trim();
  closeAllDrawers();

  if (currentQuickText) {
    const previewSnip = currentQuickText.length > 38 ? currentQuickText.slice(0, 38) + '...' : currentQuickText;
    podsPreviewText.textContent = previewSnip;
    podsPreviewText.title = currentQuickText;
  } else {
    podsPreviewText.textContent = 'AWAITING PAYLOAD // DROP TEXT DIRECTLY INTO A POD';
    podsPreviewText.title = '';
  }

  // Contextualize Web Pod label if payload is a URL
  const isUrl = /^https?:\/\//i.test(currentQuickText);
  const webPod = document.querySelector('.drop-pod[data-action="weblink"]');
  if (webPod) {
    const titleEl = webPod.querySelector('.pod-title');
    const subEl = webPod.querySelector('.pod-sub');
    if (titleEl) titleEl.textContent = isUrl ? 'OPEN WEB LINK' : 'WEB / LINK SEARCH';
    if (subEl) subEl.textContent = isUrl ? 'DROP TO BROWSE DIRECTLY' : 'DROP TO OPEN URL OR QUERY GOOGLE';
  }

  podsFootStatus.textContent = 'READY // RELEASE ANY TEXT DIRECTLY INTO A POD';
  hologramPodsDrawer.classList.add('open');
  playJarvisSound('engage');
  showToast('J.A.R.V.I.S. Drop Pods Armed');

  if (window.dockAPI) {
    window.dockAPI.setIgnoreMouse(false);
  }
}

function closeHologramPods() {
  hologramPodsDrawer.classList.remove('open');
  dropPods.forEach((pod) => pod.classList.remove('drag-over'));
}

async function toggleHologramPods(text = '') {
  if (hologramPodsDrawer.classList.contains('open')) {
    closeHologramPods();
    playJarvisSound('blip');
    showToast('Hologram Conduit Disengaged');
  } else {
    let payload = (text || currentQuickText || '').trim();
    if (!payload && window.dockAPI) {
      const history = await window.dockAPI.getClipboardHistory();
      if (history && history.length > 0) {
        payload = (history[0] || '').trim();
      }
    }
    openHologramPods(payload);
  }
}

async function executePodAction(action, payloadText = currentQuickText) {
  let text = (payloadText || currentQuickText || '').trim();

  // If text is still empty, attempt to read from system clipboard
  if (!text && window.dockAPI) {
    const history = await window.dockAPI.getClipboardHistory();
    if (history && history.length > 0) {
      text = (history[0] || '').trim();
    }
  }

  if (!text) {
    showToast('Buffer empty - Copy or drag text to engage');
    closeHologramPods();
    return;
  }

  playJarvisSound('engage');

  switch (action) {
    case 'scratchpad': {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const entry = `\n// [J.A.R.V.I.S. Ingested @ ${timeStr}]\n${text}\n`;
      scratchpadText.value = (scratchpadText.value ? scratchpadText.value + '\n' : '') + entry;
      updateScratchpadCounter(scratchpadText.value);
      if (window.dockAPI) {
        await window.dockAPI.saveScratchpad(scratchpadText.value);
      }
      showToast('Transferred to Tactical Scratchpad');
      break;
    }

    case 'clipboard': {
      if (window.dockAPI) {
        await window.dockAPI.copyToClipboard(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      showToast('Buffered to Memory & Clipboard');
      break;
    }

    case 'media': {
      closeHologramPods();
      openMediaDrawer();
      showToast('File & Media Lab Activated');
      return;
    }

    case 'youtube': {
      closeHologramPods();
      await openYtdlDrawer();
      ytdlQueryInput.value = text;
      ytdlSearchForm.dispatchEvent(new Event('submit'));
      showToast('Media Stream Acquisition Engaged');
      return;
    }

    case 'weblink': {
      let target = text;
      if (!/^https?:\/\//i.test(target)) {
        target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
      }
      if (window.dockAPI) {
        window.dockAPI.launchTarget(target);
      } else {
        window.open(target, '_blank');
      }
      showToast('Deploying Navigation Protocol...');
      break;
    }

    case 'voice': {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const snippet = text.slice(0, 320);
        const utter = new SpeechSynthesisUtterance(snippet);
        const voices = window.speechSynthesis.getVoices();
        const jarvisVoice = voices.find((v) =>
          v.lang.includes('en-GB') ||
          v.name.toLowerCase().includes('george') ||
          v.name.toLowerCase().includes('hazel') ||
          v.name.toLowerCase().includes('david') ||
          v.lang.includes('en-US')
        );
        if (jarvisVoice) utter.voice = jarvisVoice;
        utter.rate = 1.05;
        utter.pitch = 0.95;
        window.speechSynthesis.speak(utter);
        showToast('J.A.R.V.I.S. Vocal Readout Engaged');
      }
      break;
    }
  }

  closeHologramPods();
}

// -------------------------------------------------------------
// Drag & Drop + Key Press Toggle Ingestion Conduit
// -------------------------------------------------------------
let lastShiftPressed = false;
let userToggledOffDuringDrag = false;

window.addEventListener('dragstart', () => {
  userToggledOffDuringDrag = false;
  lastShiftPressed = false;
});

window.addEventListener('dragend', () => {
  userToggledOffDuringDrag = false;
  lastShiftPressed = false;
});

window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  if (!userToggledOffDuringDrag && !hologramPodsDrawer.classList.contains('open')) {
    openHologramPods(currentQuickText || window.getSelection().toString() || '');
  }
});

window.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }

  // Tapping Shift while dragging toggles hologram ON / OFF
  if (e.shiftKey !== lastShiftPressed) {
    lastShiftPressed = e.shiftKey;
    if (e.shiftKey) {
      if (hologramPodsDrawer.classList.contains('open')) {
        userToggledOffDuringDrag = true;
        toggleHologramPods();
      } else {
        userToggledOffDuringDrag = false;
        toggleHologramPods(currentQuickText || window.getSelection().toString() || '');
      }
    }
  } else if (!userToggledOffDuringDrag && !hologramPodsDrawer.classList.contains('open')) {
    openHologramPods(currentQuickText || window.getSelection().toString() || '');
  }
});

window.addEventListener('dragleave', (e) => {
  if (!e.relatedTarget && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
    closeHologramPods();
    userToggledOffDuringDrag = false;
    lastShiftPressed = false;
  }
});

window.addEventListener('drop', (e) => {
  e.preventDefault();
  userToggledOffDuringDrag = false;
  lastShiftPressed = false;
  // If not dropped directly on a pod, gracefully close
  if (!e.target.closest('.drop-pod')) {
    closeHologramPods();
  }
});

// Attach listeners to individual drop pods
dropPods.forEach((pod) => {
  const action = pod.dataset.action;
  const freq = POD_FREQUENCIES[action] || 1500;

  pod.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropPods.forEach((p) => p.classList.remove('drag-over'));
    pod.classList.add('drag-over');
    playJarvisTone(freq);
    podsFootStatus.textContent = `TARGET LOCKED: [${action.toUpperCase()}] // RELEASE TO ENGAGE`;
  });

  pod.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    if (!pod.classList.contains('drag-over')) {
      dropPods.forEach((p) => p.classList.remove('drag-over'));
      pod.classList.add('drag-over');
      playJarvisTone(freq);
    }
  });

  pod.addEventListener('dragleave', (e) => {
    e.stopPropagation();
    pod.classList.remove('drag-over');
    podsFootStatus.textContent = 'READY // RELEASE ANY TEXT DIRECTLY INTO A POD';
  });

  pod.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pod.classList.remove('drag-over');

    // Check if image or file was dropped directly on pod
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (action === 'media' || file.type.startsWith('image/')) {
        closeHologramPods();
        openMediaDrawer(file);
        return;
      }
    }

    let droppedText = '';
    if (e.dataTransfer) {
      droppedText = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text') || e.dataTransfer.getData('text/uri-list') || '';
    }
    if (!droppedText) {
      droppedText = currentQuickText;
    }

    executePodAction(action, droppedText);
  });

  // Direct Click Support: lets users click a pod to act on latest clipboard/preview text
  pod.addEventListener('click', () => {
    executePodAction(action, currentQuickText);
  });
});

closePodsBtn.addEventListener('click', closeHologramPods);

toolPodsBtn.addEventListener('click', () => {
  toggleHologramPods();
});

// -------------------------------------------------------------
// Tactical Window Grid Manager Logic
// -------------------------------------------------------------
function openWindowsDrawer() {
  closeAllDrawers();
  windowsDrawer.classList.add('open');
  playJarvisSound('engage');
  showToast('Tactical Window Grids Online');
  if (window.dockAPI) window.dockAPI.setIgnoreMouse(false);
}

function closeWindowsDrawer() {
  windowsDrawer.classList.remove('open');
}

toolWindowsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (windowsDrawer.classList.contains('open')) {
    closeWindowsDrawer();
  } else {
    openWindowsDrawer();
  }
});

closeWindowsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeWindowsDrawer();
});

gridCardBtns.forEach((btn) => {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const snapAction = btn.dataset.snap;
    playJarvisSound('engage');
    showToast(`Calibrating Grid: ${snapAction.toUpperCase()}...`);
    closeWindowsDrawer();
    if (window.dockAPI) {
      await window.dockAPI.snapWindow(snapAction);
    }
  });
});

// -------------------------------------------------------------
// Instant HUD Screen Capture
// -------------------------------------------------------------
async function triggerScreenCapture() {
  playJarvisSound('engage');
  showToast('Scanning Display Array...');
  if (window.dockAPI) {
    const res = await window.dockAPI.captureScreen();
    if (res && res.success) {
      playJarvisTone(1800, 0.08);
      showToast('HUD Screen Captured & Buffered to Clipboard');
    } else {
      showToast(`Capture Aborted: ${res ? res.error : 'Unknown'}`);
    }
  }
}

toolCaptureBtn.addEventListener('click', triggerScreenCapture);
quickScreenshotBtn.addEventListener('click', triggerScreenCapture);

// -------------------------------------------------------------
// File & Media Converter Lab Logic
// -------------------------------------------------------------
function openMediaDrawer(preloadedFile = null) {
  closeAllDrawers();
  mediaDrawer.classList.add('open');
  playJarvisSound('engage');
  if (window.dockAPI) window.dockAPI.setIgnoreMouse(false);

  if (preloadedFile) {
    loadMediaFile(preloadedFile);
  }
}

function closeMediaDrawer() {
  mediaDrawer.classList.remove('open');
}

closeMediaBtn.addEventListener('click', closeMediaDrawer);

mediaFormatBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    mediaFormatBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeMediaConvertFormat = btn.dataset.fmt || 'webp';
    playJarvisSound('blip');
  });
});

function loadMediaFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Invalid format: Please provide an image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      currentLoadedImage = {
        name: file.name,
        type: file.type,
        dataUrl,
        width: img.width,
        height: img.height,
        size: file.size
      };
      mediaPreviewImg.src = dataUrl;
      const sizeKB = (file.size / 1024).toFixed(1);
      mediaFileMeta.textContent = `SOURCE: ${file.name} • ${img.width}x${img.height} • ${sizeKB} KB`;
      mediaPreviewBox.classList.remove('hidden');
      playJarvisSound('blip');
      showToast('Image Loaded into Media Lab');
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

mediaDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  mediaDropZone.classList.add('drag-active');
});

mediaDropZone.addEventListener('dragleave', () => {
  mediaDropZone.classList.remove('drag-active');
});

mediaDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  mediaDropZone.classList.remove('drag-active');
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    loadMediaFile(e.dataTransfer.files[0]);
  }
});

mediaDropZone.addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      loadMediaFile(e.target.files[0]);
    }
  };
  fileInput.click();
});

mediaConvertBtn.addEventListener('click', async () => {
  if (!currentLoadedImage) {
    showToast('No active image in buffer');
    return;
  }

  playJarvisSound('engage');
  showToast(`Transcoding to ${activeMediaConvertFormat.toUpperCase()}...`);

  const img = new Image();
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const mimeType = activeMediaConvertFormat === 'jpeg' ? 'image/jpeg' : `image/${activeMediaConvertFormat}`;
    const quality = activeMediaConvertFormat === 'png' ? 1.0 : 0.88;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    const base64Data = dataUrl.split(',')[1];

    const baseName = currentLoadedImage.name.replace(/\.[^/.]+$/, '');
    const outFilename = `${baseName}_${activeMediaConvertFormat}.${activeMediaConvertFormat === 'jpeg' ? 'jpg' : activeMediaConvertFormat}`;

    if (window.dockAPI) {
      const res = await window.dockAPI.saveConvertedImage({
        base64Data,
        format: activeMediaConvertFormat === 'jpeg' ? 'jpg' : activeMediaConvertFormat,
        filename: outFilename
      });
      if (res && res.success) {
        playJarvisTone(1900, 0.08);
        showToast(`Saved & Buffered: ${outFilename}`);
        closeMediaDrawer();
      } else {
        showToast(`Transcode failed: ${res ? res.error : 'Unknown'}`);
      }
    }
  };
  img.src = currentLoadedImage.dataUrl;
});

// Accelerator Matcher Helper
function isMatchingHotkey(e, hotkeyStr) {
  if (!hotkeyStr) return false;
  const parts = hotkeyStr.toLowerCase().split('+').map((p) => p.trim());
  const hasAlt = parts.includes('alt');
  const hasCtrl = parts.includes('ctrl') || parts.includes('control');
  const hasShift = parts.includes('shift');
  const hasMeta = parts.includes('command') || parts.includes('meta') || parts.includes('cmd');

  if (e.altKey !== hasAlt) return false;
  if (e.ctrlKey !== hasCtrl) return false;
  if (e.shiftKey !== hasShift) return false;
  if (e.metaKey !== hasMeta) return false;

  const keyPart = parts.find((p) => !['alt', 'ctrl', 'control', 'shift', 'command', 'meta', 'cmd'].includes(p));
  if (!keyPart) return true;

  if (keyPart === 'space' && (e.key === ' ' || e.code === 'Space')) return true;
  return (
    e.key.toLowerCase() === keyPart ||
    e.code.toLowerCase() === `key${keyPart}` ||
    e.code.toLowerCase() === keyPart
  );
}

// Global window keydown listener (Toggles Hologram Pods on key press)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeHologramPods();
    closeAllDrawers();
    return;
  }

  // Do not intercept if typing in a form input or textarea
  if (e.target && e.target.matches('input, textarea')) {
    return;
  }

  // Pressing Shift key toggles on and off
  if (e.key === 'Shift' && !e.repeat) {
    userToggledOffDuringDrag = hologramPodsDrawer.classList.contains('open');
    toggleHologramPods();
    return;
  }

  // Pressing configured Quick Action hotkey (e.g. Alt+Q) toggles on and off
  if (isMatchingHotkey(e, currentSettings.quickHotkey)) {
    e.preventDefault();
    userToggledOffDuringDrag = hologramPodsDrawer.classList.contains('open');
    toggleHologramPods();
    return;
  }
});

init();