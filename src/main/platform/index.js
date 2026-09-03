'use strict';

const adapters = {
  darwin: './macos',
  linux: './linux',
  win32: './windows'
};

const adapter = adapters[process.platform];

if (!adapter) {
  throw new Error(`Unsupported platform: ${process.platform}`);
}

module.exports = require(adapter);
