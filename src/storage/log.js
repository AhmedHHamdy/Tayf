'use strict';

const fs = require('fs');
const path = require('path');
const { logFile } = require('./paths');

function appendLine(text) {
  const filePath = logFile();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${new Date().toISOString()}  ${text}\n`);
  } catch {}
}

module.exports = { appendLine, logFile };
