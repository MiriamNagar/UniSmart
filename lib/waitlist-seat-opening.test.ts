import {
  collectWaitlistSectionSnapshots,
  detectWaitlistSeatOpenings,
  sectionAppearsFullForWaitlistUi,
} from "@/lib/waitlist-seat-opening";
import type { Course } from "@/types/courses";

const baseCourse: Course = {
  courseID: "CS101",
  courseName: "Intro to CS",
  isMandatory: true,
  credits: 3,
  semester: "A",
  availableSections: [
    {
      sectionID: "CS101-1",
      lessons: [],
      isFull: true,
      remainingSeats: 0,
      waitlistSupported: true,
    },
  ],
};

describe("sectionAppearsFullForWaitlistUi", () => {
  it("treats positive remaining seats as not full even if isFull is stale true", () => {
    expect(
      sectionAppearsFullForWaitlistUi({
        isFull: true,
        remainingSeats: 3,
      }),
    ).toBe(false);
  });
});

describe("collectWaitlistSectionSnapshots", () => {
  it("collects section snapshots with normalized seat counts", () => {
    const snapshots = collectWaitlistSectionSnapshots([baseCourse]);
    expect(snapshots.get("CS101-1")).toEqual({
      sectionId: "CS101-1",
      courseId: "CS101",
      courseName: "Intro to CS",
      isFull: true,
      remainingSeats: 0,
    });
  });

  it("marks snapshot not full when remainingSeats is positive even if isFull is true", () => {
    const snapshots = collectWaitlistSectionSnapshots([
      {
        ...baseCourse,
        availableSections: [
          {
            ...baseCourse.availableSections[0],
            isFull: true,
            remainingSeats: 4,
          },
        ],
      },
    ]);
    expect(snapshots.get("CS101-1")?.isFull).toBe(false);
    expect(snapshots.get("CS101-1")?.remainingSeats).toBe(4);
  });
});

describe("detectWaitlistSeatOpenings", () => {
  it("detects waitlisted section transition from full to open", () => {
    const previousBySectionId = collectWaitlistSectionSnapshots([baseCourse]);
    const currentBySectionId = collectWaitlistSectionSnapshots([
      {
        ...baseCourse,
        availableSections: [
          {
            ...baseCourse.availableSections[0],
            isFull: false,
            remainingSeats: 2,
          },
        ],
      },
    ]);

    expect(
      detectWaitlistSeatOpenings({
        previousBySectionId,
        currentBySectionId,
        waitlistedSectionIds: new Set(["CS101-1"]),
      }),
    ).toEqual([
      {
        sectionId: "CS101-1",
        courseId: "CS101",
        courseName: "Intro to CS",
        signal: {
          previousRemaining: 0,
          currentRemaining: 2,
          remainingDelta: 2,
          shouldNotifyGenericEnrollment: true,
        },
      },
    ]);
  });

  it("does not notify when section remains full", () => {
    const previousBySectionId = collectWaitlistSectionSnapshots([baseCourse]);
    const currentBySectionId = collectWaitlistSectionSnapshots([baseCourse]);

    expect(
      detectWaitlistSeatOpenings({
        previousBySectionId,
        currentBySectionId,
        waitlistedSectionIds: new Set(["CS101-1"]),
      }),
    ).toEqual([]);
  });
});
