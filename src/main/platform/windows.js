'use strict';

const path = require('path');
const koffi = require('koffi');
const { app, nativeImage } = require('electron');

const user32 = koffi.load('user32.dll');
const GetForegroundWindow = user32.func('void* GetForegroundWindow()');
const SetForegroundWindow = user32.func('bool SetForegroundWindow(void* hWnd)');

let overlayHandle = 0n;
let previouslyFocusedWindow = null;

module.exports = {
  isMac: false,
  isWindows: true,
  isLinux: false,

  toggleHotkeys: ['Control+Space', 'Alt+Space', 'Control+Alt+Space', 'Control+Shift+J'],
  composeHotkeys: ['Control+Shift+Space', 'Alt+Shift+Space', 'Control+Alt+N'],
  autoStartLabel: 'startWithWindows',

  hotkeyLabel: (accelerator) => accelerator,

  prepare() {
    app.setAppUserModelId('com.tayf.overlay');
  },

  windowOptions: () => ({}),

  attachOverlay(window) {
    try {
      overlayHandle = window.getNativeWindowHandle().readBigUInt64LE();
    } catch {
      overlayHandle = 0n;
    }
  },

  rememberFocusedWindow() {
    const foreground = GetForegroundWindow();
    const address = foreground ? koffi.address(foreground) : 0n;
    if (address !== overlayHandle) previouslyFocusedWindow = foreground;
  },

  restoreFocus() {
    if (!previouslyFocusedWindow) return;
    try {
      SetForegroundWindow(previouslyFocusedWindow);
    } catch {
      previouslyFocusedWindow = null;
    }
  },

  focusOverlayApp() {},

  setOverlayBounds(window, bounds) {
    window.setBounds(bounds);
  },

  trayIcon(assetsDirectory) {
    const image = nativeImage.createFromPath(path.join(assetsDirectory, 'tray.png'));
    return image.isEmpty() ? nativeImage.createEmpty() : image;
  },

  relaunchCommand() {
    return process.env.PORTABLE_EXECUTABLE_FILE || null;
  }
};
