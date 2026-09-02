'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { decide, minutesOfDay, withinWorkingHours, DAY_MS } = require('../src/app/nudges');

const NOW = new Date(2026, 8, 2, 10, 0, 0);
const TODAY = NOW.getDay();
const TOMORROW = (TODAY + 1) % 7;

const SETTINGS = {
  enabled: true,
  everyMinutes: 15,
  idleMinutes: 10,
  workStart: '08:00',
  workEnd: '18:00',
  workDays: [TODAY],
  staleDays: 1,
  snoozeUntil: null
};

const QUIET = { idleAt: 0, staleAt: 0 };

function item(overrides) {
  return {
    key: 'TAYF-1',
    title: 'شغل',
    category: 'new',
    updated: new Date(NOW.getTime() - 60_000).toISOString(),
    categoryChangedAt: null,
    ...overrides
  };
}

function ask(overrides = {}) {
  return decide({
    items: [item()],
    idleSeconds: 0,
    now: NOW,
    settings: SETTINGS,
    history: QUIET,
    ...overrides
  });
}

test('nudges when nothing is in progress', () => {
  const decision = ask();
  assert.equal(decision.kind, 'nothing-in-progress');
  assert.equal(decision.count, 1);
});

test('stays quiet when switched off', () => {
  assert.equal(ask({ settings: { ...SETTINGS, enabled: false } }), null);
});

test('stays quiet while snoozed, and speaks once the snooze runs out', () => {
  const snoozed = { ...SETTINGS, snoozeUntil: NOW.getTime() + 60_000 };
  assert.equal(ask({ settings: snoozed }), null);

  const expired = { ...SETTINGS, snoozeUntil: NOW.getTime() - 1 };
  assert.equal(ask({ settings: expired }).kind, 'nothing-in-progress');
});

test('stays quiet when the machine has not been touched', () => {
  assert.equal(ask({ idleSeconds: 10 * 60 }), null);
  assert.equal(ask({ idleSeconds: 10 * 60 - 1 }).kind, 'nothing-in-progress');
});

test('stays quiet outside working hours', () => {
  assert.equal(ask({ settings: { ...SETTINGS, workDays: [TOMORROW] } }), null);
  assert.equal(ask({ settings: { ...SETTINGS, workStart: '11:00' } }), null);
  assert.equal(ask({ settings: { ...SETTINGS, workEnd: '09:00' } }), null);
});

test('a window that crosses midnight still covers the hours inside it', () => {
  const night = { workDays: [TODAY], workStart: '22:00', workEnd: '11:00' };
  assert.equal(withinWorkingHours(NOW, night), true);
  assert.equal(withinWorkingHours(new Date(2026, 8, 2, 12, 0), night), false);
  assert.equal(withinWorkingHours(new Date(2026, 8, 2, 23, 0), night), true);
});

test('stays quiet when there is nothing to move', () => {
  assert.equal(ask({ items: [] }), null);
});

test('a task moved to done optimistically does not count as something to move', () => {
  assert.equal(ask({ items: [item({ category: 'done' })] }), null);
});

test('waits out the interval between nudges', () => {
  const recent = { idleAt: NOW.getTime() - 14 * 60_000, staleAt: 0 };
  assert.equal(ask({ history: recent }), null);

  const older = { idleAt: NOW.getTime() - 15 * 60_000, staleAt: 0 };
  assert.equal(ask({ history: older }).kind, 'nothing-in-progress');
});

test('says nothing while a task is genuinely in progress', () => {
  const working = item({ category: 'indeterminate' });
  assert.equal(ask({ items: [working] }), null);
});

test('nudges about a task that has sat in progress past the limit', () => {
  const stale = item({
    key: 'TAYF-9',
    category: 'indeterminate',
    categoryChangedAt: new Date(NOW.getTime() - 2 * DAY_MS).toISOString()
  });

  const decision = ask({ items: [stale] });
  assert.equal(decision.kind, 'stale');
  assert.equal(decision.key, 'TAYF-9');
  assert.equal(decision.days, 2);
});

test('nudges about the stalest task, and only once a day', () => {
  const items = [
    item({ key: 'A', category: 'indeterminate', categoryChangedAt: new Date(NOW.getTime() - 2 * DAY_MS).toISOString() }),
    item({ key: 'B', category: 'indeterminate', categoryChangedAt: new Date(NOW.getTime() - 5 * DAY_MS).toISOString() })
  ];

  assert.equal(ask({ items }).key, 'B');

  const nudgedThisMorning = { idleAt: 0, staleAt: NOW.getTime() - 60 * 60_000 };
  assert.equal(ask({ items, history: nudgedThisMorning }), null);
});

test('falls back to the update time when Jira gives no category change date', () => {
  const stale = item({
    category: 'indeterminate',
    categoryChangedAt: null,
    updated: new Date(NOW.getTime() - 3 * DAY_MS).toISOString()
  });

  assert.equal(ask({ items: [stale] }).kind, 'stale');
});

test('reads a clock, and rejects nonsense', () => {
  assert.equal(minutesOfDay('08:30'), 510);
  assert.equal(minutesOfDay('8:05'), 485);
  assert.equal(minutesOfDay('24:00'), null);
  assert.equal(minutesOfDay('08:70'), null);
  assert.equal(minutesOfDay(''), null);
});
