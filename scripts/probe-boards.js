'use strict';

const path = require('path');
const fs = require('fs');
const { JiraClient } = require('../src/providers/jira/client');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function readCredentials() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(`no config.json at ${CONFIG_PATH}`);
    process.exit(1);
  }

  const stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  return {
    site: String(stored.site || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, ''),
    email: String(stored.email || '').trim(),
    token: String(stored.token || '').trim()
  };
}

async function main() {
  const client = new JiraClient(readCredentials());
  const boards = await client.get('/rest/agile/1.0/board?maxResults=50');
  const values = boards.values || [];

  console.log(`\n=== boards (${values.length}) ===\n`);

  for (const board of values) {
    const location = board.location || {};
    const project = location.projectKey || location.projectName || '?';
    console.log(`▸ ${board.name}   [id ${board.id} · ${board.type} · project ${project}]`);

    try {
      const configuration = await client.get(
        `/rest/agile/1.0/board/${board.id}/configuration`
      );
      const filterId = configuration.filter && configuration.filter.id;

      if (!filterId) {
        console.log('    no filter\n');
        continue;
      }

      const filter = await client.get(`/rest/api/3/filter/${filterId}`);
      console.log(`    filter: ${filter.name || filterId}`);
      console.log(`    JQL: ${filter.jql || '—'}`);
      if (configuration.subQuery && configuration.subQuery.query) {
        console.log(`    subQuery: ${configuration.subQuery.query}`);
      }
    } catch (error) {
      console.log(`    could not read the filter: ${error.message}`);
    }
    console.log('');
  }
}

main().catch((error) => console.log(`✗ ${error.message}`));
