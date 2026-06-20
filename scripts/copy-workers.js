#!/usr/bin/env node
/**
 * Copy Cornerstone WADO Image Loader web worker to public directory
 * This is needed for Tauri to load workers without blob URLs.
 *
 * (The embedded blob-worker source-map ref that WKWebView complains about on
 * startup is stripped at build time in vite.config.ts — NOT by patching
 * node_modules, which pnpm reverts from its content-addressed store on install.)
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Source worker file from node_modules
const workerSource = join(
  projectRoot,
  'node_modules/cornerstone-wado-image-loader/dist/index.worker.bundle.min.worker.js'
);

// Destination in public folder
const publicDir = join(projectRoot, 'public');
const workerDest = join(publicDir, 'cornerstoneWADOImageLoaderWebWorker.js');

try {
  // Create public directory if it doesn't exist
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  // Copy worker file (strip its own trailing source-map comment).
  if (existsSync(workerSource)) {
    const worker = readFileSync(workerSource, 'utf8');
    const stripped = worker.replace(/\n?\/\/# sourceMappingURL=\S+\s*$/, '\n');
    writeFileSync(workerDest, stripped);
    console.log('✓ Copied Cornerstone web worker to public directory (source-map ref stripped)');
  } else {
    console.warn('⚠ Cornerstone web worker not found, skipping copy');
  }
} catch (error) {
  console.error('✗ Failed to copy Cornerstone web worker:', error.message);
  // Don't fail the build if worker copy fails
  process.exit(0);
}
