'use strict';

const path = require('path');
const { app } = require('electron');

const LOGIN_ITEM_OPTIONS = app.isPackaged
  ? {}
  : { path: process.execPath, args: [path.resolve(__dirname, '..', '..')] };

function isEnabled() {
  try {
    return app.getLoginItemSettings(LOGIN_ITEM_OPTIONS).openAtLogin;
  } catch {
    return false;
  }
}

function setEnabled(enabled) {
  try {
    app.setLoginItemSettings({ openAtLogin: enabled, ...LOGIN_ITEM_OPTIONS });
  } catch {}
}

module.exports = { isEnabled, setEnabled };
