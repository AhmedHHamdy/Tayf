'use strict';

module.exports = process.platform === 'darwin' ? require('./macos') : require('./windows');
