'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const LOGIN_ITEM_OPTIONS = app.isPackaged
  ? {}
  : { path: process.execPath, args: [path.resolve(__dirname, '..', '..')] };

function linuxDesktopFile() {
  return path.join(app.getPath('appData'), 'autostart', 'tayf.desktop');
}

function desktopQuote(value) {
  return `"${String(value).replace(/["`$\\]/g, '\\$&')}"`;
}

function linuxExec() {
  const command = app.isPackaged
    ? [process.env.APPIMAGE || process.execPath]
    : [process.execPath, path.resolve(__dirname, '..', '..')];
  return command.map(desktopQuote).join(' ');
}

function setLinuxEnabled(enabled) {
  const file = linuxDesktopFile();

  if (!enabled) {
    try {
      fs.unlinkSync(file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    return;
  }

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    [
      '[Desktop Entry]',
      'Type=Application',
      'Name=Tayf',
      `Exec=${linuxExec()}`,
      'Terminal=false',
      'NoDisplay=true',
      'X-GNOME-Autostart-enabled=true',
      ''
    ].join('\n'),
    { mode: 0o644 }
  );
}

function isEnabled() {
  try {
    if (process.platform === 'linux') return fs.existsSync(linuxDesktopFile());
    return app.getLoginItemSettings(LOGIN_ITEM_OPTIONS).openAtLogin;
  } catch {
    return false;
  }
}

function setEnabled(enabled) {
  try {
    if (process.platform === 'linux') return setLinuxEnabled(enabled);
    app.setLoginItemSettings({ openAtLogin: enabled, ...LOGIN_ITEM_OPTIONS });
  } catch {}
}

module.exports = { isEnabled, setEnabled };
