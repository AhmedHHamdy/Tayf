'use strict';

const { toWorkItem, toWorkItemDetail, toTransition, textToDocument } = require('./mappers');

const ASSIGNED_AND_OPEN =
  'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC';

const LIST_FIELDS = [
  'summary',
  'status',
  'priority',
  'issuetype',
  'updated',
  'statuscategorychangedate',
  'duedate',
  'assignee',
  'timetracking',
  'aggregatetimespent',
  'project'
].join(',');

const ENDPOINT_GONE = new Set([404, 410]);

async function fetchAssignedItems(client) {
  const query = new URLSearchParams({
    jql: ASSIGNED_AND_OPEN,
    fields: LIST_FIELDS,
    maxResults: '50'
  }).toString();

  try {
    const page = await client.get(`/rest/api/3/search/jql?${query}`);
    return (page.issues || []).map(toWorkItem);
  } catch (error) {
    if (!ENDPOINT_GONE.has(error.status)) throw error;
    const page = await client.get(`/rest/api/3/search?${query}`);
    return (page.issues || []).map(toWorkItem);
  }
}

async function fetchItem(client, key) {
  const issue = await client.get(`/rest/api/3/issue/${encodeURIComponent(key)}`);
  return toWorkItemDetail(issue);
}

async function updateItem(client, key, fields) {
  const payload = { ...fields };
  if (typeof payload.description === 'string') {
    payload.description = textToDocument(payload.description);
  }
  await client.put(`/rest/api/3/issue/${encodeURIComponent(key)}`, { fields: payload });
}

async function fetchTransitions(client, key) {
  const response = await client.get(
    `/rest/api/3/issue/${encodeURIComponent(key)}/transitions?expand=transitions.fields`
  );
  return (response.transitions || []).map(toTransition);
}

async function logWork(client, key, timeSpent) {
  await client.post(
    `/rest/api/3/issue/${encodeURIComponent(key)}/worklog?notifyUsers=false&adjustEstimate=auto`,
    { timeSpent }
  );
}

async function applyTransition(client, key, transitionId, extras = {}) {
  const { fieldsBefore, timeSpent, transitionFields } = extras;

  if (fieldsBefore && Object.keys(fieldsBefore).length) {
    await updateItem(client, key, fieldsBefore);
  }
  if (timeSpent) {
    await logWork(client, key, timeSpent);
  }

  const payload = { transition: { id: transitionId } };
  if (transitionFields && Object.keys(transitionFields).length) {
    payload.fields = transitionFields;
  }
  await client.post(`/rest/api/3/issue/${encodeURIComponent(key)}/transitions`, payload);
}

async function createItem(client, draft) {
  const fields = {
    project: { key: draft.projectKey },
    summary: draft.summary,
    issuetype: { id: draft.typeId }
  };

  if (draft.assigneeId) fields.assignee = { accountId: draft.assigneeId };

  const description = textToDocument(draft.description);
  if (description) fields.description = description;
  if (draft.due) fields.duedate = draft.due;
  if (draft.estimate) fields.timetracking = { originalEstimate: draft.estimate };

  Object.assign(fields, draft.dateFields || {}, draft.optionFields || {});

  const created = await client.post('/rest/api/3/issue', { fields });
  return created && created.key;
}

module.exports = {
  ASSIGNED_AND_OPEN,
  fetchAssignedItems,
  fetchItem,
  updateItem,
  fetchTransitions,
  applyTransition,
  logWork,
  createItem
};
