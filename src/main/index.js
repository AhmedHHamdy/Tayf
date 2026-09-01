'use strict';

const { app, Notification } = require('electron');

const platform = require('./platform');
const credentials = require('../storage/credentials');
const cache = require('../storage/cache');
const log = require('../storage/log');
const { createSettings } = require('../storage/settings');
const { Workspace } = require('../app/workspace');
const { JiraProvider } = require('../providers/jira');
const { OverlayWindow } = require('./overlay-window');
const { createHotkeys } = require('./hotkeys');
const { createTrayMenu } = require('./tray-menu');
const { createUpdates } = require('./updates');
const { relaunch } = require('./relaunch');
const ipc = require('./ipc');
const { NOTIFICATION_TEXT } = require('../strings');

const REFRESH_INTERVAL_MS = 60_000;
const OPEN_TIME_BUDGET_MS = 500;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  platform.prepare();
  app.whenReady().then(start);
}

function start() {
  const settings = createSettings();
  const workspace = new Workspace({
    cache: { read: cache.readCache, write: cache.writeCache },
    log
  });

  const overlay = new OverlayWindow({ onHidden: () => {} });
  overlay.create();

  const openOverlay = (screen) => overlay.show({ state: ipc.serialiseState(workspace.state), screen });
  const toggleOverlay = () => (overlay.isVisible() ? overlay.hide() : openOverlay('list'));

  const hotkeys = createHotkeys({
    platform,
    settings,
    onToggle: toggleOverlay,
    onCompose: () => openOverlay('compose')
  });

  const updates = createUpdates({ log, onChange: () => tray.update() });

  const actions = {
    toggle: toggleOverlay,
    openList: () => openOverlay('list'),
    openCompose: () => openOverlay('compose'),
    openSettings: () => openOverlay('settings'),
    refresh: () => workspace.refresh(),
    quit: () => app.quit(),
    restart: () => relaunch(log),
    revealLog: () => tray.reveal(log.logFile()),
    revealConfig: () => tray.reveal(credentials.ensureFile()),
    checkUpdates: () => updates.check(),
    installUpdate: () => updates.install(),
    reportOpenTime: (milliseconds) => {
      const mark = milliseconds <= OPEN_TIME_BUDGET_MS ? 'ok' : 'slow';
      log.appendLine(`overlay opened in ${milliseconds}ms (${mark})`);
    },
    reconnect: async () => {
      connectProvider();
      const user = workspace.provider ? await workspace.provider.currentUser() : null;
      workspace.state.user = user;
      await workspace.refresh();
      return user;
    }
  };

  const tray = createTrayMenu({ workspace, hotkeys, actions, updates });

  function connectProvider() {
    const stored = credentials.read();
    workspace.useProvider(stored ? new JiraProvider(stored) : null);
  }

  workspace.on('change', (state) => {
    overlay.send('workspace:state', ipc.serialiseState(state));
    tray.update();
  });

  workspace.on('failure', (failure) => {
    if (!Notification.isSupported()) return;
    try {
      new Notification({
        title: NOTIFICATION_TEXT.actionFailedTitle(failure.key),
        body: failure.message,
        silent: false
      }).show();
    } catch {}
  });

  ipc.register({ workspace, overlay, settings, actions });

  connectProvider();
  hotkeys.register();
  tray.create();
  updates.start();

  workspace.refresh();
  setInterval(() => workspace.refresh(), REFRESH_INTERVAL_MS);

  app.on('second-instance', actions.openList);
  app.on('window-all-closed', () => {});
  app.on('will-quit', () => {
    hotkeys.releaseAll();
    updates.stop();
  });
}
