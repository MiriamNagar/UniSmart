import type { Course } from '@/types/courses';
import type { BguCatalogJson } from '@/lib/bgu-catalog-to-courses';
import { bguCatalogToCourses } from '@/lib/bgu-catalog-to-courses';
import catalog from './bgu-cs-catalog.json';

/**
 * BGU catalog rows converted to {@link Course} for `generateSchedules`.
 * Seeded so snapshots / tests stay stable; change `seed` for different random rooms / mandatory flags.
 */
export const bguPlannerCourses: Course[] = bguCatalogToCourses(
	catalog as BguCatalogJson,
	{ seed: 42 },
);
