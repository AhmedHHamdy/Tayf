'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
  return filePath;
}

function writeJsonQuietly(filePath, value) {
  try {
    writeJson(filePath, value);
    return true;
  } catch {
    return false;
  }
}

module.exports = { readJson, writeJson, writeJsonQuietly };
