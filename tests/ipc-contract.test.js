'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const PRELOAD = read('src/preload.js');
const IPC = read('src/main/ipc.js');
const MAIN = read('src/main/index.js');
const OVERLAY = read('src/main/overlay-window.js');

function channels(source, pattern) {
  const found = new Set();
  let match;
  while ((match = pattern.exec(source)) !== null) found.add(match[1]);
  return found;
}

function rendererSource() {
  const dir = path.join(ROOT, 'src/renderer');
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .map((name) => fs.readFileSync(path.join(dir, String(name)), 'utf8'))
    .join('\n');
}

const preloadInvoke = channels(PRELOAD, /ipcRenderer\.invoke\('([^']+)'/g);
const preloadSend = channels(PRELOAD, /ipcRenderer\.send\('([^']+)'/g);
const preloadOn = channels(PRELOAD, /ipcRenderer\.on\('([^']+)'/g);

const mainHandles = channels(IPC, /ipcMain\.handle\('([^']+)'/g);
const mainListens = channels(IPC, /ipcMain\.on\('([^']+)'/g);
const mainSends = new Set([
  ...channels(MAIN, /overlay\.send\('([^']+)'/g),
  ...channels(OVERLAY, /this\.send\('([^']+)'/g)
]);

test('every invoked channel has an ipcMain.handle', () => {
  assert.deepEqual([...preloadInvoke].filter((name) => !mainHandles.has(name)), []);
});

test('every ipcMain.handle is reachable from the preload bridge', () => {
  assert.deepEqual([...mainHandles].filter((name) => !preloadInvoke.has(name)), []);
});

test('every sent channel has an ipcMain.on', () => {
  assert.deepEqual([...preloadSend].filter((name) => !mainListens.has(name)), []);
});

test('every ipcMain.on is reachable from the preload bridge', () => {
  assert.deepEqual([...mainListens].filter((name) => !preloadSend.has(name)), []);
});

test('every channel the renderer listens on is actually sent by the main process', () => {
  assert.deepEqual([...preloadOn].filter((name) => !mainSends.has(name)), []);
});

test('the renderer only calls methods the preload bridge exposes', () => {
  const exposed = channels(PRELOAD, /^ {2}([A-Za-z][A-Za-z0-9]*):/gm);
  const used = channels(rendererSource(), /window\.tayf\.([A-Za-z][A-Za-z0-9]*)/g);
  assert.deepEqual([...used].filter((name) => !exposed.has(name)), []);
});

test('the preload bridge exposes nothing the renderer never uses', () => {
  const exposed = channels(PRELOAD, /^ {2}([A-Za-z][A-Za-z0-9]*):/gm);
  const used = channels(rendererSource(), /window\.tayf\.([A-Za-z][A-Za-z0-9]*)/g);
  const unused = [...exposed].filter((name) => name !== 'platform' && !used.has(name));
  assert.deepEqual(unused, []);
});

test('the renderer never imports from outside its own directory', () => {
  const dir = path.join(ROOT, 'src/renderer');
  const offenders = [];

  fs.readdirSync(dir, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .forEach((name) => {
      const source = fs.readFileSync(path.join(dir, String(name)), 'utf8');
      const imports = channels(source, /from\s+'([^']+)'/g);
      imports.forEach((specifier) => {
        if (!specifier.startsWith('.')) offenders.push(`${name} -> ${specifier}`);
        if (specifier.includes('../../')) offenders.push(`${name} -> ${specifier}`);
      });
    });

  assert.deepEqual(offenders, []);
});

test('the provider layer never imports Electron', () => {
  const dir = path.join(ROOT, 'src/providers');
  const offenders = fs
    .readdirSync(dir, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .filter((name) => /require\('electron'\)/.test(fs.readFileSync(path.join(dir, String(name)), 'utf8')));

  assert.deepEqual(offenders, []);
});

test('the app layer never imports Electron', () => {
  const dir = path.join(ROOT, 'src/app');
  const offenders = fs
    .readdirSync(dir, { recursive: true })
    .filter((name) => String(name).endsWith('.js'))
    .filter((name) => /require\('electron'\)/.test(fs.readFileSync(path.join(dir, String(name)), 'utf8')));

  assert.deepEqual(offenders, []);
});
