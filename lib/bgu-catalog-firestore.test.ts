import {
  mergeCourseDescriptionFields,
  mergeOfferingLecturerFields,
} from "./bgu-catalog-firestore";

jest.mock("firebase/firestore", () => ({}));

describe("mergeOfferingLecturerFields", () => {
  it("prefers lecturer when set", () => {
    expect(
      mergeOfferingLecturerFields({
        lecturer: "  ד\"ר א  ",
        instructor: "ignored",
      }),
    ).toBe("ד\"ר א");
  });

  it("falls back to instructor or teacher", () => {
    expect(
      mergeOfferingLecturerFields({
        instructor: "מר ב",
      }),
    ).toBe("מר ב");
    expect(
      mergeOfferingLecturerFields({
        teacher: "גב' ג",
      }),
    ).toBe("גב' ג");
  });

  it("stringifies non-string values", () => {
    expect(
      mergeOfferingLecturerFields({
        lecturer: 42,
      } as Parameters<typeof mergeOfferingLecturerFields>[0]),
    ).toBe("42");
  });
});

describe("mergeCourseDescriptionFields", () => {
  it("prefers shortDescription when set", () => {
    expect(
      mergeCourseDescriptionFields({
        shortDescription: "  Core systems foundations  ",
        description: "ignored",
      }),
    ).toBe("Core systems foundations");
  });

  it("falls back to known alternate fields", () => {
    expect(
      mergeCourseDescriptionFields({
        short_description: "Alt snake case",
      }),
    ).toBe("Alt snake case");
    expect(
      mergeCourseDescriptionFields({
        summary: "Summary text",
      }),
    ).toBe("Summary text");
    expect(
      mergeCourseDescriptionFields({
        description: "Longer description",
      }),
    ).toBe("Longer description");
  });

  it("returns undefined when all fields are empty", () => {
    expect(
      mergeCourseDescriptionFields({
        shortDescription: "   ",
        description: "",
      }),
    ).toBeUndefined();
  });

  it("ignores non-string values", () => {
    expect(
      mergeCourseDescriptionFields({
        shortDescription: {} as unknown as string,
        summary: 123 as unknown as string,
        description: false as unknown as string,
      }),
    ).toBeUndefined();
  });
});
