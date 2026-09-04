'use strict';

const path = require('path');
const { BrowserWindow, screen } = require('electron');
const platform = require('./platform');

const RENDERER_ENTRY = path.join(__dirname, '..', 'renderer', 'index.html');
const PRELOAD = path.join(__dirname, '..', 'preload.js');

class OverlayWindow {
  constructor({
    onHidden,
    BrowserWindowClass = BrowserWindow,
    display = screen,
    platformApi = platform
  }) {
    this.onHidden = onHidden;
    this.BrowserWindowClass = BrowserWindowClass;
    this.display = display;
    this.platform = platformApi;
    this.window = null;
    this.ready = false;
    this.pendingShow = null;
  }

  isAlive(window = this.window) {
    return !!window && !window.isDestroyed();
  }

  create() {
    if (this.isAlive()) return this.window;

    const window = new this.BrowserWindowClass({
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
      ...this.platform.windowOptions()
    });
    this.window = window;
    this.ready = false;

    window.setAlwaysOnTop(true, 'screen-saver');
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    window.on('blur', () => {
      if (this.window === window) this.hide();
    });
    window.on('closed', () => {
      if (this.window !== window) return;
      this.window = null;
      this.ready = false;
      this.pendingShow = null;
    });
    window.webContents.on('did-finish-load', () => {
      if (this.window !== window || !this.isAlive(window)) return;
      this.ready = true;
      if (!this.pendingShow) return;

      const payload = this.pendingShow;
      this.pendingShow = null;
      this.send('overlay:shown', payload);
    });
    window.loadFile(RENDERER_ENTRY);
    this.platform.attachOverlay(window);

    return window;
  }

  send(channel, payload) {
    if (this.isAlive()) {
      this.window.webContents.send(channel, payload);
    }
  }

  isVisible() {
    return this.isAlive() && this.window.isVisible();
  }

  show({ state, screen: requestedScreen }) {
    const window = this.isAlive() ? this.window : this.create();

    this.platform.rememberFocusedWindow();
    this.platform.focusOverlayApp();

    const cursor = this.display.getCursorScreenPoint();
    this.platform.setOverlayBounds(window, this.display.getDisplayNearestPoint(cursor).bounds);

    const openedAt = Date.now();
    window.show();
    window.focus();

    const payload = { openedAt, state, screen: requestedScreen };
    if (this.ready) this.send('overlay:shown', payload);
    else this.pendingShow = payload;
  }

  hide() {
    if (!this.isVisible()) return;
    this.window.hide();
    this.platform.restoreFocus();
    if (this.onHidden) this.onHidden();
  }
}

module.exports = { OverlayWindow };
