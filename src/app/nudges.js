'use strict';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const NEW = 'new';
const IN_PROGRESS = 'indeterminate';
const DONE = 'done';
const CLOCK = /^(\d{1,2}):(\d{2})$/;

function minutesOfDay(text) {
  const parts = CLOCK.exec(String(text || ''));
  if (!parts) return null;

  const hours = Number(parts[1]);
  const minutes = Number(parts[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function withinWorkingHours(now, settings) {
  if (!Array.isArray(settings.workDays) || !settings.workDays.includes(now.getDay())) {
    return false;
  }

  const start = minutesOfDay(settings.workStart);
  const end = minutesOfDay(settings.workEnd);
  if (start === null || end === null) return true;

  const minutes = now.getHours() * 60 + now.getMinutes();
  return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

function isWorking(item, workingStatuses) {
  if (!Array.isArray(workingStatuses) || !workingStatuses.length) {
    return item.category === IN_PROGRESS;
  }
  return item.category !== DONE && workingStatuses.includes(item.status);
}

function inProgressSince(item) {
  return Date.parse(item.categoryChangedAt || item.updated || '') || null;
}

function overdueBy(item, at, graceDays) {
  const due = Date.parse(item.due || '');
  if (!due) return 0;

  const past = at - due;
  return past >= (1 + graceDays) * DAY_MS ? Math.floor(past / DAY_MS) : 0;
}

function mostOverdue(items, at, graceDays) {
  return items
    .map((item) => ({ item, days: overdueBy(item, at, graceDays) }))
    .filter((entry) => entry.days > 0)
    .sort((first, second) => second.days - first.days)[0];
}

function longestRunning(items, at, minimumMs) {
  return items
    .map((item) => ({ item, since: inProgressSince(item) }))
    .filter((entry) => entry.since && at - entry.since >= minimumMs)
    .sort((first, second) => first.since - second.since)[0];
}

function decide({ items, idleSeconds, now, settings, history }) {
  if (!settings.enabled) return null;

  const at = now.getTime();
  if (settings.snoozeUntil && at < settings.snoozeUntil) return null;
  if (idleSeconds >= settings.idleMinutes * 60) return null;
  if (!withinWorkingHours(now, settings)) return null;

  const open = (items || []).filter((item) => item.category !== DONE);
  if (!open.length) return null;

  const late = settings.overdueEnabled ? mostOverdue(open, at, settings.overdueDays) : null;

  if (late && at - (history.overdueAt || 0) >= DAY_MS) {
    return {
      kind: 'overdue',
      key: late.item.key,
      title: late.item.title,
      days: late.days
    };
  }

  const working = open.filter((item) => isWorking(item, settings.workingStatuses));
  const startable = open.filter((item) => item.category === NEW);

  if (!working.length) {
    if (!startable.length) return null;
    if (at - (history.idleAt || 0) < settings.everyMinutes * MINUTE_MS) return null;
    return { kind: 'nothing-in-progress', count: startable.length };
  }

  if (!settings.checkEnabled) return null;

  const gap = settings.checkMinutes * MINUTE_MS;
  if (at - (history.checkAt || 0) < gap) return null;

  const onTime = settings.overdueEnabled
    ? working.filter((item) => !overdueBy(item, at, settings.overdueDays))
    : working;
  const running = longestRunning(onTime, at, gap);
  if (!running) return null;

  return {
    kind: 'still-on-it',
    key: running.item.key,
    title: running.item.title,
    minutes: Math.floor((at - running.since) / MINUTE_MS)
  };
}

module.exports = { decide, withinWorkingHours, minutesOfDay, overdueBy, isWorking, DAY_MS };
