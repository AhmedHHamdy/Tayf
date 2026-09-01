'use strict';

const OPTION_FIELD = /^customfield_/;
const START_DATE_NAME = /start|بداي/i;
const DUE_DATE_NAME = /due|deadline|تسليم|استحقاق/i;
const ALWAYS_PRESENT_ON_CREATE = ['summary', 'project', 'issuetype'];

const PERMISSIVE_CREATE_FIELDS = {
  optionFields: [],
  dateFields: [],
  hasAssignee: true,
  hasDueDate: true,
  hasEstimate: true,
  requiredFieldNames: []
};

async function fetchCurrentUser(client) {
  const me = await client.get('/rest/api/3/myself');
  if (!me) return null;
  return { accountId: me.accountId, name: me.displayName || me.emailAddress };
}

async function fetchProjects(client) {
  const page = await client.get(
    '/rest/api/3/project/search?maxResults=100&orderBy=lastIssueUpdatedTime'
  );
  return (page.values || []).map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name
  }));
}

async function fetchIssueTypes(client, projectKey) {
  const response = await client.get(
    `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes?maxResults=60`
  );
  const types = response.issueTypes || response.values || [];
  return types
    .filter((type) => !type.subtask)
    .map((type) => ({ id: type.id, name: type.name }));
}

async function fetchAssignableUsers(client, projectKey) {
  const users = await client.get(
    `/rest/api/3/user/assignable/search?project=${encodeURIComponent(projectKey)}&maxResults=100`
  );
  return (users || [])
    .filter((user) => user.accountType === 'atlassian' && user.active !== false)
    .map((user) => ({ accountId: user.accountId, name: user.displayName }));
}

function toOptionField(field) {
  return {
    id: field.fieldId,
    name: String(field.name || '').trim(),
    required: !!field.required,
    values: field.allowedValues.map((value) => ({ id: value.id, value: value.value }))
  };
}

function toDateField(field) {
  const name = String(field.name || '').trim();
  return {
    id: field.fieldId,
    name,
    isStartDate: START_DATE_NAME.test(name),
    isDueDate: DUE_DATE_NAME.test(name)
  };
}

function isSelectableOptionField(field) {
  return (
    OPTION_FIELD.test(field.fieldId) &&
    field.schema &&
    field.schema.type === 'option' &&
    Array.isArray(field.allowedValues) &&
    field.allowedValues.length > 0
  );
}

function isCustomDateField(field) {
  return OPTION_FIELD.test(field.fieldId) && field.schema && field.schema.type === 'date';
}

async function fetchCreateFields(client, projectKey, typeId) {
  let fields;
  try {
    const response = await client.get(
      `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}` +
        `/issuetypes/${encodeURIComponent(typeId)}?maxResults=100`
    );
    fields = response.fields || response.values || [];
  } catch {
    return { ...PERMISSIVE_CREATE_FIELDS };
  }

  const fieldIds = fields.map((field) => field.fieldId);

  return {
    optionFields: fields.filter(isSelectableOptionField).map(toOptionField),
    dateFields: fields.filter(isCustomDateField).map(toDateField),
    hasAssignee: fieldIds.includes('assignee'),
    hasDueDate: fieldIds.includes('duedate'),
    hasEstimate: fieldIds.includes('timetracking'),
    requiredFieldNames: fields
      .filter((field) => field.required && !ALWAYS_PRESENT_ON_CREATE.includes(field.fieldId))
      .map((field) => field.name)
  };
}

async function fetchFieldsByClauseName(client) {
  const fields = await client.get('/rest/api/3/field');
  const index = {};
  fields.forEach((field) => {
    [...(field.clauseNames || []), field.name].forEach((clauseName) => {
      if (clauseName) index[String(clauseName).toLowerCase()] = field;
    });
  });
  return index;
}

module.exports = {
  fetchCurrentUser,
  fetchProjects,
  fetchIssueTypes,
  fetchAssignableUsers,
  fetchCreateFields,
  fetchFieldsByClauseName,
  PERMISSIVE_CREATE_FIELDS
};
