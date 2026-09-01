import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toIsoDate,
  parseDueDate,
  parseEstimate,
  QUICK_DATES,
  DATE_WORDS
} from '../src/renderer/dates.js';

const TUESDAY = new Date(2026, 8, 1, 12);

test('toIsoDate pads month and day', () => {
  assert.equal(toIsoDate(new Date(2026, 0, 5)), '2026-01-05');
});

test('parseDueDate accepts an empty value as "no due date"', () => {
  assert.deepEqual(parseDueDate('', TUESDAY), { ok: true, value: null, label: '' });
});

test('parseDueDate understands today and tomorrow in Arabic and English', () => {
  assert.equal(parseDueDate('النهاردة', TUESDAY).value, '2026-09-01');
  assert.equal(parseDueDate('today', TUESDAY).value, '2026-09-01');
  assert.equal(parseDueDate('بكرة', TUESDAY).value, '2026-09-02');
  assert.equal(parseDueDate('tomorrow', TUESDAY).value, '2026-09-02');
  assert.equal(parseDueDate('بعد بكرة', TUESDAY).value, '2026-09-03');
});

test('parseDueDate understands a day offset with or without a plus sign', () => {
  assert.equal(parseDueDate('+3', TUESDAY).value, '2026-09-04');
  assert.equal(parseDueDate('3', TUESDAY).value, '2026-09-04');
});

test('parseDueDate resolves a weekday to the next one, never today', () => {
  assert.equal(parseDueDate('الخميس', TUESDAY).value, '2026-09-03');
  assert.equal(parseDueDate('التلات', TUESDAY).value, '2026-09-08');
});

test('parseDueDate accepts ISO and day/month forms', () => {
  assert.equal(parseDueDate('2026-12-31', TUESDAY).value, '2026-12-31');
  assert.equal(parseDueDate('7/9', TUESDAY).value, '2026-09-07');
});

test('parseDueDate reports text it cannot read instead of guessing', () => {
  const parsed = parseDueDate('sometime soon', TUESDAY);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.value, null);
  assert.ok(parsed.label.length > 0);
});

test('parseEstimate treats a bare number as minutes', () => {
  assert.equal(parseEstimate('90').value, '90m');
});

test('parseEstimate accepts Jira duration syntax', () => {
  assert.equal(parseEstimate('4h').value, '4h');
  assert.equal(parseEstimate('1d 4h').value, '1d 4h');
  assert.equal(parseEstimate('2w').value, '2w');
});

test('parseEstimate rejects anything else', () => {
  assert.equal(parseEstimate('soon').ok, false);
  assert.equal(parseEstimate('4 hours').ok, false);
});

test('every quick date is a phrase parseDueDate understands', () => {
  QUICK_DATES.forEach((quick) => {
    assert.equal(parseDueDate(quick.label, TUESDAY).ok, true, quick.label);
  });
});

test('every completion word is a phrase parseDueDate understands', () => {
  DATE_WORDS.forEach((word) => {
    assert.equal(parseDueDate(word, TUESDAY).ok, true, word);
  });
});
