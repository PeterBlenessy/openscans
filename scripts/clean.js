#!/usr/bin/env node
/**
 * Remove build artifacts for a clean rebuild — cross-platform (don't use
 * `rm -rf` in package.json; it breaks on Windows).
 *
 * Removes the frontend `dist/` and Vite's cache, then `cargo clean -p app` so
 * our Tauri crate recompiles fresh while cached dependencies are kept (fast).
 *
 * Usage:
 *   node scripts/clean.js          # clean dist, vite cache, the app crate
 *   node scripts/clean.js --deep   # also wipe all of src-tauri/target (slow:
 *                                   # forces a full recompile of every dep)
 */
import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const deep = process.argv.includes('--deep');

function rm(rel) {
  const p = join(root, rel);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`✓ removed ${rel}`);
  }
}

rm('dist');
rm('node_modules/.vite');

if (deep) {
  rm('src-tauri/target');
} else {
  // Clean only our crate so dependency builds stay cached.
  const res = spawnSync('cargo', ['clean', '-p', 'app'], {
    cwd: join(root, 'src-tauri'),
    stdio: 'inherit',
  });
  if (res.error || res.status !== 0) {
    console.warn('⚠ cargo clean skipped (cargo unavailable or failed)');
  } else {
    console.log('✓ cargo clean -p app');
  }
}

console.log('Clean complete.');
