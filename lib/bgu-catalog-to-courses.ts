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
  /**
   * Optional explicit registrar group identifier that couples offerings
   * (e.g. lecture + one or more tutorial/lab rows) into the same section.
   */
  sectionGroupKey?: string;
  /** Room/section capacity when the registrar (or seed) provides explicit counts. */
  capacity?: number;
  /** Registered / taken seats; remaining = max(0, capacity - occupancy) when both are set. */
  occupancy?: number;
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
}

/**
 * Minimal fields for seat math — shared by catalog rows, Firestore `bgu_cs_offerings` docs,
 * and push / enrollment notification logic (`capacity − occupancy`).
 */
export type OfferingSeatCountFields = {
  capacity?: number;
  occupancy?: number;
};

/**
 * Firestore / manual console edits sometimes store numeric fields as strings.
 * Accept finite numbers and numeric strings so seat math still runs.
 */
export function coerceFirestoreFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Seats remaining for one row: `max(0, capacity − occupancy)` when both values are present.
 * Coerces Firestore/string numerics like {@link coerceFirestoreFiniteNumber}.
 */
export function remainingSeatsFromOfferingFields(
  row: OfferingSeatCountFields,
): number | null {
  const cap = coerceFirestoreFiniteNumber(row.capacity as unknown);
  const occ = coerceFirestoreFiniteNumber(row.occupancy as unknown);
  if (cap === null || occ === null) {
    return null;
  }
  return Math.max(0, cap - occ);
}

/**
 * Seats remaining for one offering row: `capacity - occupancy` when both are set.
 */
export function reportedRemainingSeatsFromOfferingRow(
  row: BguOfferingRow,
): number | null {
  return remainingSeatsFromOfferingFields(row);
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
): CourseSection[] {
  const sections: CourseSection[] = [];
  let sectionCounter = 0;

  const normalizedGroupKey = (row: ParsedOffering): string | null => {
    if (typeof row.sectionGroupKey !== "string") return null;
    const key = row.sectionGroupKey.trim();
    return key.length > 0 ? key : null;
  };

  const loc = (row: ParsedOffering): string => {
    const room = 100 + Math.floor(rng() * 900);
    const rem = reportedRemainingSeatsFromOfferingRow(row);
    if (rem === 0) {
      return `חדר ${room} · מלא`;
    }
    return typeof rem === "number" && rem > 0
      ? `חדר ${room} · ${rem} מקומות`
      : `חדר ${room}`;
  };

  /**
   * Seat / waitlist policy for one planner section (one `sectionGroupKey` group, or one
   * unkeyed lecture+tutorial pair, etc.):
   *
   * - Only rows with both `capacity` and `occupancy` (after coercion) contribute seat counts.
   * - **Lecture** rows in this section: take the **minimum** remaining among them (every
   *   lecture line in the group must have seats for that “slot” to count).
   * - **Tutorial** rows: take the **maximum** remaining — multiple exercises are alternatives;
   *   one full exercise and one open exercise still counts as having tutorial capacity if the max > 0.
   * - **Lab** rows: same as tutorials (**maximum**).
   * - Section **remainingSeats** = minimum across the kinds that exist (lecture bucket, tutorial
   *   bucket, lab bucket). So you need a positive lecture minimum **and** a positive tutorial max
   *   (when tutorials exist), etc. — matching “lecture has space and at least one exercise has space”.
   * - **isFull** ⇔ `remainingSeats <= 0`. With no seat data on any row, we still enable waitlist
   *   and treat the section as full (`isFull: true`) so the UI is not dead.
   */
  const sectionMetaFromRows = (
    sectionRows: ParsedOffering[],
  ): Pick<CourseSection, "remainingSeats" | "isFull" | "waitlistSupported"> => {
    const rowsWithSeats = sectionRows
      .map((row) => ({
        row,
        remaining: reportedRemainingSeatsFromOfferingRow(row),
      }))
      .filter(
        (item): item is { row: ParsedOffering; remaining: number } =>
          item.remaining !== null,
      );
    if (rowsWithSeats.length === 0) {
      // No capacity/occupancy (e.g. null in Firestore): still expose waitlist so the
      // planner does not silently drop actions when the registrar omits seat fields.
      return {
        waitlistSupported: true,
        isFull: true,
        remainingSeats: undefined,
      };
    }

    const lectureSeats = rowsWithSeats
      .filter((item) => item.row.lessonKind === "Lecture")
      .map((item) => item.remaining);
    const tutorialSeats = rowsWithSeats
      .filter((item) => item.row.lessonKind === "Tutorial")
      .map((item) => item.remaining);
    const labSeats = rowsWithSeats
      .filter((item) => item.row.lessonKind === "Lab")
      .map((item) => item.remaining);

    // With explicit grouping, multiple tutorials/labs are alternatives.
    // A section is considered open when at least one option in each required
    // lesson kind remains available.
    const requiredKindSeats: number[] = [];
    if (lectureSeats.length > 0) {
      requiredKindSeats.push(Math.min(...lectureSeats));
    }
    if (tutorialSeats.length > 0) {
      requiredKindSeats.push(Math.max(...tutorialSeats));
    }
    if (labSeats.length > 0) {
      requiredKindSeats.push(Math.max(...labSeats));
    }

    const remainingSeats =
      requiredKindSeats.length > 0
        ? Math.min(...requiredKindSeats)
        : Math.min(...rowsWithSeats.map((item) => item.remaining));
    return {
      remainingSeats,
      isFull: remainingSeats <= 0,
      waitlistSupported: true,
    };
  };

  // Preferred path: when source rows provide explicit coupling keys, build sections by key.
  // This supports one lecture coupled with multiple tutorials/labs naturally.
  const keyedRows = rows.filter((row) => normalizedGroupKey(row) !== null);
  if (keyedRows.length > 0) {
    const byKey = new Map<string, ParsedOffering[]>();
    for (const row of keyedRows) {
      const key = normalizedGroupKey(row)!;
      const list = byKey.get(key) ?? [];
      list.push(row);
      byKey.set(key, list);
    }
    for (const [, sectionRows] of byKey) {
      sectionCounter += 1;
      const orderedRows = sortParsed(sectionRows);
      sections.push({
        sectionID: `sec-${sectionCounter}`,
        lessons: orderedRows.map((row) => toLesson(row, loc(row))),
        ...sectionMetaFromRows(orderedRows),
      });
    }
  }

  // Backward-compatible fallback for rows without explicit coupling keys.
  const unkeyedRows = rows.filter((row) => normalizedGroupKey(row) === null);
  const unkeyedLectures = sortParsed(unkeyedRows.filter((r) => isLectureRow(r.type)));
  const unkeyedTutorials = sortParsed(unkeyedRows.filter((r) => isTutorialRow(r.type)));
  const unkeyedLabs = sortParsed(unkeyedRows.filter((r) => isLabRow(r.type)));

  const n = Math.min(unkeyedLectures.length, unkeyedTutorials.length);
  for (let i = 0; i < n; i++) {
    sectionCounter += 1;
    const lec = unkeyedLectures[i];
    const tut = unkeyedTutorials[i];
    const sectionRows = [lec, tut];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lec, loc(lec)), toLesson(tut, loc(tut))],
      ...sectionMetaFromRows(sectionRows),
    });
  }
  for (let i = n; i < unkeyedLectures.length; i++) {
    sectionCounter += 1;
    const lec = unkeyedLectures[i];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lec, loc(lec))],
      ...sectionMetaFromRows([lec]),
    });
  }
  for (let i = n; i < unkeyedTutorials.length; i++) {
    sectionCounter += 1;
    const tut = unkeyedTutorials[i];
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(tut, loc(tut))],
      ...sectionMetaFromRows([tut]),
    });
  }
  for (const lab of unkeyedLabs) {
    sectionCounter += 1;
    sections.push({
      sectionID: `sec-${sectionCounter}`,
      lessons: [toLesson(lab, loc(lab))],
      ...sectionMetaFromRows([lab]),
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
      const sections = buildSectionsForGroup(groupRows, rng);
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
