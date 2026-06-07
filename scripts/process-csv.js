#!/usr/bin/env node
/**
 * Convert a LinkedIn Analytics CSV export to a JSON data file.
 * Usage: node scripts/process-csv.js data/raw/<file>.csv [--type company|founders]
 */

const fs = require('fs');
const path = require('path');

const [,, inputFile, ...flags] = process.argv;

if (!inputFile) {
  console.error('Usage: node scripts/process-csv.js <input.csv> [--type company|founders]');
  process.exit(1);
}

const typeFlag = flags.indexOf('--type');
const type = typeFlag !== -1 ? flags[typeFlag + 1] : 'company';

const raw = fs.readFileSync(inputFile, 'utf8');
const lines = raw.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

const rows = lines.slice(1).map(line => {
  const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
  return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
});

const outDir = path.join(path.dirname(inputFile), '..', 'processed');
fs.mkdirSync(outDir, { recursive: true });

const baseName = path.basename(inputFile, '.csv');
const outFile = path.join(outDir, `${baseName}.json`);

fs.writeFileSync(outFile, JSON.stringify({ source: baseName, type, rows }, null, 2));
console.log(`Written: ${outFile} (${rows.length} rows)`);
