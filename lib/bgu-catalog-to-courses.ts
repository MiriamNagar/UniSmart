import type { Course, CourseSection, Lesson } from "@/types/courses";
import { Days } from "@/types/courses";

/** Raw offering row from `mockData/bgu-cs-catalog.json` */
export interface BguOfferingRow {
  type: string;
  lecturer: string;
  language?: string;
  semester: string;
  year: string;
  time: string;
  credits: number;
  weekly_hours: number;
  places: number;
}

export interface BguCatalogCourse {
  name: string;
  shortDescription?: string;
  short_description?: string;
  summary?: string;
  description?: string;
  offerings: BguOfferingRow[];
  prerequisites: string[];
}

export interface BguCatalogJson {
  schemaVersion?: number;
  program?: string;
  courses: Record<string, BguCatalogCourse>;
}

export interface BguToCoursesOptions {
  /**
   * Seed for pseudo-random room numbers and mandatory flags.
   * Same seed → same output (useful for tests / stable UI).
   */
  seed?: number;
  /**
   * When true (default), if `places` is missing or 0, pick a random availability 5–40.
   * Always encoded in `location` for display (algorithm ignores it).
   */
  randomizeAvailabilityWhenZero?: boolean;
}

const HEBREW_DAY_TO_EN: Record<string, Days> = {
  א: Days.Sun,
  ב: Days.Mon,
  ג: Days.Tue,
  ד: Days.Wed,
  ה: Days.Thu,
  ו: Days.Fri,
};

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mapSemester(heb: string): "A" | "B" | "summer" {
  const t = heb.trim();
  if (t === "א") return "A";
  if (t === "ב") return "B";
  return "summer";
}

function mapLessonType(raw: string): Lesson["type"] {
  const r = raw.trim();
  if (r.includes("מעבדה")) return "Lab";
  if (r.includes("תרגיל")) return "Tutorial";
  return "Lecture";
}

function isLectureRow(rawType: string): boolean {
  return mapLessonType(rawType) === "Lecture";
}

function isTutorialRow(rawType: string): boolean {
  return mapLessonType(rawType) === "Tutorial";
}

function isLabRow(rawType: string): boolean {
  return mapLessonType(rawType) === "Lab";
}

/**
 * Parse strings like `יום ג 10:00-13:00`. Israeli convention: א = Sunday.
 */
export function parseBguTimeField(
  time: string,
): { day: Days; startTime: string; endTime: string } | null {
  const t = time.trim();
  const full = /^יום\s*([אבגדהו])\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(
    t,
  );
  if (full) {
    const day = HEBREW_DAY_TO_EN[full[1]];
    if (!day) return null;
    return { day, startTime: padHHMM(full[2]), endTime: padHHMM(full[3]) };
  }
  // Placeholder rows e.g. "02:00-"
  const broken = /^(\d{1,2}:\d{2})\s*-\s*$/.exec(t);
  if (broken) {
    const start = padHHMM(broken[1]);
    const [h, m] = start.split(":").map(Number);
    const endM = h * 60 + m + 60;
    const endH = Math.floor(endM / 60) % 24;
    const endMin = endM % 60;
    return {
      day: Days.Sun,
      startTime: start,
      endTime: `${String(endH).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
    };
  }
  return null;
}

function padHHMM(s: string): string {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return "09:00";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type ParsedOffering = BguOfferingRow & {
  parsed: NonNullable<ReturnType<typeof parseBguTimeField>>;
  lessonKind: Lesson["type"];
};

function toLesson(row: ParsedOffering, location: string): Lesson {
  return {
    day: row.parsed.day,
    lecturer: row.lecturer,
    location,
    type: row.lessonKind,
    startTime: row.parsed.startTime,
    endTime: row.parsed.endTime,
  };
}

function sortParsed(rows: ParsedOffering[]): ParsedOffering[] {
  return [...rows].sort((a, b) => {
    const da = a.parsed.day.localeCompare(b.parsed.day);
    if (da !== 0) return da;
    return a.parsed.startTime.localeCompare(b.parsed.startTime);
  });
}

function buildSectionsForGroup(
  rows: ParsedOffering[],
  rng: () => number,
  randomizeZeroPlaces: boolean,
): CourseSection[] {
  const lectures = sortParsed(rows.filter((r) => isLectureRow(r.type)));
  const tutorials = sortParsed(rows.filter((r) => isTutorialRow(r.type)));
  const labs = sortParsed(rows.filter((r) => isLabRow(r.type)));

  const sections: CourseSection[] = [];
  let sectionCounter = 0;

  const availabilityFor = (row: BguOfferingRow): number => {
    let p = row.places;
    if (randomizeZeroPlaces && (!p || p <= 0)) {
      p = 5 + Math.floor(rng() * 36);
    }
    return Math.max(0, p);
  };

  const loc = (row: ParsedOffering): string => {
    const room = 100 + Math.floor(rng() * 900);
    const av = availabilityFor(row);
    return av > 0 ? `חדר ${room} · ${av} מקומות` : `חדר ${room}`;
  };

  const n = Math.min(lectures.length, tutorials.length);
  for (let i = 0; i < n; i++) {
    sectionCounter += 1;
    const lec = lectures[i];
    const tut = tutorials[i];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lec, loc(lec)), toLesson(tut, loc(tut))],
    });
  }
  for (let i = n; i < lectures.length; i++) {
    sectionCounter += 1;
    const lec = lectures[i];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lec, loc(lec))],
    });
  }
  for (let i = n; i < tutorials.length; i++) {
    sectionCounter += 1;
    const tut = tutorials[i];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(tut, loc(tut))],
    });
  }
  for (const lab of labs) {
    sectionCounter += 1;
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lab, loc(lab))],
    });
  }

  return sections;
}

function courseCreditsForGroup(rows: ParsedOffering[]): number {
  const fromLectures = rows.filter(
    (r) => isLectureRow(r.type) && r.credits > 0,
  );
  if (fromLectures.length > 0) {
    return Math.max(...fromLectures.map((r) => r.credits));
  }
  const any = rows.filter((r) => r.credits > 0);
  if (any.length > 0) return Math.max(...any.map((r) => r.credits));
  return 0;
}

function normalizedShortDescription(
  course: BguCatalogCourse,
): string | undefined {
  const candidates: unknown[] = [
    course.shortDescription,
    course.short_description,
    course.summary,
    course.description,
  ];
  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const trimmed = c.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

/**
 * Converts merged BGU catalog JSON into `Course[]` for `generateSchedules`.
 * Splits by (course name, semester letter, year) so offerings stay consistent.
 */
export function bguCatalogToCourses(
  catalog: BguCatalogJson,
  options: BguToCoursesOptions = {},
): Course[] {
  const seed = options.seed ?? 0x9e3779b9;
  const rng = mulberry32(seed);
  const randomizeZero = options.randomizeAvailabilityWhenZero !== false;

  const out: Course[] = [];

  for (const [courseName, course] of Object.entries(catalog.courses)) {
    const parsedRows: ParsedOffering[] = [];
    for (const row of course.offerings) {
      const parsed = parseBguTimeField(row.time);
      if (!parsed) continue;
      parsedRows.push({
        ...row,
        parsed,
        lessonKind: mapLessonType(row.type),
      });
    }
    if (parsedRows.length === 0) continue;

    const byGroup = new Map<string, ParsedOffering[]>();
    for (const row of parsedRows) {
      const key = `${row.semester.trim()}|${row.year.trim()}`;
      const list = byGroup.get(key) ?? [];
      list.push(row);
      byGroup.set(key, list);
    }

    for (const [semYearKey, groupRows] of byGroup) {
      const [semHeb, yearHeb] = semYearKey.split("|");
      const semester = mapSemester(semHeb);
      const degreeCatalogYear = (yearHeb ?? "").trim();
      const sections = buildSectionsForGroup(groupRows, rng, randomizeZero);
      if (sections.length === 0) continue;

      // Stable ID without Hebrew in IDs (safe for URLs / keys)
      const idBase = hashString(`${courseName}|${semYearKey}`);
      const courseID = `bgu-${idBase.toString(36)}-${semester}`;

      // Re-seed-ish mandatory per course for variety while deterministic with main seed
      const mandatoryRng = mulberry32(seed ^ idBase);
      const isMandatory = mandatoryRng() < 0.35;

      out.push({
        courseID,
        courseName: course.name,
        shortDescription: normalizedShortDescription(course),
        isMandatory,
        credits: courseCreditsForGroup(groupRows),
        semester,
        degreeCatalogYear,
        prerequisiteNames: [...course.prerequisites],
        availableSections: sections.map((s, i) => ({
          ...s,
          sectionID: `${courseID}-${i + 1}`,
        })),
      });
    }
  }

  return out;
}
