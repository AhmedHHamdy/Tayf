'use strict';

const path = require('path');
const { BrowserWindow, screen } = require('electron');
const platform = require('./platform');

const RENDERER_ENTRY = path.join(__dirname, '..', 'renderer', 'index.html');
const PRELOAD = path.join(__dirname, '..', 'preload.js');

class OverlayWindow {
  constructor({ onHidden, zoom }) {
    this.onHidden = onHidden;
    this.zoom = zoom || 1;
    this.window = null;
  }

  create() {
    this.window = new BrowserWindow({
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      fullscreenable: false,
      hasShadow: false,
      title: 'Tayf',
      backgroundColor: '#00000000',
      webPreferences: {
        preload: PRELOAD,
        contextIsolation: true,
        nodeIntegration: false
      },
      ...platform.windowOptions()
    });

    this.window.setAlwaysOnTop(true, 'screen-saver');
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.window.webContents.on('did-finish-load', () => this.applyZoom());
    this.window.loadFile(RENDERER_ENTRY);
    this.window.on('blur', () => this.hide());
    platform.attachOverlay(this.window);

    return this.window;
  }

  setZoom(factor) {
    this.zoom = factor || 1;
    this.applyZoom();
  }

  applyZoom() {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.webContents.setZoomFactor(this.zoom);
  }

  send(channel, payload) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, payload);
    }
  }

  isVisible() {
    return !!this.window && this.window.isVisible();
  }

  show({ state, screen: requestedScreen }) {
    if (!this.window) return;

    platform.rememberFocusedWindow();
    platform.focusOverlayApp();

    const cursor = screen.getCursorScreenPoint();
    platform.setOverlayBounds(this.window, screen.getDisplayNearestPoint(cursor).bounds);

    const openedAt = Date.now();
    this.window.show();
    this.window.focus();
    this.send('overlay:shown', { openedAt, state, screen: requestedScreen });
  }

  hide() {
    if (!this.isVisible()) return;
    this.window.hide();
    platform.restoreFocus();
    if (this.onHidden) this.onHidden();
  }
}

module.exports = { OverlayWindow };
