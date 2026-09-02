'use strict';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
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

function inProgressSince(item) {
  return Date.parse(item.categoryChangedAt || item.updated || '') || null;
}

function stalest(working, at, staleDays) {
  return working
    .map((item) => ({ item, since: inProgressSince(item) }))
    .filter((entry) => entry.since && at - entry.since >= staleDays * DAY_MS)
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

  const working = open.filter((item) => item.category === IN_PROGRESS);

  if (!working.length) {
    if (at - (history.idleAt || 0) < settings.everyMinutes * MINUTE_MS) return null;
    return { kind: 'nothing-in-progress', count: open.length };
  }

  const oldest = stalest(working, at, settings.staleDays);
  if (!oldest) return null;
  if (at - (history.staleAt || 0) < DAY_MS) return null;

  return {
    kind: 'stale',
    key: oldest.item.key,
    title: oldest.item.title,
    days: Math.floor((at - oldest.since) / DAY_MS)
  };
}

module.exports = { decide, withinWorkingHours, minutesOfDay, DAY_MS };
