#!/usr/bin/env node
// Copies the canonical ontology JSON (../ontology/source/*.json) into
// src/data/generated/ so Astro pages can import it without reaching outside
// this project's root. This copy is itself generated -- see
// docs/05-data-model.md at the repo root for the source-of-truth policy.
// Runs automatically before `dev` and `build` (see package.json).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = join(__dirname, '..', '..', 'ontology', 'source');
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
