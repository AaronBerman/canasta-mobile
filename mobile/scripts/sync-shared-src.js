/**
 * Copies repo-root src/ into mobile/shared-src/ for EAS Build.
 * EAS uploads only the mobile/ folder (especially without git), so ../src must be vendored here.
 */
const fs = require('fs');
const path = require('path');

const mobileRoot = path.resolve(__dirname, '..');
const srcRoot = path.resolve(mobileRoot, '../src');
const dest = path.resolve(mobileRoot, 'shared-src');

if (!fs.existsSync(srcRoot)) {
  if (fs.existsSync(dest)) {
    console.log('[sync-shared-src] ../src missing; using existing mobile/shared-src');
    process.exit(0);
  }
  console.error('[sync-shared-src] ERROR: ../src not found and mobile/shared-src is missing.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(srcRoot, dest, { recursive: true });
console.log('[sync-shared-src] Copied ../src -> mobile/shared-src');
