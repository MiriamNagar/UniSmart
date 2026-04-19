import type { Course } from '@/types/courses';

/**
 * Raw cell shape from Firestore saved schedules (matches planner generated cells).
 */
export type SavedScheduleCellLike = {
  courseCode?: string;
  courseName?: string;
  shortDescription?: string;
};

/**
 * Fills missing short descriptions from the active catalog when the saved doc
 * predates description persistence or strips undefined on save.
 */
export function hydrateSavedCellDisplayFromCatalog(
  cell: SavedScheduleCellLike,
  catalogCourses: Course[],
): { shortDescription: string | undefined; courseName: string } {
  const code = (cell.courseCode ?? '').trim();
  const catalogCourse = code
    ? catalogCourses.find((c) => c.courseID === code)
    : undefined;

  const fromCell = cell.shortDescription?.trim();
  const fromCatalog = catalogCourse?.shortDescription?.trim();
  const shortDescription = fromCell || fromCatalog || undefined;

  const nameFromCell = cell.courseName?.trim();
  const courseName = nameFromCell || catalogCourse?.courseName || 'Unknown';

  return { shortDescription, courseName };
}

export function catalogCourseForSavedCell(
  cell: SavedScheduleCellLike,
  catalogCourses: Course[],
): Course | undefined {
  const code = (cell.courseCode ?? '').trim();
  if (!code) {
    return undefined;
  }
  return catalogCourses.find((c) => c.courseID === code);
}
