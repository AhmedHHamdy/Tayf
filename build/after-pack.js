'use strict';

const fs = require('fs');
const path = require('path');

const KEPT_LOCALE = 'en-US.pak';
const UNUSED_BINARIES = ['dxcompiler.dll'];
const BYTES_PER_MEGABYTE = 1048576;

function removeFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const { size } = fs.statSync(filePath);
  fs.unlinkSync(filePath);
  return size;
}

function removeUnusedLocales(appOutDir) {
  const localesDir = path.join(appOutDir, 'locales');
  if (!fs.existsSync(localesDir)) return 0;

  return fs
    .readdirSync(localesDir)
    .filter((name) => name !== KEPT_LOCALE)
    .reduce((freed, name) => freed + removeFile(path.join(localesDir, name)), 0);
}

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;

  const freed =
    removeUnusedLocales(context.appOutDir) +
    UNUSED_BINARIES.reduce(
      (total, name) => total + removeFile(path.join(context.appOutDir, name)),
      0
    );

  console.log(`  • trimmed ${(freed / BYTES_PER_MEGABYTE).toFixed(1)} MB of unused files`);
};
