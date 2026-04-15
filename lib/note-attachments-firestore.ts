import { Platform } from "react-native";

const inMemoryAttachmentsByFolder = new Map<string, NoteAttachmentRecord[]>();

/**
 * Copy picked assets into app document storage so URIs stay valid after the user
 * picks another file (Android often invalidates prior content:// grants).
 */
async function persistPickedFileToAppDocumentDirectory(
  sourceUri: string,
  fileName: string,
): Promise<string> {
  if (Platform.OS === "web") {
    return sourceUri;
  }
  const FileSystem = await import("expo-file-system/legacy");
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error("File storage is not available on this device.");
  }
  const safeName =
    fileName.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 200) || "file";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const dest = `${base}note-attachments/${unique}-${safeName}`;
  await FileSystem.makeDirectoryAsync(`${base}note-attachments`, {
    intermediates: true,
  });
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  } catch (error) {
    console.warn("persistPickedFileToAppDocumentDirectory copy failed:", error);
    throw new Error(
      "Could not save a local copy of this file. Try picking the file again.",
    );
  }
  return dest;
}

export type NoteAttachmentType = "image" | "document";

export type NoteAttachmentRecord = {
  id: string;
  ownerUid: string;
  folderId: string;
  folderName: string;
  type: NoteAttachmentType;
  fileName: string;
  contentType: string;
  storagePath: string;
  downloadUrl: string;
  createdAtMs: number;
};

type NoteAttachmentFirestoreDoc = {
  id: string;
  ownerUid?: unknown;
  folderId?: unknown;
  folderName?: unknown;
  type?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  storagePath?: unknown;
  downloadUrl?: unknown;
  createdAtMs?: unknown;
  createdAt?: unknown;
};

type UploadInput = {
  folderId: string;
  folderName: string;
  fileName: string;
  localUri: string;
  type: NoteAttachmentType;
};

type ListAttachmentsDeps = {
  getCurrentUserUid: () => string | undefined;
  readAttachmentDocs: (input: {
    uid: string;
    folderId: string;
  }) => Promise<NoteAttachmentFirestoreDoc[]>;
};

type UploadAttachmentDeps = {
  getCurrentUserUid: () => string | undefined;
  uploadFile: (input: {
    uid: string;
    folderId: string;
    fileName: string;
    localUri: string;
    type: NoteAttachmentType;
    contentType: string;
  }) => Promise<{ storagePath: string; downloadUrl: string }>;
  createAttachmentDoc: (input: {
    uid: string;
    folderId: string;
    payload: Omit<NoteAttachmentRecord, "id">;
  }) => Promise<{ id: string; createdAtMs?: number }>;
};

type DeleteAttachmentDeps = {
  getCurrentUserUid: () => string | undefined;
  deleteAttachmentDoc: (input: {
    uid: string;
    folderId: string;
    attachmentId: string;
  }) => Promise<void>;
  deleteStorageObject?: (input: { storagePath: string }) => Promise<void>;
};

function requireCleanId(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (value !== value.trim()) {
    throw new Error(`${label} must not contain leading or trailing spaces.`);
  }
  return value;
}

function normalizeFileName(fileName: string): string {
  const normalized = fileName.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new Error("File name is required.");
  }
  return normalized;
}

function extensionFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ?? "";
}

function inferContentType(fileName: string, type: NoteAttachmentType): string {
  const extension = extensionFromFileName(fileName);
  const imageTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
  };
  const documentTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    rtf: "application/rtf",
    csv: "text/csv",
    zip: "application/zip",
  };
  if (type === "image") {
    return imageTypes[extension] ?? "image/jpeg";
  }
  return documentTypes[extension] ?? "application/octet-stream";
}

function mapAttachmentType(value: unknown): NoteAttachmentType | null {
  if (value === "image" || value === "document") {
    return value;
  }
  return null;
}

function asTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

function mapAttachmentDocToRecord(
  doc: NoteAttachmentFirestoreDoc,
): NoteAttachmentRecord | null {
  const type = mapAttachmentType(doc.type);
  if (!type) {
    return null;
  }
  if (
    typeof doc.ownerUid !== "string" ||
    typeof doc.folderId !== "string" ||
    typeof doc.folderName !== "string" ||
    typeof doc.fileName !== "string" ||
    typeof doc.contentType !== "string" ||
    typeof doc.storagePath !== "string" ||
    typeof doc.downloadUrl !== "string"
  ) {
    return null;
  }
  const createdAtMs =
    asTimestampMs(doc.createdAtMs) ??
    asTimestampMs(doc.createdAt) ??
    Date.now();
  return {
    id: doc.id,
    ownerUid: doc.ownerUid,
    folderId: doc.folderId,
    folderName: doc.folderName,
    type,
    fileName: normalizeFileName(doc.fileName),
    contentType: doc.contentType,
    storagePath: doc.storagePath,
    downloadUrl: doc.downloadUrl,
    createdAtMs,
  };
}

function folderStorageKey(uid: string, folderId: string): string {
  return `${uid}::${folderId}`;
}

async function getCurrentUserUidFromFirebase(): Promise<string> {
  const { auth } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to use note attachments.");
  }
  return uid;
}

function listLocalAttachments(
  uid: string,
  folderId: string,
): NoteAttachmentRecord[] {
  const key = folderStorageKey(uid, folderId);
  const records = inMemoryAttachmentsByFolder.get(key) ?? [];
  return [...records].sort(
    (left, right) => right.createdAtMs - left.createdAtMs,
  );
}

function upsertLocalAttachment(
  record: NoteAttachmentRecord,
): NoteAttachmentRecord {
  const key = folderStorageKey(record.ownerUid, record.folderId);
  const records = inMemoryAttachmentsByFolder.get(key) ?? [];
  inMemoryAttachmentsByFolder.set(key, [record, ...records]);
  return record;
}

function deleteLocalAttachment(
  uid: string,
  folderId: string,
  attachmentId: string,
): void {
  const key = folderStorageKey(uid, folderId);
  const records = inMemoryAttachmentsByFolder.get(key) ?? [];
  const target = records.find((record) => record.id === attachmentId);
  if (target?.downloadUrl?.startsWith("file://")) {
    void import("expo-file-system/legacy").then((fs) =>
      fs.deleteAsync(target.downloadUrl, { idempotent: true }).catch(() => {}),
    );
  }
  const next = records.filter((record) => record.id !== attachmentId);
  inMemoryAttachmentsByFolder.set(key, next);
}

export function noteAttachmentsCollectionPath(
  uid: string,
  folderId: string,
): string {
  const userId = requireCleanId(uid, "User id");
  const cleanFolderId = requireCleanId(folderId, "Folder id");
  return `users/${userId}/noteFolders/${cleanFolderId}/attachments`;
}

export function noteAttachmentDocPath(
  uid: string,
  folderId: string,
  attachmentId: string,
): string {
  const cleanAttachmentId = requireCleanId(attachmentId, "Attachment id");
  return `${noteAttachmentsCollectionPath(uid, folderId)}/${cleanAttachmentId}`;
}

export async function listNoteAttachmentsForCurrentUserFolder(
  folderId: string,
  deps?: ListAttachmentsDeps,
): Promise<NoteAttachmentRecord[]> {
  const cleanFolderId = requireCleanId(folderId, "Folder id");
  if (deps) {
    const uid = deps.getCurrentUserUid();
    if (!uid) {
      throw new Error("You must be signed in to browse note attachments.");
    }
    const docs = await deps.readAttachmentDocs({
      uid,
      folderId: cleanFolderId,
    });
    return docs
      .map(mapAttachmentDocToRecord)
      .filter((record): record is NoteAttachmentRecord => record !== null)
      .sort((left, right) => right.createdAtMs - left.createdAtMs);
  }

  const uid = await getCurrentUserUidFromFirebase();
  return listLocalAttachments(uid, cleanFolderId);
}

export async function uploadNoteAttachmentForCurrentUserFolder(
  input: UploadInput,
  deps?: UploadAttachmentDeps,
): Promise<NoteAttachmentRecord> {
  const folderId = requireCleanId(input.folderId, "Folder id");
  const folderName = input.folderName.trim() || "General Notes";
  const fileName = normalizeFileName(input.fileName);
  const localUri = input.localUri.trim();
  if (!localUri) {
    throw new Error("File URI is required.");
  }
  const contentType = inferContentType(fileName, input.type);

  if (deps) {
    const uid = deps.getCurrentUserUid();
    if (!uid) {
      throw new Error("You must be signed in to upload attachments.");
    }
    const createdAtMs = Date.now();
    const uploaded = await deps.uploadFile({
      uid,
      folderId,
      fileName,
      localUri,
      type: input.type,
      contentType,
    });
    const created = await deps.createAttachmentDoc({
      uid,
      folderId,
      payload: {
        ownerUid: uid,
        folderId,
        folderName,
        type: input.type,
        fileName,
        contentType,
        storagePath: uploaded.storagePath,
        downloadUrl: uploaded.downloadUrl,
        createdAtMs,
      },
    });
    const resolvedCreatedAtMs =
      typeof created.createdAtMs === "number"
        ? created.createdAtMs
        : createdAtMs;
    return {
      id: created.id,
      ownerUid: uid,
      folderId,
      folderName,
      type: input.type,
      fileName,
      contentType,
      storagePath: uploaded.storagePath,
      downloadUrl: uploaded.downloadUrl,
      createdAtMs: resolvedCreatedAtMs,
    };
  }

  const uid = await getCurrentUserUidFromFirebase();
  const createdAtMs = Date.now();
  const id = `local-${createdAtMs}-${Math.random().toString(36).slice(2, 9)}`;
  const persistedUri = await persistPickedFileToAppDocumentDirectory(
    localUri,
    fileName,
  );
  const record: NoteAttachmentRecord = {
    id,
    ownerUid: uid,
    folderId,
    folderName,
    type: input.type,
    fileName,
    contentType,
    storagePath: `local://${uid}/${folderId}/${id}`,
    downloadUrl: persistedUri,
    createdAtMs,
  };
  return upsertLocalAttachment(record);
}

export async function deleteNoteAttachmentForCurrentUserFolder(
  input: {
    folderId: string;
    attachmentId: string;
    storagePath?: string;
  },
  deps?: DeleteAttachmentDeps,
): Promise<void> {
  const folderId = requireCleanId(input.folderId, "Folder id");
  const attachmentId = requireCleanId(input.attachmentId, "Attachment id");

  if (deps) {
    const uid = deps.getCurrentUserUid();
    if (!uid) {
      throw new Error("You must be signed in to delete attachments.");
    }
    await deps.deleteAttachmentDoc({
      uid,
      folderId,
      attachmentId,
    });
    if (input.storagePath && deps.deleteStorageObject) {
      await deps.deleteStorageObject({ storagePath: input.storagePath });
    }
    return;
  }

  const uid = await getCurrentUserUidFromFirebase();
  deleteLocalAttachment(uid, folderId, attachmentId);
}

export function mapNoteAttachmentErrorToMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "permission-denied"
  ) {
    return "You do not have permission to upload attachments in this folder.";
  }
  if (error instanceof Error && error.message.includes("signed in")) {
    return "Please sign in again, then retry this attachment action.";
  }
  if (
    error instanceof Error &&
    error.message.includes("File URI is required")
  ) {
    return "Please choose a valid file before uploading.";
  }
  if (
    error instanceof Error &&
    error.message.includes("Could not save a local copy")
  ) {
    return error.message;
  }
  return "We could not upload this attachment right now. Please try again.";
}

export function clearLocalNoteAttachmentsForTests(): void {
  inMemoryAttachmentsByFolder.clear();
}
