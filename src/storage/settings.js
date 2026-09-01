'use strict';

const { settingsFile } = require('./paths');
const { readJson, writeJsonQuietly } = require('./json-file');

const DEFAULTS = {
  hotkey: null,
  addHotkey: null,
  lastBoardId: null,
  lastProjectKey: null,
  lastIssueTypeId: null,
  lastOptionFieldsByProject: {}
};

function createSettings() {
  const values = { ...DEFAULTS, ...readJson(settingsFile(), {}) };

  return {
    get: (name) => values[name],
    set(name, value) {
      values[name] = value;
      writeJsonQuietly(settingsFile(), values);
    },
    remember(patch) {
      Object.assign(values, patch);
      writeJsonQuietly(settingsFile(), values);
    }
  };
}

module.exports = { createSettings, DEFAULTS };
