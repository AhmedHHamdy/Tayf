'use strict';

const NEGATION_OR_RANGE = /(!=|\bNOT\b|\bIS\s+EMPTY\b|\bIS\s+NOT\b|\b(<|>)=?)/i;
const CLAUSE = /^(?:"([^"]+)"|'([^']+)'|([A-Za-z][\w\s[\].]*?))\s*(=|\bin\b)\s*(.+)$/i;
const IMPLIED_BY_BOARD = /^(project|rank)$/i;

function splitTopLevelAnd(jql) {
  const text = String(jql || '').replace(/\s+ORDER\s+BY[\s\S]*$/i, '');
  const clauses = [];
  let depth = 0;
  let current = '';
  let index = 0;

  while (index < text.length) {
    const character = text[index];

    if (character === '"' || character === "'") {
      const quote = character;
      current += character;
      index += 1;
      while (index < text.length && text[index] !== quote) {
        current += text[index];
        index += 1;
      }
      if (index < text.length) {
        current += text[index];
        index += 1;
      }
      continue;
    }

    if (character === '(') depth += 1;
    else if (character === ')') depth -= 1;

    if (depth === 0 && /\s/.test(character)) {
      const separator = text.slice(index).match(/^\s+AND\s+/i);
      if (separator) {
        if (current.trim()) clauses.push(current.trim());
        current = '';
        index += separator[0].length;
        continue;
      }
    }

    current += character;
    index += 1;
  }

  if (current.trim()) clauses.push(current.trim());
  return clauses;
}

function stripQuotes(value) {
  const text = String(value || '').trim();
  const quoted = text.match(/^["'](.*)["']$/);
  return quoted ? quoted[1] : text;
}

function parseInclusiveClause(clause) {
  const text = clause.trim();
  if (text.startsWith('(')) return null;
  if (NEGATION_OR_RANGE.test(text)) return null;

  const parts = text.match(CLAUSE);
  if (!parts) return null;

  const field = (parts[1] || parts[2] || parts[3] || '').trim();
  const operator = parts[4].toLowerCase();
  let value = parts[5].trim();

  if (operator === 'in') {
    const listed = value
      .replace(/^\(/, '')
      .replace(/\)$/, '')
      .split(',')
      .map(stripQuotes)
      .filter(Boolean);
    if (listed.length !== 1) return null;
    value = listed[0];
  } else {
    value = stripQuotes(value);
  }

  if (!field || !value) return null;
  if (IMPLIED_BY_BOARD.test(field)) return null;

  return { field, value };
}

function inclusiveClauses(jql) {
  return splitTopLevelAnd(jql)
    .map((clause) => ({ clause, parsed: parseInclusiveClause(clause) }))
    .filter((entry) => entry.parsed !== null);
}

module.exports = { splitTopLevelAnd, stripQuotes, parseInclusiveClause, inclusiveClauses };
