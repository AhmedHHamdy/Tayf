'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { errorText, jiraComplaints, ERROR_TEXT } = require('../src/strings');
const { JiraError } = require('../src/providers/jira/client');

const BUG_REJECTION = JSON.stringify({
  errorMessages: [
    'Field Bug Source is required.',
    'Field Bugs Type is required.',
    'Field Description is required.'
  ],
  errors: {}
});

test('jiraComplaints reads the display-name list', () => {
  assert.equal(
    jiraComplaints(BUG_REJECTION),
    'Field Bug Source is required.  ·  Field Bugs Type is required.  ·  Field Description is required.'
  );
});

test('jiraComplaints reads the field-keyed map too', () => {
  const detail = JSON.stringify({
    errorMessages: [],
    errors: { summary: 'Summary is required.', duedate: 'Date cannot be parsed.' }
  });
  assert.equal(jiraComplaints(detail), 'Summary is required.  ·  Date cannot be parsed.');
});

test('jiraComplaints passes a non-JSON body through', () => {
  assert.equal(jiraComplaints('<html>gateway</html>'), '<html>gateway</html>');
});

test('jiraComplaints stays quiet when there is nothing to say', () => {
  assert.equal(jiraComplaints(''), '');
  assert.equal(jiraComplaints(JSON.stringify({ errorMessages: [], errors: {} })), '');
});

test('a rejected create says which fields Jira wanted', () => {
  const message = errorText(new JiraError('unexpected-response', 400, BUG_REJECTION));
  assert.match(message, /Bug Source/);
  assert.match(message, /Bugs Type/);
  assert.ok(message.startsWith(ERROR_TEXT.rejected));
});

test('a rejection with no readable body falls back to the generic line', () => {
  assert.equal(
    errorText(new JiraError('unexpected-response', 400, '')),
    ERROR_TEXT['unexpected-response']
  );
});

test('other codes keep their own wording', () => {
  assert.equal(
    errorText(new JiraError('bad-credentials', 401, 'anything')),
    ERROR_TEXT['bad-credentials']
  );
  assert.equal(
    errorText(new JiraError('jira-unavailable', 503, '')),
    `${ERROR_TEXT['jira-unavailable']} (503)`
  );
});
