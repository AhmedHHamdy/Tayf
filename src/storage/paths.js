'use strict';

const path = require('path');
const { app } = require('electron');

function userDataFile(name) {
  return path.join(app.getPath('userData'), name);
}

module.exports = {
  credentialsFile: () => userDataFile('config.json'),
  settingsFile: () => userDataFile('settings.json'),
  cacheFile: () => userDataFile('cache.json'),
  logFile: () => userDataFile('errors.log')
};
