'use strict';

const { app } = require('electron');
const { autoUpdater } = require('electron-updater');

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const SIGNED_PLATFORMS = new Set(['win32']);

function createUpdates({ log, onChange }) {
  const supported = SIGNED_PLATFORMS.has(process.platform) && app.isPackaged;

  let state = { checking: false, downloading: false, ready: false, version: null };
  let timer = null;

  function publish(patch) {
    state = { ...state, ...patch };
    onChange(state);
  }

  function note(message) {
    log.appendLine(`update: ${message}`);
  }

  function check() {
    if (!supported || state.ready || state.checking) return;
    publish({ checking: true });
    autoUpdater
      .checkForUpdates()
      .catch((error) => note(error.message))
      .finally(() => publish({ checking: false }));
  }

  function install() {
    if (!state.ready) return;
    autoUpdater.quitAndInstall(false, true);
  }

  function start() {
    if (!supported) return;

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = null;

    autoUpdater.on('update-available', (info) =>
      publish({ downloading: true, version: info.version })
    );
    autoUpdater.on('update-not-available', () => publish({ downloading: false }));
    autoUpdater.on('update-downloaded', (info) =>
      publish({ downloading: false, ready: true, version: info.version })
    );
    autoUpdater.on('error', (error) => {
      publish({ checking: false, downloading: false });
      note(error.message);
    });

    check();
    timer = setInterval(check, CHECK_INTERVAL_MS);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return {
    supported,
    start,
    stop,
    check,
    install,
    get state() {
      return state;
    }
  };
}

module.exports = { createUpdates };
