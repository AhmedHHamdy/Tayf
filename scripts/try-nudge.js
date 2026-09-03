'use strict';

const fs = require('fs');
const path = require('path');
const { app, Notification, powerMonitor } = require('electron');

const { decide, withinWorkingHours, overdueBy, isWorking } = require('../src/app/nudges');
const { NUDGE_KEYS } = require('../src/storage/settings');
const { NUDGE_TEXT } = require('../src/strings');

const TEXT_FOR = {
  'nothing-in-progress': (decision) => NUDGE_TEXT.nothingInProgress(decision.count),
  overdue: (decision) => NUDGE_TEXT.overdue(decision.key, decision.days),
  'still-on-it': (decision) => NUDGE_TEXT.stillOnIt(decision.key, decision.minutes)
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const anyway = process.argv.includes('--anyway');
const all = process.argv.includes('--all');
const SPACING_MS = 4000;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return fallback;
  }
}

function mark(ok) {
  return ok ? '✓' : '✗';
}

function clock(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function spellGap(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ${minutes % 60}m` : `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function loosen(settings, now) {
  return {
    ...settings,
    workDays: [now.getDay()],
    workStart: '00:00',
    workEnd: '23:59',
    idleMinutes: Number.MAX_SAFE_INTEGER,
    snoozeUntil: null
  };
}

function reportGates(settings, items, idleSeconds, now) {
  const open = items.filter((one) => one.category !== 'done');
  const snoozed = settings.snoozeUntil && Date.now() < settings.snoozeUntil;
  const away = idleSeconds >= settings.idleMinutes * 60;
  const working = withinWorkingHours(now, settings);

  console.log('\ngates');
  console.log(`  ${mark(settings.enabled)} switched on`);
  console.log(`  ${mark(!snoozed)} not snoozed`);
  console.log(
    `  ${mark(!away)} at the machine — idle ${idleSeconds}s, gives up at ${settings.idleMinutes * 60}s`
  );
  console.log(
    `  ${mark(working)} inside working hours — now ${clock(now)} ${DAY_NAMES[now.getDay()]}, ` +
      `set to ${settings.workStart}–${settings.workEnd} on ${settings.workDays.map((day) => DAY_NAMES[day]).join(' ')}`
  );
  console.log(`  ${mark(open.length > 0)} something to move — ${open.length} open of ${items.length}`);

  return { open, blocked: !settings.enabled || snoozed || away || !working || !open.length };
}

function reportItems(open, settings, now) {
  const at = now.getTime();
  console.log('\ntasks');

  open.forEach((one) => {
    const since = Date.parse(one.categoryChangedAt || one.updated || '') || null;
    const late = overdueBy(one, at, settings.overdueDays);
    const mine = isWorking(one, settings.workingStatuses);
    const running = mine && since ? `in progress ${spellGap(at - since)}` : '';

    console.log(
      `  ${one.key.padEnd(10)} ${(mine ? 'in hand' : String(one.status || one.category)).padEnd(22)} ` +
        `${(one.due || 'no date').padEnd(11)} ` +
        `${(late ? `${late} days late` : '').padEnd(14)} ${running}`
    );
  });
}

function show(decision) {
  const text = TEXT_FOR[decision.kind](decision);
  console.log(`\n  ${decision.kind}${decision.key ? ` — ${decision.key}` : ''}`);
  console.log(`    ${text.title}`);
  console.log(`    ${text.body}`);

  if (!Notification.isSupported()) {
    console.log('    ✗ this machine cannot show notifications');
    return;
  }

  const toast = new Notification({ title: text.title, body: text.body, silent: false });
  toast.on('show', () => console.log('    ✓ handed to the system — look bottom right'));
  toast.on('failed', (_event, error) => console.log(`    ✗ the system refused it: ${error}`));
  toast.show();
}

function everyKind(items, idleSeconds, now, settings) {
  const base = loosen(settings, now);
  const history = { idleAt: 0, overdueAt: 0, checkAt: 0 };
  const ask = (overrides, list) =>
    decide({ items: list || items, idleSeconds, now, settings: { ...base, ...overrides }, history });

  const seen = new Set();
  return [
    ask({}),
    ask({ overdueEnabled: false }),
    ask({ overdueEnabled: false }, items.filter((one) => one.category !== 'indeterminate'))
  ].filter((decision) => decision && !seen.has(decision.kind) && seen.add(decision.kind));
}

function main() {
  const folder = app.getPath('userData');
  const stored = readJson(path.join(folder, 'settings.json'), {});
  const settings = {
    ...Object.fromEntries(Object.entries(NUDGE_KEYS).map(([name, key]) => [name, stored[key]])),
    snoozeUntil: stored.nudgeSnoozeUntil
  };
  const cache = readJson(path.join(folder, 'cache.json'), { issues: [] });
  const items = cache.issues || [];
  const now = new Date();
  const idleSeconds = powerMonitor.getSystemIdleTime();

  console.log('\n=== Tayf nudge test ===');
  console.log(`\nreading ${folder}`);
  console.log(`board   : ${items.length} tasks, cached ${spellGap(Date.now() - new Date(cache.fetchedAt).getTime())} ago`);

  const { open, blocked } = reportGates(settings, items, idleSeconds, now);
  if (open.length) reportItems(open, settings, now);

  if (all) {
    const kinds = everyKind(items, idleSeconds, now, settings);
    console.log(`\nverdict : previewing ${kinds.length} of 3 kinds  (clock ignored)`);
    kinds.forEach((decision, index) => setTimeout(() => show(decision), index * SPACING_MS));
    setTimeout(() => app.quit(), kinds.length * SPACING_MS + 10000);
    return;
  }

  const used = anyway ? loosen(settings, now) : settings;
  const decision = decide({
    items,
    idleSeconds,
    now,
    settings: used,
    history: { idleAt: 0, overdueAt: 0, checkAt: 0 }
  });

  if (!decision) {
    console.log('\nverdict : quiet');
    if (blocked && !anyway) {
      console.log('          a gate above is closed — run with --anyway to ignore the clock and the idle check');
    } else {
      console.log('          every gate is open, but no task earns a nudge right now');
    }
    app.quit();
    return;
  }

  console.log(`\nverdict : ${decision.kind}${decision.key ? ` — ${decision.key}` : ''}${anyway ? '  (clock ignored)' : ''}`);
  show(decision);
  setTimeout(() => app.quit(), 15000);
}

app.setName('Tayf');
app.setAppUserModelId('com.tayf.overlay');
app.whenReady().then(main);
