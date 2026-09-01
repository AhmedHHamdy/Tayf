'use strict';

const { globalShortcut } = require('electron');

function registerFirstAvailable(candidates, preferred, handler) {
  const ordered = candidates.includes(preferred)
    ? [preferred, ...candidates.filter((candidate) => candidate !== preferred)]
    : candidates;

  for (const accelerator of ordered) {
    if (globalShortcut.register(accelerator, handler)) return accelerator;
  }
  return null;
}

function createHotkeys({ platform, settings, onToggle, onCompose }) {
  const registered = { toggle: null, compose: null };

  function register() {
    globalShortcut.unregisterAll();
    registered.toggle = registerFirstAvailable(
      platform.toggleHotkeys,
      settings.get('hotkey') || platform.toggleHotkeys[0],
      onToggle
    );
    registered.compose = registerFirstAvailable(
      platform.composeHotkeys,
      settings.get('addHotkey') || platform.composeHotkeys[0],
      onCompose
    );
    return registered;
  }

  return {
    register,
    get toggle() {
      return registered.toggle;
    },
    get compose() {
      return registered.compose;
    },
    choose(accelerator) {
      settings.set('hotkey', accelerator);
      return register();
    },
    releaseAll: () => globalShortcut.unregisterAll()
  };
}

module.exports = { createHotkeys, registerFirstAvailable };
