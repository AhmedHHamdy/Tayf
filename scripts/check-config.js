'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const MODERN_TOKEN_PREFIX = 'ATATT';
const SHORT_TOKEN_LENGTH = 30;
const BODY_PREVIEW_LENGTH = 300;

function normaliseSite(site) {
  return String(site).trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function suspiciousFormatting(value) {
  const problems = [];
  if (value !== value.trim()) problems.push('leading or trailing whitespace');
  if (/^["'].*["']$/.test(value.trim())) problems.push('wrapped in extra quotes');
  if (/\s/.test(value.trim())) problems.push('contains a space');
  return problems.length ? `  ⚠ ${problems.join(' · ')}` : '';
}

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log(`✗ not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH);
  console.log(`file found, ${raw.length} bytes`);
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    console.log('⚠ file has a BOM — save it as UTF-8 without BOM');
  }

  try {
    return JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    console.log(`✗ broken JSON: ${error.message}`);
    console.log('  (often curly quotes “ ” instead of straight ")');
    process.exit(1);
  }
}

function describeToken(token) {
  if (token.startsWith(MODERN_TOKEN_PREFIX)) return '  (looks like a current API token ✓)';
  if (token.length < SHORT_TOKEN_LENGTH) return '  ⚠ short — this may be a password, not a token';
  return '';
}

async function main() {
  console.log('\n=== Tayf config check ===\n');
  const stored = readConfig();

  const site = String(stored.site || '');
  const email = String(stored.email || '');
  const token = String(stored.token || '');

  console.log(`site  : "${site}"${suspiciousFormatting(site)}`);
  console.log(`email : "${email}"${suspiciousFormatting(email)}`);
  console.log(`token : ${token.length} chars${suspiciousFormatting(token)}${describeToken(token)}`);

  if (!/\.atlassian\.net$/i.test(normaliseSite(site))) {
    console.log('\n⚠ site should look like: your-company.atlassian.net');
  }
  if (!email.includes('@')) console.log('\n⚠ email does not look like an email address');

  const url = `https://${normaliseSite(site)}/rest/api/3/myself`;
  const authorization =
    'Basic ' + Buffer.from(`${email.trim()}:${token.trim()}`).toString('base64');

  console.log(`\ntrying: GET ${url}`);

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: authorization, Accept: 'application/json' }
    });
  } catch (error) {
    console.log(`✗ no connection: ${error.message}`);
    return;
  }

  console.log(`response: HTTP ${response.status}`);
  const body = await response.text();

  if (response.ok) {
    try {
      const me = JSON.parse(body);
      console.log(`\n✅ connected as ${me.displayName || me.emailAddress}`);
    } catch {
      console.log('\n✅ connected');
    }
    return;
  }

  if (response.status === 401) {
    console.log('\n✗ email or token rejected. Common causes:');
    console.log('  • the token was copied partially, or has a stray space');
    console.log('  • this is the account password, not an API token');
    console.log('  • the email is not exactly the Atlassian account email');
    console.log('  • the token belongs to a different account');
  } else if (response.status === 404) {
    console.log('\n✗ site not found — check the site name');
  } else if (response.status === 403) {
    console.log('\n✗ forbidden. The organisation may restrict API access');
  }

  console.log(`\nJira said: ${body.slice(0, BODY_PREVIEW_LENGTH)}`);
}

main();
