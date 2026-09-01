'use strict';

const fs = require('fs');
const path = require('path');
const { credentialsFile } = require('./paths');
const { readJson, writeJson } = require('./json-file');

const DEVELOPMENT_FILE = path.join(__dirname, '..', '..', 'config.json');
const BLANK = { site: '', email: '', token: '' };

function activeFile() {
  const preferred = credentialsFile();
  if (fs.existsSync(preferred)) return preferred;
  if (fs.existsSync(DEVELOPMENT_FILE)) return DEVELOPMENT_FILE;
  return preferred;
}

function normaliseSite(site) {
  return String(site || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function ensureFile() {
  const filePath = activeFile();
  if (!fs.existsSync(filePath)) {
    try {
      writeJson(filePath, { site: 'your-company.atlassian.net', email: '', token: '' });
    } catch {
      return filePath;
    }
  }
  return filePath;
}

function read() {
  const stored = readJson(activeFile(), null);
  if (!stored) return null;

  const site = normaliseSite(stored.site);
  const email = String(stored.email || '').trim();
  const token = String(stored.token || '').trim();
  if (!site || !email || !token) return null;

  return { site, email, token };
}

function write(candidate) {
  return writeJson(credentialsFile(), {
    site: normaliseSite(candidate.site),
    email: String(candidate.email || '').trim(),
    token: String(candidate.token || '').trim()
  });
}

function readWithoutToken() {
  const complete = read();
  if (complete) return { site: complete.site, email: complete.email, hasToken: true };

  const partial = readJson(activeFile(), BLANK);
  return {
    site: normaliseSite(partial.site),
    email: String(partial.email || '').trim(),
    hasToken: !!String(partial.token || '').trim()
  };
}

module.exports = { activeFile, ensureFile, read, write, readWithoutToken, normaliseSite };
