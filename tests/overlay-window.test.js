'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { OverlayWindow } = require('../src/main/overlay-window');

class FakeWebContents extends EventEmitter {
  constructor() {
    super();
    this.messages = [];
  }

  send(channel, payload) {
    this.messages.push({ channel, payload });
  }
}

class FakeBrowserWindow extends EventEmitter {
  static instances = [];

  constructor(options) {
    super();
    this.options = options;
    this.destroyed = false;
    this.visible = false;
    this.webContents = new FakeWebContents();
    FakeBrowserWindow.instances.push(this);
  }

  isDestroyed() { return this.destroyed; }
  isVisible() { return this.visible; }
  setAlwaysOnTop() {}
  setVisibleOnAllWorkspaces() {}
  loadFile() {}
  show() { this.visible = true; }
  focus() {}
  hide() { this.visible = false; }
}

function harness() {
  FakeBrowserWindow.instances = [];
  const boundsCalls = [];
  const platform = {
    windowOptions: () => ({}),
    attachOverlay() {},
    rememberFocusedWindow() {},
    focusOverlayApp() {},
    restoreFocus() {},
    setOverlayBounds: (window, bounds) => boundsCalls.push({ window, bounds })
  };
  const display = {
    getCursorScreenPoint: () => ({ x: 10, y: 20 }),
    getDisplayNearestPoint: () => ({ bounds: { x: 0, y: 0, width: 800, height: 600 } })
  };
  const overlay = new OverlayWindow({
    onHidden: () => {},
    BrowserWindowClass: FakeBrowserWindow,
    display,
    platformApi: platform
  });

  return { overlay, boundsCalls };
}

test('show recreates a BrowserWindow that Electron already destroyed', () => {
  const { overlay, boundsCalls } = harness();
  const first = overlay.create();
  first.destroyed = true;

  overlay.show({ state: { items: [] }, screen: 'list' });

  const second = FakeBrowserWindow.instances[1];
  assert.ok(second);
  assert.equal(boundsCalls.length, 1);
  assert.equal(boundsCalls[0].window, second);
  assert.equal(second.visible, true);
});

test('a recreated window receives its requested screen after loading', () => {
  const { overlay } = harness();
  const first = overlay.create();
  first.destroyed = true;

  overlay.show({ state: { configured: true }, screen: 'compose' });
  const second = FakeBrowserWindow.instances[1];
  assert.deepEqual(second.webContents.messages, []);

  second.webContents.emit('did-finish-load');

  assert.equal(second.webContents.messages.length, 1);
  assert.equal(second.webContents.messages[0].channel, 'overlay:shown');
  assert.equal(second.webContents.messages[0].payload.screen, 'compose');
});

test('a stale closed event cannot clear a replacement window', () => {
  const { overlay } = harness();
  const first = overlay.create();
  first.destroyed = true;
  overlay.show({ state: {}, screen: 'list' });
  const second = overlay.window;

  first.emit('closed');

  assert.equal(overlay.window, second);
});
