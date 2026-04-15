import {
  createCustomNoteFolderForCurrentUser,
  extractCourseFoldersFromSchedule,
  extractCourseFoldersFromSchedules,
  deleteNoteFoldersForCurrentUser,
  listNoteFoldersForCurrentUser,
  mapNoteFolderErrorToMessage,
  noteFolderDocPath,
  noteFoldersCollectionPath,
  shouldAllowNoteFolderOwnerWrite,
  syncDefaultNoteFoldersForCurrentUser,
} from "@/lib/note-folders-firestore";

describe("noteFoldersCollectionPath", () => {
  it("builds owner-scoped collection path under users/{uid}", () => {
    expect(noteFoldersCollectionPath("student-1")).toBe("users/student-1/noteFolders");
  });

  it("throws when uid is blank", () => {
    expect(() => noteFoldersCollectionPath("  ")).toThrow("User id is required.");
  });
});

describe("noteFolderDocPath", () => {
  it("builds owner-scoped document path", () => {
    expect(noteFolderDocPath("student-1", "folder-7")).toBe("users/student-1/noteFolders/folder-7");
  });

  it("throws when folder id is blank", () => {
    expect(() => noteFolderDocPath("student-1", "")).toThrow("Folder id is required.");
  });
});

describe("shouldAllowNoteFolderOwnerWrite", () => {
  it("returns true when auth uid, path uid, and owner uid match", () => {
    expect(
      shouldAllowNoteFolderOwnerWrite({
        authUid: "student-1",
        pathUid: "student-1",
        ownerUid: "student-1",
      }),
    ).toBe(true);
  });

  it("returns false when any identifier mismatches", () => {
    expect(
      shouldAllowNoteFolderOwnerWrite({
        authUid: "student-1",
        pathUid: "student-1",
        ownerUid: "student-2",
      }),
    ).toBe(false);
  });
});

describe("listNoteFoldersForCurrentUser", () => {
  it("maps and sorts folders by scope then by name", async () => {
    const folders = await listNoteFoldersForCurrentUser({
      getCurrentUserUid: () => "student-1",
      readFolderDocs: async () => [
        {
          id: "custom-1",
          ownerUid: "student-1",
          scope: "custom",
          name: "Lab Snapshots",
        },
        {
          id: "general",
          ownerUid: "student-1",
          scope: "general",
          name: "General Notes",
        },
        {
          id: "course-cs101",
          ownerUid: "student-1",
          scope: "course",
          courseCode: "CS101",
          name: "CS101: Intro to CS",
        },
      ],
    });

    expect(folders.map((folder) => folder.id)).toEqual(["general", "course-cs101", "custom-1"]);
  });
});

describe("createCustomNoteFolderForCurrentUser", () => {
  it("creates a custom folder after duplicate check", async () => {
    const createFolderDoc = jest.fn().mockResolvedValue({ id: "custom-7" });
    const created = await createCustomNoteFolderForCurrentUser("  Lab Snapshots  ", {
      getCurrentUserUid: () => "student-1",
      listFolderDocs: async () => [
        {
          id: "existing",
          ownerUid: "student-1",
          scope: "custom",
          name: "Notes",
        },
      ],
      createFolderDoc,
    });

    expect(createFolderDoc).toHaveBeenCalledWith({
      uid: "student-1",
      folderName: "Lab Snapshots",
      normalizedName: "lab snapshots",
    });
    expect(created).toEqual({
      id: "custom-7",
      ownerUid: "student-1",
      scope: "custom",
      name: "Lab Snapshots",
    });
  });

  it("rejects duplicate custom folder names case-insensitively", async () => {
    await expect(
      createCustomNoteFolderForCurrentUser("lab snapshots", {
        getCurrentUserUid: () => "student-1",
        listFolderDocs: async () => [
          {
            id: "existing",
            ownerUid: "student-1",
            scope: "custom",
            name: "Lab   Snapshots",
          },
        ],
        createFolderDoc: async () => ({ id: "custom-7" }),
      }),
    ).rejects.toThrow("A folder with this name already exists.");
  });
});

describe("extractCourseFoldersFromSchedule", () => {
  it("extracts unique course seeds from a planner schedule shape", () => {
    const extracted = extractCourseFoldersFromSchedule({
      SUN: [
        { courseCode: "CS101", courseName: "Intro to CS" },
        { courseCode: "CS101", courseName: "Duplicate ignored" },
      ],
      MON: [{ courseCode: "MATH200", courseName: "Discrete Math" }],
      TUE: "not-an-array",
    });

    expect(extracted).toEqual([
      { courseCode: "CS101", courseName: "Intro to CS" },
      { courseCode: "MATH200", courseName: "Discrete Math" },
    ]);
  });
});

describe("extractCourseFoldersFromSchedules", () => {
  it("merges course seeds across schedules without duplicates", () => {
    const extracted = extractCourseFoldersFromSchedules([
      {
        SUN: [{ courseCode: "CS101", courseName: "Intro to CS" }],
      },
      {
        MON: [{ courseCode: "MATH200", courseName: "Discrete Math" }],
        TUE: [{ courseCode: "CS101", courseName: "Duplicate across plans" }],
      },
    ]);

    expect(extracted).toEqual([
      { courseCode: "CS101", courseName: "Intro to CS" },
      { courseCode: "MATH200", courseName: "Discrete Math" },
    ]);
  });
});

describe("syncDefaultNoteFoldersForCurrentUser", () => {
  it("upserts default general and deduplicated course folders", async () => {
    const upsertFolderDocs = jest.fn().mockResolvedValue(undefined);

    await syncDefaultNoteFoldersForCurrentUser(
      [
        { courseCode: "CS101", courseName: "Intro to CS..." },
        { courseCode: "CS101", courseName: "Ignored duplicate" },
        { courseCode: "MATH200", courseName: "Discrete Math" },
      ],
      {
        getCurrentUserUid: () => "student-1",
        upsertFolderDocs,
      },
    );

    expect(upsertFolderDocs).toHaveBeenCalledTimes(1);
    const call = upsertFolderDocs.mock.calls[0]?.[0] as {
      uid: string;
      folders: { id: string; name: string }[];
    };
    expect(call.uid).toBe("student-1");
    expect(call.folders.map((folder) => folder.id)).toEqual(["general", "course-CS101", "course-MATH200"]);
    expect(call.folders.map((folder) => folder.name)).toEqual([
      "General Notes",
      "CS101: Intro to CS",
      "MATH200: Discrete Math",
    ]);
    expect(call.folders[0]).not.toHaveProperty("courseCode");
    expect(call.folders[1]).toHaveProperty("courseCode", "CS101");
  });
});

describe("deleteNoteFoldersForCurrentUser", () => {
  it("deletes unique non-empty folder ids", async () => {
    const deleteFolderDocs = jest.fn().mockResolvedValue(undefined);
    await deleteNoteFoldersForCurrentUser(
      ["folder-a", " folder-a ", "folder-b", " "],
      {
        getCurrentUserUid: () => "student-1",
        deleteFolderDocs,
      },
    );

    expect(deleteFolderDocs).toHaveBeenCalledWith({
      uid: "student-1",
      folderIds: ["folder-a", "folder-b"],
    });
  });

  it("throws when no signed-in user uid exists", async () => {
    await expect(
      deleteNoteFoldersForCurrentUser(["folder-a"], {
        getCurrentUserUid: () => undefined,
        deleteFolderDocs: async () => Promise.resolve(),
      }),
    ).rejects.toThrow("You must be signed in to delete note folders.");
  });
});

describe("mapNoteFolderErrorToMessage", () => {
  it("maps duplicate-name errors", () => {
    expect(mapNoteFolderErrorToMessage(new Error("already exists"))).toContain("already exists");
  });

  it("maps permission-denied errors", () => {
    expect(mapNoteFolderErrorToMessage({ code: "permission-denied" })).toContain("permission");
  });
});
