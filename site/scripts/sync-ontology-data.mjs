#!/usr/bin/env node
// Copies the canonical ontology JSON (../ontology/source/*.json) into
// src/data/generated/ so Astro pages can import it without reaching outside
// this project's root. This copy is itself generated -- see
// docs/05-data-model.md at the repo root for the source-of-truth policy.
// Runs automatically before `dev` and `build` (see package.json).
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SOURCE_DIR = join(REPO_ROOT, 'ontology', 'source');
const DEST_DIR = join(__dirname, '..', 'src', 'data', 'generated');

mkdirSync(DEST_DIR, { recursive: true });

for (const file of [
  'concepts.json',
  'relationships.json',
  'properties.json',
  'business-rules.json',
  'meta.json',
  'example.json',
]) {
  copyFileSync(join(SOURCE_DIR, file), join(DEST_DIR, file));
  console.log(`synced ${file} -> src/data/generated/${file}`);
}

// Reference-data schemes (Phase 3.7 Milestone 3) are one file per scheme, not
// a single JSON document, so they're synced as a directory instead.
const REFDATA_SOURCE_DIR = join(SOURCE_DIR, 'reference-data');
const REFDATA_DEST_DIR = join(DEST_DIR, 'reference-data');
mkdirSync(REFDATA_DEST_DIR, { recursive: true });
for (const file of readdirSync(REFDATA_SOURCE_DIR).filter((f) => f.endsWith('.json'))) {
  copyFileSync(join(REFDATA_SOURCE_DIR, file), join(REFDATA_DEST_DIR, file));
  console.log(`synced reference-data/${file} -> src/data/generated/reference-data/${file}`);
}

// Stamp a build-time lastUpdated onto the synced meta.json, derived from git
// rather than hand-maintained -- meta.json's own "version" field is the only
// hand-edited part, and it drifted (stuck at one value across several
// subsequent milestones) precisely because nothing forced it to be touched.
// A computed date can't drift the same way.
let lastUpdated = null;
try {
  lastUpdated = execFileSync(
    'git',
    ['log', '-1', '--format=%cI', '--', 'ontology/source'],
    { cwd: REPO_ROOT, encoding: 'utf8' }
  ).trim() || null;
} catch {
  console.warn('could not determine ontology/source last-updated date from git; omitting lastUpdated');
}

const metaPath = join(DEST_DIR, 'meta.json');
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
writeFileSync(metaPath, JSON.stringify({ ...meta, lastUpdated }, null, 2) + '\n');
console.log(`stamped lastUpdated (${lastUpdated ?? 'unknown'}) -> src/data/generated/meta.json`);
