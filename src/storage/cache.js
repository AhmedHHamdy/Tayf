'use strict';

const { cacheFile } = require('./paths');
const { readJson, writeJsonQuietly } = require('./json-file');

const EMPTY = { items: [], fetchedAt: null, boardsByItemKey: {}, transitionsNeedingWorklog: [] };

function readCache() {
  const stored = readJson(cacheFile(), null);
  if (!stored) return { ...EMPTY };

  return {
    items: Array.isArray(stored.items) ? stored.items : [],
    fetchedAt: stored.fetchedAt || null,
    boardsByItemKey: stored.boardsByItemKey || {},
    transitionsNeedingWorklog: Array.isArray(stored.transitionsNeedingWorklog)
      ? stored.transitionsNeedingWorklog
      : []
  };
}

function writeCache(snapshot) {
  return writeJsonQuietly(cacheFile(), {
    items: snapshot.items,
    fetchedAt: snapshot.fetchedAt,
    boardsByItemKey: snapshot.boardsByItemKey,
    transitionsNeedingWorklog: snapshot.transitionsNeedingWorklog
  });
}

module.exports = { readCache, writeCache };
