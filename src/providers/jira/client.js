'use strict';

class JiraError extends Error {
  constructor(code, status, detail) {
    super(`${code}${status ? ` (${status})` : ''}${detail ? `: ${detail}` : ''}`);
    this.name = 'JiraError';
    this.code = code;
    this.status = status;
    this.detail = detail || '';
  }
}

function codeForStatus(status) {
  if (status === 401) return 'bad-credentials';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'jira-unavailable';
  return 'unexpected-response';
}

class JiraClient {
  constructor({ site, email, token }) {
    this.site = site;
    this.authorization = 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
  }

  async request(pathname, options = {}) {
    let response;
    try {
      response = await fetch(`https://${this.site}${pathname}`, {
        ...options,
        headers: {
          Authorization: this.authorization,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
    } catch {
      throw new JiraError('no-connection', 0);
    }

    if (!response.ok) {
      let detail = '';
      try {
        detail = (await response.text()).slice(0, 160);
      } catch {
        detail = '';
      }
      throw new JiraError(codeForStatus(response.status), response.status, detail);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  get(pathname) {
    return this.request(pathname);
  }

  post(pathname, payload) {
    return this.request(pathname, { method: 'POST', body: JSON.stringify(payload) });
  }

  put(pathname, payload) {
    return this.request(pathname, { method: 'PUT', body: JSON.stringify(payload) });
  }
}

module.exports = { JiraClient, JiraError };
