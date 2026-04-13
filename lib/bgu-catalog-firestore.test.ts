jest.mock("firebase/firestore", () => ({}));

import { mergeOfferingLecturerFields } from "./bgu-catalog-firestore";

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
