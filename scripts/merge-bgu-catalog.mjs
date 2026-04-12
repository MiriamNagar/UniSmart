/**
 * Merges mockData/bgu-course-offerings.json + mockData/bgu-course-prerequisites.json
 * into mockData/bgu-cs-catalog.json (Firestore-friendly: one object per course name).
 *
 * Run: node scripts/merge-bgu-catalog.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const offerings = JSON.parse(
  readFileSync(join(root, 'mockData/bgu-course-offerings.json'), 'utf8'),
);
const prerequisites = JSON.parse(
  readFileSync(join(root, 'mockData/bgu-course-prerequisites.json'), 'utf8'),
);

const names = new Set([...Object.keys(offerings), ...Object.keys(prerequisites)]);

const catalog = {
  schemaVersion: 1,
  program: 'bgu_computer_science',
  courses: {},
};

for (const name of names) {
  catalog.courses[name] = {
    name,
    offerings: offerings[name] ?? [],
    prerequisites: prerequisites[name] ?? [],
  };
}

const outPath = join(root, 'mockData/bgu-cs-catalog.json');
writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Wrote ${outPath} (${names.size} courses)`);
