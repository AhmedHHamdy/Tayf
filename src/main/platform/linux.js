'use strict';

const path = require('path');
const { nativeImage } = require('electron');

module.exports = {
  isMac: false,
  isWindows: false,
  isLinux: true,

  toggleHotkeys: ['Control+Space', 'Control+Shift+J', 'Alt+Space', 'Control+Alt+Space'],
  composeHotkeys: ['Control+Shift+Space', 'Control+Alt+N', 'Alt+Shift+Space'],
  autoStartLabel: 'startWithLinux',

  hotkeyLabel: (accelerator) => accelerator,

  prepare() {},

  windowOptions: () => ({}),

  attachOverlay() {},

  rememberFocusedWindow() {},

  restoreFocus() {},

  focusOverlayApp() {},

  setOverlayBounds(window, bounds) {
    window.setBounds(bounds);
  },

  trayIcon(assetsDirectory) {
    const image = nativeImage.createFromPath(path.join(assetsDirectory, 'tray.png'));
    return image.isEmpty() ? nativeImage.createEmpty() : image;
  },

  relaunchCommand() {
    return process.env.APPIMAGE || null;
  }
};
