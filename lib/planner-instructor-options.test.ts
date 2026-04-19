import { mockCourses } from "@/mockData/mock-courses";

import {
  collectDistinctLecturersForCourseId,
  collectDistinctLecturersFromCourse,
  findPlannerCourseById,
} from "./planner-instructor-options";

describe("collectDistinctLecturersFromCourse", () => {
  it("returns distinct non-empty lecturer names in first-seen order", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101");
    expect(cs101).toBeDefined();
    expect(collectDistinctLecturersFromCourse(cs101!)).toEqual([
      "Dr. Smith",
      "Dr. Johnson",
      "Dr. Lee",
    ]);
  });
});

describe("findPlannerCourseById", () => {
  it("matches after trim on selected id", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101")!;
    const list = [{ ...cs101, courseID: "  CS101  " }];
    expect(findPlannerCourseById(list, "CS101")).toBeDefined();
    expect(collectDistinctLecturersForCourseId(list, "CS101").length).toBeGreaterThan(
      0,
    );
  });
});
