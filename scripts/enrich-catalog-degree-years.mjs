/**
 * Ensures each course has at least one offering per (semester, degree-year) pair
 * when that course already has any offering in that semester — by cloning a template row.
 * Improves demo UX where raw exports only listed a few (semester × year) cells.
 */
import fs from 'fs';

const root = new URL('..', import.meta.url);
const path = new URL('../mockData/bgu-cs-catalog.json', import.meta.url);

const j = JSON.parse(fs.readFileSync(path, 'utf8'));

const SEMESTERS = ['א', 'ב'];
const YEARS = ['א', 'ב', 'ג'];

function enrichPair(semHeb, yearHeb) {
	let added = 0;
	for (const course of Object.values(j.courses)) {
		const offerings = course.offerings;
		const has = offerings.some((o) => o.semester.trim() === semHeb && o.year.trim() === yearHeb);
		if (has) continue;
		const inSem = offerings.filter((o) => o.semester.trim() === semHeb);
		if (inSem.length === 0) continue;
		const template =
			inSem.find((o) => o.year.trim() !== yearHeb) ?? inSem[0];
		offerings.push({ ...template, year: yearHeb });
		added++;
	}
	return added;
}

let total = 0;
for (const sem of SEMESTERS) {
	for (const y of YEARS) {
		total += enrichPair(sem, y);
	}
}

fs.writeFileSync(path, `${JSON.stringify(j, null, 2)}\n`, 'utf8');
console.log(`enrich-catalog-degree-years: added ${total} synthetic offerings`);
