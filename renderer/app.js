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

// DOM Elements
const bodyEl = document.getElementById('dock-body');
const rail = document.getElementById('rail');
const listContainer = document.getElementById('launcher-list');
const toggleAddBtn = document.getElementById('toggle-add-btn');
const toggleAutoHideBtn = document.getElementById('toggle-autohide-btn');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeBtn = document.getElementById('close-btn');

// Add/Edit Drawer
const drawer = document.getElementById('drawer');
const drawerTitle = document.getElementById('drawer-title');
const shortcutForm = document.getElementById('shortcut-form');
const itemIdInput = document.getElementById('item-id');
const appNameInput = document.getElementById('app-name');
const appPathInput = document.getElementById('app-path');
const browseBtn = document.getElementById('browse-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Settings Drawer
const settingsDrawer = document.getElementById('settings-drawer');
const segmentBtns = document.querySelectorAll('.segment-btn');
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

async function init() {
  if (window.dockAPI) {
    shortcuts = (await window.dockAPI.getShortcuts()) || [];
    const savedSettings = await window.dockAPI.getSettings();
    if (savedSettings) currentSettings = { ...currentSettings, ...savedSettings };
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

// Window expansion management for tooltips, drawers, and menus
function checkWindowExpansion() {
  const isDrawerOpen = drawer.classList.contains('open') || settingsDrawer.classList.contains('open');
  const isContextMenuOpen = contextMenu.classList.contains('visible');
  const isHovered = rail.matches(':hover');

  const shouldExpand = isDrawerOpen || isContextMenuOpen || isHovered;
  if (window.dockAPI) {
    window.dockAPI.setExpanded(shouldExpand);
  }
}

rail.addEventListener('mouseenter', () => {
  if (currentSettings.autoHide) {
    rail.classList.remove('peek-hidden');
  }
  checkWindowExpansion();
});

rail.addEventListener('mouseleave', () => {
  if (currentSettings.autoHide && !drawer.classList.contains('open') && !settingsDrawer.classList.contains('open')) {
    rail.classList.add('peek-hidden');
  }
  checkWindowExpansion();
});

// Pre-fetch native icons for local files
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
  // 1. Cached native icon
  if (item.iconData) {
    const img = document.createElement('img');
    img.src = item.iconData;
    img.alt = item.name;
    return img;
  }

  // 2. Web URL Favicon
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

  // 3. Fallback SVGs
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

    // Launch shortcut
    tile.addEventListener('click', async () => {
      if (window.dockAPI) {
        const result = await window.dockAPI.launchTarget(item.path);
        if (result && !result.success) {
          showToast(`Launch failed: ${result.error || 'Not found'}`);
        }
      }
    });

    // Right-click context menu
    tile.addEventListener('contextmenu', (e) => {
      e.preventDefault();
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

// Native Windows File Drop to Rail
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
  if (!drawer.contains(e.target) && !toggleAddBtn.contains(e.target)) {
    closeDrawer();
  }
  if (!settingsDrawer.contains(e.target) && !openSettingsBtn.contains(e.target)) {
    closeSettings();
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
    openDrawer(activeContextMenuTarget);
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

// Drawer Functions
function openDrawer(itemToEdit = null) {
  closeSettings();
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

function closeDrawer() {
  drawer.classList.remove('open');
  temporaryPickedIcon = null;
  checkWindowExpansion();
}

function openSettings() {
  closeDrawer();
  settingsDrawer.classList.add('open');
  checkWindowExpansion();
}

function closeSettings() {
  settingsDrawer.classList.remove('open');
  checkWindowExpansion();
}

toggleAddBtn.addEventListener('click', () => {
  if (drawer.classList.contains('open')) {
    closeDrawer();
  } else {
    openDrawer();
  }
});

openSettingsBtn.addEventListener('click', () => {
  if (settingsDrawer.classList.contains('open')) {
    closeSettings();
  } else {
    openSettings();
  }
});

cancelBtn.addEventListener('click', closeDrawer);
closeSettingsBtn.addEventListener('click', closeSettings);

// Native File Browse Picker
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

// Form Submit
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
  closeDrawer();
});

// Auto-Hide Toggle
toggleAutoHideBtn.addEventListener('click', async () => {
  currentSettings.autoHide = !currentSettings.autoHide;
  if (window.dockAPI) {
    await window.dockAPI.saveSettings(currentSettings);
  }
  applySettings(currentSettings);
  showToast(currentSettings.autoHide ? 'Auto-Hide Enabled' : 'Dock Pinned');
});

// Settings: Position
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

// Settings: Color Picker
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

// Settings: Hotkey
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

// Settings: Switches
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

// Close / Hide button
closeBtn.addEventListener('click', () => {
  if (window.dockAPI) {
    window.dockAPI.hideWindow();
  }
});

init();