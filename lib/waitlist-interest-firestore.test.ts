import {
  createWaitlistInterestForCurrentUser,
  mapWaitlistInterestErrorToMessage,
  shouldAllowWaitlistInterestOwnerWrite,
  waitlistInterestDocPath,
  waitlistInterestsCollectionPath,
} from "@/lib/waitlist-interest-firestore";

describe("waitlistInterestsCollectionPath", () => {
  it("builds owner-scoped collection path under users/{uid}", () => {
    expect(waitlistInterestsCollectionPath("student-1")).toBe(
      "users/student-1/waitlistInterests",
    );
  });

  it("throws when uid is blank", () => {
    expect(() => waitlistInterestsCollectionPath(" ")).toThrow(
      "User id is required.",
    );
  });
});

describe("waitlistInterestDocPath", () => {
  it("builds owner-scoped document path", () => {
    expect(waitlistInterestDocPath("student-1", "interest-1")).toBe(
      "users/student-1/waitlistInterests/interest-1",
    );
  });

  it("throws when interest id is blank", () => {
    expect(() => waitlistInterestDocPath("student-1", "")).toThrow(
      "Waitlist interest id is required.",
    );
  });
});

describe("shouldAllowWaitlistInterestOwnerWrite", () => {
  it("returns true when auth/path/owner uid match", () => {
    expect(
      shouldAllowWaitlistInterestOwnerWrite({
        authUid: "student-1",
        pathUid: "student-1",
        ownerUid: "student-1",
      }),
    ).toBe(true);
  });

  it("returns false when owner uid differs", () => {
    expect(
      shouldAllowWaitlistInterestOwnerWrite({
        authUid: "student-1",
        pathUid: "student-1",
        ownerUid: "student-2",
      }),
    ).toBe(false);
  });
});

describe("createWaitlistInterestForCurrentUser", () => {
  it("writes waitlist record and returns the stored payload", async () => {
    const writeWaitlistInterest = jest
      .fn<
        Promise<{ id: string }>,
        [
          {
            uid: string;
            courseId: string;
            courseName: string;
            sectionId: string;
            status: "waitlist" | "interest";
            createdAtMs: number;
          },
        ]
      >()
      .mockResolvedValue({ id: "interest-7" });
    const now = new Date("2026-04-16T21:00:00.000Z");

    const result = await createWaitlistInterestForCurrentUser(
      {
        courseId: "CS101",
        courseName: "Intro to CS",
        sectionId: "CS101-1",
        status: "waitlist",
      },
      {
        getCurrentUserUid: () => "student-1",
        now: () => now,
        writeWaitlistInterest: async (input) => writeWaitlistInterest(input),
      },
    );

    expect(writeWaitlistInterest).toHaveBeenCalledWith({
      uid: "student-1",
      courseId: "CS101",
      courseName: "Intro to CS",
      sectionId: "CS101-1",
      status: "waitlist",
      createdAtMs: now.getTime(),
    });
    expect(result).toEqual({
      id: "interest-7",
      docPath: "users/student-1/waitlistInterests/interest-7",
      ownerUid: "student-1",
      courseId: "CS101",
      courseName: "Intro to CS",
      sectionId: "CS101-1",
      status: "waitlist",
      createdAtMs: now.getTime(),
    });
  });

  it("throws when user is not signed in", async () => {
    await expect(
      createWaitlistInterestForCurrentUser(
        {
          courseId: "CS101",
          courseName: "Intro to CS",
          sectionId: "CS101-1",
          status: "waitlist",
        },
        {
          getCurrentUserUid: () => undefined,
          now: () => new Date(),
          writeWaitlistInterest: async () => ({ id: "x" }),
        },
      ),
    ).rejects.toThrow("You must be signed in to join a waitlist.");
  });
});

describe("mapWaitlistInterestErrorToMessage", () => {
  it("maps permission-denied errors", () => {
    expect(mapWaitlistInterestErrorToMessage({ code: "permission-denied" })).toContain(
      "permission",
    );
  });

  it("returns fallback copy for unknown failures", () => {
    expect(mapWaitlistInterestErrorToMessage(new Error("boom"))).toContain(
      "could not submit",
    );
  });
});
