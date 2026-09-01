'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  splitTopLevelAnd,
  parseInclusiveClause,
  inclusiveClauses
} = require('../src/providers/jira/jql');

test('splitTopLevelAnd drops the ORDER BY tail', () => {
  assert.deepEqual(splitTopLevelAnd('project = FPE ORDER BY Rank ASC'), ['project = FPE']);
});

test('splitTopLevelAnd splits on top-level AND only', () => {
  assert.deepEqual(
    splitTopLevelAnd('project = FPE AND (labels = a AND labels = b) AND type = Bug'),
    ['project = FPE', '(labels = a AND labels = b)', 'type = Bug']
  );
});

test('splitTopLevelAnd ignores AND inside quoted values', () => {
  assert.deepEqual(splitTopLevelAnd('summary ~ "cats AND dogs" AND type = Bug'), [
    'summary ~ "cats AND dogs"',
    'type = Bug'
  ]);
});

test('parseInclusiveClause reads a simple equality', () => {
  assert.deepEqual(parseInclusiveClause('labels = React'), { field: 'labels', value: 'React' });
});

test('parseInclusiveClause reads a single-value IN list', () => {
  assert.deepEqual(parseInclusiveClause('labels in (React)'), { field: 'labels', value: 'React' });
});

test('parseInclusiveClause reads quoted field names with brackets', () => {
  assert.deepEqual(parseInclusiveClause('"Task Type[Dropdown]" = "UI Task"'), {
    field: 'Task Type[Dropdown]',
    value: 'UI Task'
  });
});

test('parseInclusiveClause rejects negations', () => {
  assert.equal(parseInclusiveClause('labels != "React"'), null);
  assert.equal(parseInclusiveClause('labels IS EMPTY'), null);
  assert.equal(parseInclusiveClause('NOT labels = React'), null);
});

test('parseInclusiveClause rejects ranges', () => {
  assert.equal(parseInclusiveClause('due <= 2026-09-01'), null);
});

test('parseInclusiveClause rejects grouped clauses', () => {
  assert.equal(parseInclusiveClause('(labels = a OR labels = b)'), null);
});

test('parseInclusiveClause rejects multi-value IN lists', () => {
  assert.equal(parseInclusiveClause('labels in (React, Vue)'), null);
});

test('parseInclusiveClause ignores fields the board already implies', () => {
  assert.equal(parseInclusiveClause('project = FPE'), null);
  assert.equal(parseInclusiveClause('Rank = 1'), null);
});

test('inclusiveClauses keeps only the clauses it understood', () => {
  const jql =
    'project = FPE AND labels in (React) AND "Task Type" != "UI Task" ORDER BY Rank ASC';
  assert.deepEqual(
    inclusiveClauses(jql).map((entry) => entry.parsed),
    [{ field: 'labels', value: 'React' }]
  );
});
