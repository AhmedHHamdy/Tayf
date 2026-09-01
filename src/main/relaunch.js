'use strict';

const { app } = require('electron');
const { spawn } = require('child_process');
const platform = require('./platform');

const EXIT_DELAY_MS = 250;

function relaunch(log) {
  const executable = platform.relaunchCommand();

  if (executable) {
    try {
      app.releaseSingleInstanceLock();
    } catch {}
    try {
      spawn(executable, [], { detached: true, stdio: 'ignore', windowsHide: false }).unref();
    } catch (error) {
      log.appendLine(`relaunch failed: ${error.message}`);
    }
  } else {
    app.relaunch({ args: process.argv.slice(1) });
  }

  setTimeout(() => app.exit(0), EXIT_DELAY_MS);
}

module.exports = { relaunch };
