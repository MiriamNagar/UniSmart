import type { Course } from "@/types/courses";
import { Days } from "@/types/courses";
import {
  lessonKindShortLabel,
  uniqueLecturersForLessonSlot,
} from "./planner-schedule-display";

describe("uniqueLecturersForLessonSlot", () => {
  it("merges lecturers from other sections with the same day/time/type", () => {
    const course: Course = {
      courseID: "X",
      courseName: "X",
      isMandatory: true,
      credits: 3,
      semester: "A",
      availableSections: [
        {
          sectionID: "X-1",
          lessons: [
            {
              day: Days.Mon,
              lecturer: "Dr. A",
              location: "R1",
              type: "Lecture",
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        },
        {
          sectionID: "X-2",
          lessons: [
            {
              day: Days.Mon,
              lecturer: "Dr. B",
              location: "R2",
              type: "Lecture",
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        },
      ],
    };
    const scheduled = course.availableSections[0].lessons[0];
    const names = uniqueLecturersForLessonSlot(course, scheduled);
    expect(names.sort()).toEqual(["Dr. A", "Dr. B"].sort());
  });

  it("returns the scheduled lecturer when no other section matches", () => {
    const course: Course = {
      courseID: "Y",
      courseName: "Y",
      isMandatory: true,
      credits: 1,
      semester: "A",
      availableSections: [
        {
          sectionID: "Y-1",
          lessons: [
            {
              day: Days.Tue,
              lecturer: "Only One",
              location: "R",
              type: "Lab",
              startTime: "14:00",
              endTime: "16:00",
            },
          ],
        },
      ],
    };
    expect(
      uniqueLecturersForLessonSlot(
        course,
        course.availableSections[0].lessons[0],
      ),
    ).toEqual(["Only One"]);
  });
});

describe("lessonKindShortLabel", () => {
  it("maps tutorial to exercise wording", () => {
    expect(lessonKindShortLabel("Tutorial")).toBe("Exercise");
    expect(lessonKindShortLabel("Lecture")).toBe("Lecture");
    expect(lessonKindShortLabel("Lab")).toBe("Lab");
  });
});
