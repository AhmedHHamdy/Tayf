'use strict';

const path = require('path');
const { app, nativeImage } = require('electron');

const SYMBOLS = [
  [/CommandOrControl|Command|Cmd/g, '⌘'],
  [/Control|Ctrl/g, '⌃'],
  [/Alt|Option/g, '⌥'],
  [/Shift/g, '⇧'],
  [/\+/g, '']
];

module.exports = {
  isMac: true,
  isWindows: false,
  isLinux: false,

  toggleHotkeys: ['Alt+Space', 'Command+Shift+Space', 'Control+Alt+Space', 'Control+Shift+J'],
  composeHotkeys: ['Alt+Shift+Space', 'Command+Control+Space', 'Control+Alt+N'],
  autoStartLabel: 'startWithMac',

  hotkeyLabel(accelerator) {
    if (!accelerator) return accelerator;
    return SYMBOLS.reduce((text, [pattern, symbol]) => text.replace(pattern, symbol), String(accelerator));
  },

  prepare() {
    if (!app.dock) return;
    try {
      app.dock.hide();
    } catch {}
  },

  windowOptions: () => ({ type: 'panel' }),

  attachOverlay() {},

  rememberFocusedWindow() {},

  restoreFocus() {
    try {
      app.hide();
    } catch {}
  },

  focusOverlayApp() {
    try {
      app.show();
      app.focus({ steal: true });
    } catch {}
  },

  setOverlayBounds(window, bounds) {
    window.setResizable(true);
    window.setBounds(bounds);
    window.setResizable(false);
  },

  trayIcon(assetsDirectory) {
    const image = nativeImage.createFromPath(path.join(assetsDirectory, 'trayTemplate.png'));
    if (image.isEmpty()) return nativeImage.createEmpty();
    image.setTemplateImage(true);
    return image;
  },

  relaunchCommand() {
    return null;
  }
};
