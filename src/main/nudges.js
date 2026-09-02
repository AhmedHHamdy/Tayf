'use strict';

const { Notification, powerMonitor } = require('electron');
const { decide, minutesOfDay } = require('../app/nudges');
const { NUDGE_TEXT } = require('../strings');

const TICK_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MORNING_FALLBACK = 8 * 60;

const TEXT_FOR = {
  'nothing-in-progress': (decision) => NUDGE_TEXT.nothingInProgress(decision.count),
  stale: (decision) => NUDGE_TEXT.stale(decision.key, decision.days),
  'still-on-it': (decision) => NUDGE_TEXT.stillOnIt(decision.key, decision.minutes)
};

const REMEMBER_AS = {
  'nothing-in-progress': 'idleAt',
  stale: 'staleAt',
  'still-on-it': 'checkAt'
};

function createNudges({ workspace, settings, log, onOpen }) {
  const history = { idleAt: 0, staleAt: 0, checkAt: 0 };
  let timer = null;

  function preferences() {
    return {
      enabled: settings.get('nudgesEnabled'),
      everyMinutes: settings.get('nudgeEveryMinutes'),
      idleMinutes: settings.get('nudgeIdleMinutes'),
      workStart: settings.get('nudgeWorkStart'),
      workEnd: settings.get('nudgeWorkEnd'),
      workDays: settings.get('nudgeWorkDays'),
      staleDays: settings.get('nudgeStaleDays'),
      checkEnabled: settings.get('nudgeCheckEnabled'),
      checkMinutes: settings.get('nudgeCheckMinutes'),
      snoozeUntil: settings.get('nudgeSnoozeUntil')
    };
  }

  function show(decision) {
    if (!Notification.isSupported()) return;

    const text = TEXT_FOR[decision.kind](decision);

    try {
      const notification = new Notification({ title: text.title, body: text.body, silent: false });
      notification.on('click', onOpen);
      notification.show();
    } catch {}
  }

  function tick() {
    try {
      const decision = decide({
        items: workspace.state.items,
        idleSeconds: powerMonitor.getSystemIdleTime(),
        now: new Date(),
        settings: preferences(),
        history
      });
      if (!decision) return;

      history[REMEMBER_AS[decision.kind]] = Date.now();

      log.appendLine(`nudge: ${decision.kind}${decision.key ? ` ${decision.key}` : ''}`);
      show(decision);
    } catch (error) {
      log.appendLine(`nudge failed: ${error.message}`);
    }
  }

  function nextMorning() {
    const start = minutesOfDay(settings.get('nudgeWorkStart'));
    const morning = new Date(Date.now() + DAY_MS);
    morning.setHours(Math.floor((start === null ? MORNING_FALLBACK : start) / 60));
    morning.setMinutes((start === null ? MORNING_FALLBACK : start) % 60, 0, 0);
    return morning.getTime();
  }

  return {
    start() {
      timer = setInterval(tick, TICK_MS);
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
    snoozeForAnHour: () => settings.set('nudgeSnoozeUntil', Date.now() + HOUR_MS),
    snoozeUntilTomorrow: () => settings.set('nudgeSnoozeUntil', nextMorning()),
    wake: () => settings.set('nudgeSnoozeUntil', null),
    snoozedUntil: () => settings.get('nudgeSnoozeUntil')
  };
}

module.exports = { createNudges };
