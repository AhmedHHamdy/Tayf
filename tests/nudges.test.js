'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { decide, minutesOfDay, withinWorkingHours, DAY_MS } = require('../src/app/nudges');
const { NUDGE_TEXT, NOTIFICATION_TEXT } = require('../src/strings');

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
  workingStatuses: null,
  overdueEnabled: true,
  overdueDays: 1,
  checkEnabled: true,
  checkMinutes: 90,
  snoozeUntil: null
};

const QUIET = { idleAt: 0, overdueAt: 0, checkAt: 0 };
const MINUTE = 60_000;

function daysAgo(days) {
  return new Date(NOW.getTime() - days * DAY_MS).toISOString();
}

function item(overrides) {
  return {
    key: 'TAYF-1',
    title: 'شغل',
    category: 'new',
    status: 'Open',
    due: null,
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
  const recent = { idleAt: NOW.getTime() - 14 * 60_000, overdueAt: 0 };
  assert.equal(ask({ history: recent }), null);

  const older = { idleAt: NOW.getTime() - 15 * 60_000, overdueAt: 0 };
  assert.equal(ask({ history: older }).kind, 'nothing-in-progress');
});

test('says nothing about a task you only just picked up', () => {
  const working = item({ category: 'indeterminate' });
  assert.equal(ask({ items: [working] }), null);
});

test('asks whether you are still on a task once it has run a while', () => {
  const working = item({
    key: 'TAYF-4',
    category: 'indeterminate',
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
  });

  const decision = ask({ items: [working] });
  assert.equal(decision.kind, 'still-on-it');
  assert.equal(decision.key, 'TAYF-4');
  assert.equal(decision.minutes, 100);
});

test('does not ask again before the asking interval passes', () => {
  const working = item({
    category: 'indeterminate',
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
  });

  const justAsked = { ...QUIET, checkAt: NOW.getTime() - 89 * MINUTE };
  assert.equal(ask({ items: [working], history: justAsked }), null);

  const asked = { ...QUIET, checkAt: NOW.getTime() - 90 * MINUTE };
  assert.equal(ask({ items: [working], history: asked }).kind, 'still-on-it');
});

test('asking can be switched off on its own', () => {
  const working = item({
    category: 'indeterminate',
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
  });

  assert.equal(ask({ items: [working], settings: { ...SETTINGS, checkEnabled: false } }), null);
});

test('a late task belongs to the overdue nudge alone, and is never also asked about', () => {
  const working = item({
    category: 'indeterminate',
    due: daysAgo(2),
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
  });

  assert.equal(ask({ items: [working] }).kind, 'overdue');

  const nudgedThisMorning = { ...QUIET, overdueAt: NOW.getTime() - 60 * MINUTE };
  assert.equal(ask({ items: [working], history: nudgedThisMorning }), null);
});

test('each nudge takes its own tasks when both kinds are open at once', () => {
  const items = [
    item({
      key: 'LATE',
      category: 'indeterminate',
      due: daysAgo(3),
      categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
    }),
    item({
      key: 'TODAY',
      category: 'indeterminate',
      categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
    })
  ];

  assert.equal(ask({ items }).key, 'LATE');

  const lateSaidAlready = { ...QUIET, overdueAt: NOW.getTime() - 60 * MINUTE };
  const decision = ask({ items, history: lateSaidAlready });
  assert.equal(decision.kind, 'still-on-it');
  assert.equal(decision.key, 'TODAY');
});

test('nudges about a task whose date has passed', () => {
  const late = item({ key: 'TAYF-9', due: daysAgo(2) });

  const decision = ask({ items: [late] });
  assert.equal(decision.kind, 'overdue');
  assert.equal(decision.key, 'TAYF-9');
  assert.equal(decision.days, 2);
});

test('says nothing about a task whose date has not run out yet', () => {
  assert.equal(ask({ items: [item({ due: daysAgo(0) })] }).kind, 'nothing-in-progress');
  assert.equal(ask({ items: [item({ due: daysAgo(1) })] }).kind, 'nothing-in-progress');
});

test('how long a task may run late is a setting', () => {
  const late = item({ due: daysAgo(2) });

  assert.equal(ask({ items: [late], settings: { ...SETTINGS, overdueDays: 3 } }).kind, 'nothing-in-progress');
  assert.equal(ask({ items: [late], settings: { ...SETTINGS, overdueDays: 0 } }).kind, 'overdue');
});

test('a task with no date is never late', () => {
  assert.equal(ask({ items: [item({ due: null })] }).kind, 'nothing-in-progress');
});

test('reads the plain date Jira sends', () => {
  const late = item({ key: 'TAYF-7', due: '2026-08-23' });
  assert.equal(ask({ items: [late] }).key, 'TAYF-7');
});

test('nudges about the latest task, and only once a day', () => {
  const items = [item({ key: 'A', due: daysAgo(2) }), item({ key: 'B', due: daysAgo(5) })];

  assert.equal(ask({ items }).key, 'B');

  const nudgedThisMorning = { ...QUIET, overdueAt: NOW.getTime() - 60 * MINUTE };
  assert.equal(ask({ items, history: nudgedThisMorning }).kind, 'nothing-in-progress');
});

test('switching the overdue nudge off hands its tasks back to the check-in', () => {
  const late = item({
    key: 'TAYF-8',
    category: 'indeterminate',
    due: daysAgo(3),
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString()
  });

  assert.equal(ask({ items: [late] }).kind, 'overdue');

  const settings = { ...SETTINGS, overdueEnabled: false };
  assert.equal(ask({ items: [late], settings }).kind, 'still-on-it');
});

test('the overdue nudge can be switched off on its own', () => {
  const late = item({ key: 'TAYF-9', due: daysAgo(2) });

  const settings = { ...SETTINGS, overdueEnabled: false };
  assert.equal(ask({ items: [late], settings }).kind, 'nothing-in-progress');
});

test('falls back to the update time when Jira gives no category change date', () => {
  const running = item({
    category: 'indeterminate',
    categoryChangedAt: null,
    updated: new Date(NOW.getTime() - 3 * DAY_MS).toISOString()
  });

  assert.equal(ask({ items: [running] }).kind, 'still-on-it');
});

test('reads a clock, and rejects nonsense', () => {
  assert.equal(minutesOfDay('08:30'), 510);
  assert.equal(minutesOfDay('8:05'), 485);
  assert.equal(minutesOfDay('24:00'), null);
  assert.equal(minutesOfDay('08:70'), null);
  assert.equal(minutesOfDay(''), null);
});

const IN_HAND = { ...SETTINGS, workingStatuses: ['In Progress'] };

function handedOff(overrides) {
  return item({
    category: 'indeterminate',
    status: 'Ready For Testing',
    categoryChangedAt: new Date(NOW.getTime() - 100 * MINUTE).toISOString(),
    ...overrides
  });
}

test('a task handed to the testers is not a task you are working on', () => {
  const items = [handedOff({ key: 'TESTING' }), item({ key: 'TODO' })];

  assert.equal(ask({ items }).kind, 'still-on-it');

  const decision = ask({ items, settings: IN_HAND });
  assert.equal(decision.kind, 'nothing-in-progress');
  assert.equal(decision.count, 1);
});

test('the count is what you could pick up, not everything that is open', () => {
  const items = [
    handedOff({ key: 'A' }),
    handedOff({ key: 'B', status: 'Testing In Progress' }),
    item({ key: 'C' })
  ];

  assert.equal(ask({ items, settings: IN_HAND }).count, 1);
});

test('stays quiet when everything is with somebody else and there is nothing to start', () => {
  assert.equal(ask({ items: [handedOff({})], settings: IN_HAND }), null);
});

test('a task actually in your hands is still asked about', () => {
  const mine = handedOff({ key: 'MINE', status: 'In Progress' });

  const decision = ask({ items: [mine], settings: IN_HAND });
  assert.equal(decision.kind, 'still-on-it');
  assert.equal(decision.key, 'MINE');
});

test('a date that passed still nudges even while the testers hold it', () => {
  const late = handedOff({ key: 'LATE', due: daysAgo(3) });

  const decision = ask({ items: [late], settings: IN_HAND });
  assert.equal(decision.kind, 'overdue');
  assert.equal(decision.key, 'LATE');
});

test('naming no status falls back to whatever Jira calls in progress', () => {
  const testing = handedOff({});

  assert.equal(ask({ items: [testing], settings: { ...SETTINGS, workingStatuses: [] } }).kind, 'still-on-it');
  assert.equal(ask({ items: [testing], settings: { ...SETTINGS, workingStatuses: null } }).kind, 'still-on-it');
});

test('counts in Arabic, not in a running total of hours', () => {
  assert.match(NUDGE_TEXT.overdue('T-1', 1).body, /من يوم\./);
  assert.match(NUDGE_TEXT.overdue('T-1', 2).body, /من يومين\./);
  assert.match(NUDGE_TEXT.overdue('T-1', 7).body, /من 7 أيام\./);
  assert.match(NUDGE_TEXT.overdue('T-1', 30).body, /من 30 يوم\./);
});

test('a long-running task is told in days, not in dozens of hours', () => {
  assert.match(NUDGE_TEXT.stillOnIt('T-1', 45).body, /بقالها 45 دقيقة /);
  assert.match(NUDGE_TEXT.stillOnIt('T-1', 5 * 60).body, /بقالها 5 ساعات /);
  assert.match(NUDGE_TEXT.stillOnIt('T-1', 30 * 60).body, /بقالها يوم /);
  assert.match(NUDGE_TEXT.stillOnIt('T-1', 80 * 60).body, /بقالها 3 أيام /);
});

test('the quarter past the hour is said, not swallowed', () => {
  const spelt = (minutes) => NUDGE_TEXT.stillOnIt('T-1', minutes).body.split(' In Progress')[0];

  assert.equal(spelt(60), 'بقالها ساعة');
  assert.equal(spelt(75), 'بقالها ساعة وربع');
  assert.equal(spelt(80), 'بقالها ساعة وتلت');
  assert.equal(spelt(90), 'بقالها ساعة ونص');
  assert.equal(spelt(105), 'بقالها ساعتين إلا ربع');
  assert.equal(spelt(120), 'بقالها ساعتين');
  assert.equal(spelt(130), 'بقالها ساعتين و10 دقايق');
  assert.equal(spelt(3 * 60 + 30), 'بقالها 3 ساعات ونص');
  assert.equal(spelt(61), 'بقالها ساعة ودقيقة');
});

test('the title carries the task, not the app name', () => {
  assert.equal(NUDGE_TEXT.stillOnIt('T-1', 60).title, 'T-1 لسه شغال عليها؟');
  assert.equal(NUDGE_TEXT.overdue('T-1', 2).title, 'T-1 عدّى معادها');
  assert.equal(NUDGE_TEXT.nothingInProgress(3).title, 'مفيش تاسك شغال عليها');
  assert.equal(NOTIFICATION_TEXT.actionFailedTitle('T-1'), 'T-1 ماتنفذش');
  assert.equal(NOTIFICATION_TEXT.actionFailedTitle(null), 'الأكشن ماتنفذش');
});
