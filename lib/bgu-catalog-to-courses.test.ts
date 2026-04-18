import { Days } from "@/types/courses";
import {
    bguCatalogToCourses,
    coerceFirestoreFiniteNumber,
    parseBguTimeField,
    reportedRemainingSeatsFromOfferingRow,
} from "./bgu-catalog-to-courses";

describe("coerceFirestoreFiniteNumber", () => {
  it("accepts finite numbers and numeric strings", () => {
    expect(coerceFirestoreFiniteNumber(12)).toBe(12);
    expect(coerceFirestoreFiniteNumber(" 34 ")).toBe(34);
  });

  it("rejects non-finite and non-numeric values", () => {
    expect(coerceFirestoreFiniteNumber("x")).toBeNull();
    expect(coerceFirestoreFiniteNumber(Number.NaN)).toBeNull();
    expect(coerceFirestoreFiniteNumber(undefined)).toBeNull();
    expect(coerceFirestoreFiniteNumber(null)).toBeNull();
  });
});

describe("reportedRemainingSeatsFromOfferingRow", () => {
  it("uses capacity minus occupancy when both are set", () => {
    expect(
      reportedRemainingSeatsFromOfferingRow({
        type: "שיעור",
        lecturer: "Dr",
        semester: "א",
        year: "א",
        time: "יום א 09:00-10:00",
        credits: 3,
        weekly_hours: 2,
        capacity: 40,
        occupancy: 33,
      }),
    ).toBe(7);
  });

  it("returns null when capacity or occupancy is missing", () => {
    expect(
      reportedRemainingSeatsFromOfferingRow({
        type: "שיעור",
        lecturer: "Dr",
        semester: "א",
        year: "א",
        time: "יום א 09:00-10:00",
        credits: 3,
        weekly_hours: 2,
        capacity: 50,
      }),
    ).toBeNull();
  });
});

describe("parseBguTimeField", () => {
  it("parses standard Hebrew day line", () => {
    const r = parseBguTimeField("יום ג 10:00-13:00");
    expect(r).toEqual({
      day: Days.Tue,
      startTime: "10:00",
      endTime: "13:00",
    });
  });

  it("returns null for unparseable input", () => {
    expect(parseBguTimeField("")).toBeNull();
    expect(parseBguTimeField("invalid")).toBeNull();
  });
});

describe("bguCatalogToCourses", () => {
  it("produces Course entries with sections and lessons", () => {
    const catalog = {
      courses: {
        "Test Course": {
          name: "Test Course",
          shortDescription: "Short catalog summary",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr A",
              semester: "א",
              year: "א",
              time: "יום א 09:00-11:00",
              credits: 3,
              weekly_hours: 2,
              capacity: 40,
              occupancy: 30,
            },
            {
              type: "תרגיל",
              lecturer: "TA B",
              semester: "א",
              year: "א",
              time: "יום ב 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              capacity: 40,
              occupancy: 35,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 1 });
    expect(courses.length).toBe(1);
    expect(courses[0].semester).toBe("A");
    expect(courses[0].degreeCatalogYear).toBe("א");
    expect(courses[0].shortDescription).toBe("Short catalog summary");
    expect(courses[0].availableSections.length).toBe(1);
    expect(courses[0].availableSections[0].lessons.length).toBe(2);
    expect(courses[0].availableSections[0].lessons[0].type).toBe("Lecture");
    expect(courses[0].availableSections[0].lessons[1].type).toBe("Tutorial");
    expect(courses[0].availableSections[0].remainingSeats).toBe(5);
    expect(courses[0].availableSections[0].isFull).toBe(false);
    expect(courses[0].availableSections[0].waitlistSupported).toBe(true);
  });

  it("falls back from whitespace shortDescription to summary", () => {
    const catalog = {
      courses: {
        "Summary Course": {
          name: "Summary Course",
          shortDescription: "   ",
          summary: "Summary fallback text",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr C",
              semester: "א",
              year: "א",
              time: "יום א 09:00-10:00",
              credits: 2,
              weekly_hours: 1,
              capacity: 30,
              occupancy: 20,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 2 });
    expect(courses).toHaveLength(1);
    expect(courses[0].shortDescription).toBe("Summary fallback text");
  });

  it("marks sections full from capacity minus occupancy when both are set", () => {
    const catalog = {
      courses: {
        "Cap Course": {
          name: "Cap Course",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr D",
              semester: "א",
              year: "א",
              time: "יום א 09:00-11:00",
              credits: 3,
              weekly_hours: 2,
              capacity: 20,
              occupancy: 20,
            },
            {
              type: "תרגיל",
              lecturer: "TA E",
              semester: "א",
              year: "א",
              time: "יום ב 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              capacity: 25,
              occupancy: 10,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 3 });
    expect(courses.length).toBe(1);
    expect(courses[0].availableSections[0].remainingSeats).toBe(0);
    expect(courses[0].availableSections[0].isFull).toBe(true);
    expect(courses[0].availableSections[0].waitlistSupported).toBe(true);
  });

  it("marks sections with zero remaining seats as full and waitlist-supported", () => {
    const catalog = {
      courses: {
        "Full Course": {
          name: "Full Course",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr D",
              semester: "א",
              year: "א",
              time: "יום א 09:00-10:00",
              credits: 2,
              weekly_hours: 1,
              capacity: 30,
              occupancy: 30,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 9 });
    expect(courses).toHaveLength(1);
    expect(courses[0].availableSections[0].remainingSeats).toBe(0);
    expect(courses[0].availableSections[0].isFull).toBe(true);
    expect(courses[0].availableSections[0].waitlistSupported).toBe(true);
  });

  it("couples lecture and multiple exercises by sectionGroupKey", () => {
    const catalog = {
      courses: {
        "Grouped Course": {
          name: "Grouped Course",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr G",
              semester: "א",
              year: "ב",
              time: "יום א 09:00-11:00",
              credits: 4,
              weekly_hours: 2.5,
              sectionGroupKey: "g1",
              capacity: 40,
              occupancy: 35,
            },
            {
              type: "תרגיל",
              lecturer: "TA 1",
              semester: "א",
              year: "ב",
              time: "יום ב 12:00-13:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: "g1",
              capacity: 40,
              occupancy: 39,
            },
            {
              type: "תרגיל",
              lecturer: "TA 2",
              semester: "א",
              year: "ב",
              time: "יום ד 12:00-13:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: "g1",
              capacity: 40,
              occupancy: 34,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 11 });
    expect(courses).toHaveLength(1);
    expect(courses[0].availableSections).toHaveLength(1);
    expect(courses[0].availableSections[0].lessons).toHaveLength(3);
    // Lecture remaining is 5; tutorials are alternatives so max(1,6)=6.
    // Section remaining should be min(5,6)=5.
    expect(courses[0].availableSections[0].remainingSeats).toBe(5);
    expect(courses[0].availableSections[0].isFull).toBe(false);
  });

  it("keeps grouped section open when one exercise option is full but another has seats", () => {
    const catalog = {
      courses: {
        "Alt Exercise Course": {
          name: "Alt Exercise Course",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr H",
              semester: "א",
              year: "א",
              time: "יום א 10:00-12:00",
              credits: 4,
              weekly_hours: 2.5,
              sectionGroupKey: "g1",
              capacity: 20,
              occupancy: 10,
            },
            {
              type: "תרגיל",
              lecturer: "TA X",
              semester: "א",
              year: "א",
              time: "יום ב 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: "g1",
              capacity: 0,
              occupancy: 0,
            },
            {
              type: "תרגיל",
              lecturer: "TA Y",
              semester: "א",
              year: "א",
              time: "יום ג 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: "g1",
              capacity: 20,
              occupancy: 15,
            },
          ],
        },
      },
    };

    const courses = bguCatalogToCourses(catalog, { seed: 13 });
    expect(courses).toHaveLength(1);
    expect(courses[0].availableSections).toHaveLength(1);
    expect(courses[0].availableSections[0].isFull).toBe(false);
    expect(courses[0].availableSections[0].remainingSeats).toBe(5);
  });

  /**
   * Mirrors real Firestore grouping like
   * `c_6551d2629de1a5a56b377b25|A|Y1|track:default|g:2` — we cannot read live DB from CI;
   * this documents why the waitlist strip can stay visible when only the lecture row has seats.
   */
  const REAL_STYLE_SECTION_GROUP_KEY =
    "c_6551d2629de1a5a56b377b25|A|Y1|track:default|g:2";

  it("sectionGroupKey group: lecture 12/11 but every tutorial row full → section still full", () => {
    const catalog = {
      courses: {
        "Grouped Lecture PlusTutorial": {
          name: "Grouped Lecture PlusTutorial",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "מר מור דורון",
              semester: "א",
              year: "א",
              time: "יום ד 17:00-19:00",
              credits: 2.5,
              weekly_hours: 1.5,
              sectionGroupKey: REAL_STYLE_SECTION_GROUP_KEY,
              capacity: 12,
              occupancy: 11,
            },
            {
              type: "תרגיל",
              lecturer: "TA",
              semester: "א",
              year: "א",
              time: "יום ב 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: REAL_STYLE_SECTION_GROUP_KEY,
              capacity: 20,
              occupancy: 20,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 88 });
    expect(courses).toHaveLength(1);
    expect(courses[0].availableSections).toHaveLength(1);
    // min(lectureRem=1, max(tutorialRems)=0) = 0 → matches “need lecture AND an exercise path”.
    expect(courses[0].availableSections[0].remainingSeats).toBe(0);
    expect(courses[0].availableSections[0].isFull).toBe(true);
  });

  it("sectionGroupKey group: lecture open and at least one tutorial open → not full", () => {
    const catalog = {
      courses: {
        "Grouped Lecture TwoTutorials": {
          name: "Grouped Lecture TwoTutorials",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "מר מור דורון",
              semester: "א",
              year: "א",
              time: "יום ד 17:00-19:00",
              credits: 2.5,
              weekly_hours: 1.5,
              sectionGroupKey: REAL_STYLE_SECTION_GROUP_KEY,
              capacity: 12,
              occupancy: 11,
            },
            {
              type: "תרגיל",
              lecturer: "TA Full",
              semester: "א",
              year: "א",
              time: "יום ב 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: REAL_STYLE_SECTION_GROUP_KEY,
              capacity: 20,
              occupancy: 20,
            },
            {
              type: "תרגיל",
              lecturer: "TA Open",
              semester: "א",
              year: "א",
              time: "יום ג 14:00-15:00",
              credits: 0,
              weekly_hours: 0,
              sectionGroupKey: REAL_STYLE_SECTION_GROUP_KEY,
              capacity: 20,
              occupancy: 15,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 89 });
    expect(courses[0].availableSections[0].remainingSeats).toBe(1);
    expect(courses[0].availableSections[0].isFull).toBe(false);
  });

  it("still enables waitlist when offerings omit capacity and occupancy", () => {
    const catalog = {
      courses: {
        "No Seat Count Course": {
          name: "No Seat Count Course",
          prerequisites: [],
          offerings: [
            {
              type: "שיעור",
              lecturer: "Dr Z",
              semester: "א",
              year: "א",
              time: "יום א 09:00-10:00",
              credits: 2,
              weekly_hours: 1,
            },
          ],
        },
      },
    };
    const courses = bguCatalogToCourses(catalog, { seed: 17 });
    expect(courses).toHaveLength(1);
    expect(courses[0].availableSections[0].waitlistSupported).toBe(true);
    expect(courses[0].availableSections[0].isFull).toBe(true);
  });
});
