import { buildPlannerCatalogUiModel } from './planner-catalog-ui-messages';

const TERM = 'Year 2 · Semester B';

describe('buildPlannerCatalogUiModel', () => {
	it('shows loading copy without retry', () => {
		const m = buildPlannerCatalogUiModel({
			hasFirebaseDb: true,
			source: 'mock',
			loadError: null,
			loading: true,
			activeTermSummary: TERM,
		});
		expect(m.showRetry).toBe(false);
		expect(m.headline).toContain('Loading');
		expect(m.bodyLines.some((l) => l.includes(TERM))).toBe(true);
	});

	it('offline build: demo catalog, no retry', () => {
		const m = buildPlannerCatalogUiModel({
			hasFirebaseDb: false,
			source: 'mock',
			loadError: null,
			loading: false,
			activeTermSummary: TERM,
		});
		expect(m.showRetry).toBe(false);
		expect(m.headline).toMatch(/Demo|offline/i);
		expect(m.bodyLines.join(' ')).toMatch(/bundled/i);
	});

	it('Firestore success: seeded wording, no retry', () => {
		const m = buildPlannerCatalogUiModel({
			hasFirebaseDb: true,
			source: 'firestore',
			loadError: null,
			loading: false,
			activeTermSummary: TERM,
		});
		expect(m.showRetry).toBe(false);
		expect(m.headline).toMatch(/Firestore/i);
		expect(m.bodyLines.join(' ')).toMatch(/registrar|planning/i);
	});

	it('Firestore failure with fallback: retry + error detail', () => {
		const m = buildPlannerCatalogUiModel({
			hasFirebaseDb: true,
			source: 'mock',
			loadError: 'permission-denied',
			loading: false,
			activeTermSummary: TERM,
		});
		expect(m.showRetry).toBe(true);
		expect(m.headline).toMatch(/Could not load/i);
		expect(m.bodyLines.some((l) => l.includes('permission-denied'))).toBe(true);
	});

	it('always includes non-enrollment guidance in compact note', () => {
		const variants = [
			buildPlannerCatalogUiModel({
				hasFirebaseDb: false,
				source: 'mock',
				loadError: null,
				loading: false,
				activeTermSummary: TERM,
			}),
			buildPlannerCatalogUiModel({
				hasFirebaseDb: true,
				source: 'firestore',
				loadError: null,
				loading: false,
				activeTermSummary: TERM,
			}),
		];
		for (const m of variants) {
			expect(m.compactNonEnrollmentNote.toLowerCase()).toMatch(/not an official enrollment/);
		}
	});
});
