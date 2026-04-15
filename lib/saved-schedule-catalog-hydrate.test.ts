import {
  catalogCourseForSavedCell,
  hydrateSavedCellDisplayFromCatalog,
} from '@/lib/saved-schedule-catalog-hydrate';
import type { Course } from '@/types/courses';

const sampleCatalog: Course[] = [
  {
    courseID: 'CS101',
    courseName: 'Intro CS',
    shortDescription: 'From catalog summary.',
    isMandatory: true,
    credits: 4,
    semester: 'A',
    availableSections: [],
  },
];

describe('hydrateSavedCellDisplayFromCatalog', () => {
  it('keeps description from saved cell when present', () => {
    const result = hydrateSavedCellDisplayFromCatalog(
      {
        courseCode: 'CS101',
        courseName: 'Intro CS',
        shortDescription: 'Saved inline text.',
      },
      sampleCatalog,
    );
    expect(result.shortDescription).toBe('Saved inline text.');
    expect(result.courseName).toBe('Intro CS');
  });

  it('fills shortDescription from catalog when missing on cell', () => {
    const result = hydrateSavedCellDisplayFromCatalog(
      { courseCode: 'CS101', courseName: 'Intro CS' },
      sampleCatalog,
    );
    expect(result.shortDescription).toBe('From catalog summary.');
  });

  it('fills course name from catalog when cell name empty', () => {
    const result = hydrateSavedCellDisplayFromCatalog({ courseCode: 'CS101' }, sampleCatalog);
    expect(result.courseName).toBe('Intro CS');
  });

  it('returns undefined description when catalog has none', () => {
    const result = hydrateSavedCellDisplayFromCatalog(
      { courseCode: 'ZZ999', courseName: 'Unknown' },
      sampleCatalog,
    );
    expect(result.shortDescription).toBeUndefined();
  });
});

describe('catalogCourseForSavedCell', () => {
  it('returns matching catalog course by code', () => {
    expect(catalogCourseForSavedCell({ courseCode: 'CS101' }, sampleCatalog)?.courseID).toBe(
      'CS101',
    );
  });

  it('returns undefined for unknown code', () => {
    expect(catalogCourseForSavedCell({ courseCode: 'Nope' }, sampleCatalog)).toBeUndefined();
  });
});
