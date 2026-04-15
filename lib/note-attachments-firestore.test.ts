import {
  deleteNoteAttachmentForCurrentUserFolder,
  listNoteAttachmentsForCurrentUserFolder,
  mapNoteAttachmentErrorToMessage,
  noteAttachmentDocPath,
  noteAttachmentsCollectionPath,
  uploadNoteAttachmentForCurrentUserFolder,
} from "@/lib/note-attachments-firestore";

describe("noteAttachmentsCollectionPath", () => {
  it("builds owner-scoped attachment collection path", () => {
    expect(noteAttachmentsCollectionPath("student-1", "general")).toBe(
      "users/student-1/noteFolders/general/attachments",
    );
  });

  it("throws when folder id is blank", () => {
    expect(() => noteAttachmentsCollectionPath("student-1", " ")).toThrow(
      "Folder id is required.",
    );
  });
});

describe("noteAttachmentDocPath", () => {
  it("builds owner-scoped attachment document path", () => {
    expect(noteAttachmentDocPath("student-1", "general", "attachment-1")).toBe(
      "users/student-1/noteFolders/general/attachments/attachment-1",
    );
  });
});

describe("listNoteAttachmentsForCurrentUserFolder", () => {
  it("maps valid docs and sorts by createdAt descending", async () => {
    const attachments = await listNoteAttachmentsForCurrentUserFolder("general", {
      getCurrentUserUid: () => "student-1",
      readAttachmentDocs: async () => [
        {
          id: "a-1",
          ownerUid: "student-1",
          folderId: "general",
          folderName: "General Notes",
          type: "document",
          fileName: "Lecture 1.pdf",
          contentType: "application/pdf",
          storagePath: "users/student-1/noteAttachments/general/lecture-1.pdf",
          downloadUrl: "https://example.com/lecture-1.pdf",
          createdAtMs: 10,
        },
        {
          id: "a-2",
          ownerUid: "student-1",
          folderId: "general",
          folderName: "General Notes",
          type: "image",
          fileName: "board.jpg",
          contentType: "image/jpeg",
          storagePath: "users/student-1/noteAttachments/general/board.jpg",
          downloadUrl: "https://example.com/board.jpg",
          createdAtMs: 20,
        },
      ],
    });

    expect(attachments.map((attachment) => attachment.id)).toEqual(["a-2", "a-1"]);
  });
});

describe("uploadNoteAttachmentForCurrentUserFolder", () => {
  it("uploads file and creates firestore metadata", async () => {
    const uploadFile = jest.fn().mockResolvedValue({
      storagePath: "users/student-1/noteAttachments/general/board.jpg",
      downloadUrl: "https://example.com/board.jpg",
    });
    const createAttachmentDoc = jest.fn().mockResolvedValue({
      id: "a-1",
      createdAtMs: 1700000000,
    });

    const attachment = await uploadNoteAttachmentForCurrentUserFolder(
      {
        folderId: "general",
        folderName: "General Notes",
        fileName: "  board.jpg ",
        localUri: "file:///tmp/board.jpg",
        type: "image",
      },
      {
        getCurrentUserUid: () => "student-1",
        uploadFile,
        createAttachmentDoc,
      },
    );

    expect(uploadFile).toHaveBeenCalledWith({
      uid: "student-1",
      folderId: "general",
      fileName: "board.jpg",
      localUri: "file:///tmp/board.jpg",
      type: "image",
      contentType: "image/jpeg",
    });
    expect(createAttachmentDoc).toHaveBeenCalledWith({
      uid: "student-1",
      folderId: "general",
      payload: expect.objectContaining({
        ownerUid: "student-1",
        folderId: "general",
        folderName: "General Notes",
        type: "image",
        fileName: "board.jpg",
        contentType: "image/jpeg",
        storagePath: "users/student-1/noteAttachments/general/board.jpg",
      }),
    });
    expect(attachment).toEqual(
      expect.objectContaining({
        id: "a-1",
        fileName: "board.jpg",
      }),
    );
  });
});

describe("mapNoteAttachmentErrorToMessage", () => {
  it("maps permission errors", () => {
    expect(mapNoteAttachmentErrorToMessage({ code: "permission-denied" })).toContain(
      "permission",
    );
  });
});

describe("deleteNoteAttachmentForCurrentUserFolder", () => {
  it("deletes attachment doc with cleaned identifiers", async () => {
    const deleteAttachmentDoc = jest.fn().mockResolvedValue(undefined);
    await deleteNoteAttachmentForCurrentUserFolder(
      {
        folderId: "general",
        attachmentId: "attachment-1",
      },
      {
        getCurrentUserUid: () => "student-1",
        deleteAttachmentDoc,
      },
    );

    expect(deleteAttachmentDoc).toHaveBeenCalledWith({
      uid: "student-1",
      folderId: "general",
      attachmentId: "attachment-1",
    });
  });
});
