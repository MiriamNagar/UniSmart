const USERS_COLLECTION = "users";
export const NOTE_FOLDERS_SUBCOLLECTION = "noteFolders";

export type NoteFolderScope = "general" | "course" | "custom";

export type NoteFolderRecord = {
  id: string;
  name: string;
  scope: NoteFolderScope;
  ownerUid: string;
  courseCode?: string;
};

type NoteFolderFirestoreDoc = {
  id: string;
  name?: unknown;
  scope?: unknown;
  ownerUid?: unknown;
  courseCode?: unknown;
};

type CourseFolderSeed = {
  courseCode: string;
  courseName: string;
};

type CreateCustomFolderDeps = {
  getCurrentUserUid: () => string | undefined;
  listFolderDocs: (uid: string) => Promise<NoteFolderFirestoreDoc[]>;
  createFolderDoc: (input: {
    uid: string;
    folderName: string;
    normalizedName: string;
  }) => Promise<{ id: string }>;
};

type ReadNoteFoldersDeps = {
  getCurrentUserUid: () => string | undefined;
  readFolderDocs: (uid: string) => Promise<NoteFolderFirestoreDoc[]>;
};

type SyncNoteFoldersDeps = {
  getCurrentUserUid: () => string | undefined;
  upsertFolderDocs: (input: {
    uid: string;
    folders: (Omit<NoteFolderRecord, "id"> & {
      id: string;
      normalizedName: string;
    })[];
  }) => Promise<void>;
};

export type SyncDefaultNoteFoldersResult = {
  addedCount: number;
};

type DeleteNoteFoldersDeps = {
  getCurrentUserUid: () => string | undefined;
  deleteFolderDocs: (input: {
    uid: string;
    folderIds: string[];
  }) => Promise<void>;
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

function normalizeFolderName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeNameForLookup(name: string): string {
  return normalizeFolderName(name).toLocaleLowerCase();
}

function cleanCourseCode(courseCode: string): string {
  return requireCleanId(courseCode, "Course code");
}

function toCourseFolderSeed(value: unknown): CourseFolderSeed | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const candidate = value as { courseCode?: unknown; courseName?: unknown };
  if (typeof candidate.courseCode !== "string") {
    return null;
  }
  const cleanCode = candidate.courseCode.trim();
  if (!cleanCode) {
    return null;
  }
  const name =
    typeof candidate.courseName === "string" && candidate.courseName.trim()
      ? candidate.courseName
      : cleanCode;
  return { courseCode: cleanCode, courseName: name };
}

function mapScope(value: unknown): NoteFolderScope | null {
  if (value === "general" || value === "course" || value === "custom") {
    return value;
  }
  return null;
}

function mapNoteFolderDocToRecord(
  doc: NoteFolderFirestoreDoc,
): NoteFolderRecord | null {
  const scope = mapScope(doc.scope);
  if (!scope) {
    return null;
  }
  if (typeof doc.name !== "string" || !doc.name.trim()) {
    return null;
  }
  if (typeof doc.ownerUid !== "string" || !doc.ownerUid.trim()) {
    return null;
  }
  if (scope === "course" && typeof doc.courseCode !== "string") {
    return null;
  }
  return {
    id: doc.id,
    name: normalizeFolderName(doc.name),
    scope,
    ownerUid: doc.ownerUid,
    courseCode: typeof doc.courseCode === "string" ? doc.courseCode : undefined,
  };
}

function compareFolders(
  left: NoteFolderRecord,
  right: NoteFolderRecord,
): number {
  const rank: Record<NoteFolderScope, number> = {
    general: 0,
    course: 1,
    custom: 2,
  };
  const byScope = rank[left.scope] - rank[right.scope];
  if (byScope !== 0) {
    return byScope;
  }
  return left.name.localeCompare(right.name);
}

function seedDefaultFolders(
  courseFolders: CourseFolderSeed[],
  uid: string,
): (Omit<NoteFolderRecord, "id"> & { id: string; normalizedName: string })[] {
  const courses = new Map<string, string>();
  for (const folder of courseFolders) {
    const code = cleanCourseCode(folder.courseCode);
    if (courses.has(code)) {
      continue;
    }
    const cleanCourseName = normalizeFolderName(folder.courseName).replace(
      /\.\.\.$/,
      "",
    );
    courses.set(code, cleanCourseName || code);
  }

  const seeded: (Omit<NoteFolderRecord, "id"> & {
    id: string;
    normalizedName: string;
  })[] = [
    {
      id: "general",
      ownerUid: uid,
      scope: "general",
      name: "General Notes",
      normalizedName: normalizeNameForLookup("General Notes"),
    },
  ];

  for (const [courseCode, courseName] of courses) {
    const name = `${courseCode}: ${courseName}`;
    seeded.push({
      id: `course-${courseCode}`,
      ownerUid: uid,
      scope: "course",
      courseCode,
      name,
      normalizedName: normalizeNameForLookup(name),
    });
  }

  return seeded;
}

function makeCustomFolderDocId(normalizedName: string): string {
  return `custom-${encodeURIComponent(normalizedName)}`;
}

export function extractCourseFoldersFromSchedule(
  schedule: Record<string, unknown>,
): CourseFolderSeed[] {
  const courses = new Map<string, CourseFolderSeed>();
  Object.values(schedule).forEach((dayCourses) => {
    if (!Array.isArray(dayCourses)) {
      return;
    }
    dayCourses.forEach((course) => {
      const seed = toCourseFolderSeed(course);
      if (!seed || courses.has(seed.courseCode)) {
        return;
      }
      courses.set(seed.courseCode, seed);
    });
  });
  return Array.from(courses.values());
}

export function extractCourseFoldersFromSchedules(
  schedules: Record<string, unknown>[],
): CourseFolderSeed[] {
  const merged = new Map<string, CourseFolderSeed>();
  schedules.forEach((schedule) => {
    extractCourseFoldersFromSchedule(schedule).forEach((seed) => {
      if (!merged.has(seed.courseCode)) {
        merged.set(seed.courseCode, seed);
      }
    });
  });
  return Array.from(merged.values());
}

export function noteFoldersCollectionPath(uid: string): string {
  const userId = requireCleanId(uid, "User id");
  return `${USERS_COLLECTION}/${userId}/${NOTE_FOLDERS_SUBCOLLECTION}`;
}

export function noteFolderDocPath(uid: string, folderId: string): string {
  const docId = requireCleanId(folderId, "Folder id");
  return `${noteFoldersCollectionPath(uid)}/${docId}`;
}

export function shouldAllowNoteFolderOwnerWrite(input: {
  authUid: string;
  pathUid: string;
  ownerUid: string;
}): boolean {
  const fields = [input.authUid, input.pathUid, input.ownerUid];
  if (fields.some((value) => !value || value !== value.trim())) {
    return false;
  }
  return input.authUid === input.pathUid && input.authUid === input.ownerUid;
}

async function listNoteFoldersWithFirebase(): Promise<NoteFolderRecord[]> {
  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to browse note folders.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const { collection, getDocs, query, where } =
    await import("firebase/firestore");
  const foldersRef = collection(
    db,
    USERS_COLLECTION,
    uid,
    NOTE_FOLDERS_SUBCOLLECTION,
  );
  const foldersQuery = query(foldersRef, where("ownerUid", "==", uid));
  const snapshot = await getDocs(foldersQuery);
  return snapshot.docs
    .map((doc) =>
      mapNoteFolderDocToRecord({
        id: doc.id,
        ...(doc.data() as Omit<NoteFolderFirestoreDoc, "id">),
      }),
    )
    .filter((record): record is NoteFolderRecord => record !== null)
    .sort(compareFolders);
}

async function createCustomFolderWithFirebase(
  name: string,
): Promise<NoteFolderRecord> {
  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to create note folders.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const trimmedName = normalizeFolderName(name);
  if (!trimmedName) {
    throw new Error("Folder name is required.");
  }

  const normalizedName = normalizeNameForLookup(trimmedName);
  const customDocId = makeCustomFolderDocId(normalizedName);
  const {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
  } = await import("firebase/firestore");
  const foldersRef = collection(
    db,
    USERS_COLLECTION,
    uid,
    NOTE_FOLDERS_SUBCOLLECTION,
  );
  const existingOwnerFolders = await getDocs(
    query(foldersRef, where("ownerUid", "==", uid)),
  );
  const duplicateExists = existingOwnerFolders.docs.some((doc) => {
    const data = doc.data();
    if (data.scope !== "custom") {
      return false;
    }
    const docName = data.normalizedName;
    return typeof docName === "string" && docName === normalizedName;
  });
  if (duplicateExists) {
    throw new Error("A folder with this name already exists.");
  }
  const folderRef = doc(
    db,
    USERS_COLLECTION,
    uid,
    NOTE_FOLDERS_SUBCOLLECTION,
    customDocId,
  );
  // setDoc avoids transaction.get on a missing doc (that read fails under strict folder read rules).
  await setDoc(folderRef, {
    ownerUid: uid,
    scope: "custom",
    name: trimmedName,
    normalizedName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: customDocId,
    ownerUid: uid,
    scope: "custom",
    name: trimmedName,
  };
}

async function syncDefaultFoldersWithFirebase(
  courseFolders: CourseFolderSeed[],
): Promise<SyncDefaultNoteFoldersResult> {
  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to sync note folders.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const {
    collection,
    doc,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
  } = await import("firebase/firestore");
  const folders = seedDefaultFolders(courseFolders, uid);
  const existingDocs = await getDocs(
    query(
      collection(db, USERS_COLLECTION, uid, NOTE_FOLDERS_SUBCOLLECTION),
      where("ownerUid", "==", uid),
    ),
  );
  const existingFolderIds = new Set(existingDocs.docs.map((doc) => doc.id));
  const addedCount = folders.filter(
    (folder) => !existingFolderIds.has(folder.id),
  ).length;
  const batch = writeBatch(db);
  for (const folder of folders) {
    const folderRef = doc(
      db,
      USERS_COLLECTION,
      uid,
      NOTE_FOLDERS_SUBCOLLECTION,
      folder.id,
    );
    const folderPayload: {
      ownerUid: string;
      scope: NoteFolderScope;
      name: string;
      normalizedName: string;
      updatedAt: unknown;
      courseCode?: string;
      createdAt?: unknown;
    } = {
      ownerUid: folder.ownerUid,
      scope: folder.scope,
      name: folder.name,
      normalizedName: folder.normalizedName,
      updatedAt: serverTimestamp(),
    };
    if (!existingFolderIds.has(folder.id)) {
      folderPayload.createdAt = serverTimestamp();
    }
    if (folder.courseCode) {
      folderPayload.courseCode = folder.courseCode;
    }
    batch.set(folderRef, folderPayload, { merge: true });
  }
  await batch.commit();
  return { addedCount };
}

async function deleteNoteFoldersWithFirebase(
  folderIds: string[],
): Promise<void> {
  const sanitizedFolderIds = Array.from(
    new Set(folderIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (sanitizedFolderIds.length === 0) {
    return;
  }

  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to delete note folders.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const { deleteDoc, doc } = await import("firebase/firestore");
  await Promise.all(
    sanitizedFolderIds.map((folderId) =>
      deleteDoc(
        doc(db, USERS_COLLECTION, uid, NOTE_FOLDERS_SUBCOLLECTION, folderId),
      ),
    ),
  );
}

export async function listNoteFoldersForCurrentUser(
  deps?: ReadNoteFoldersDeps,
): Promise<NoteFolderRecord[]> {
  if (!deps) {
    return listNoteFoldersWithFirebase();
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error("You must be signed in to browse note folders.");
  }
  const docs = await deps.readFolderDocs(uid);
  return docs
    .map(mapNoteFolderDocToRecord)
    .filter((record): record is NoteFolderRecord => record !== null)
    .sort(compareFolders);
}

export async function createCustomNoteFolderForCurrentUser(
  name: string,
  deps?: CreateCustomFolderDeps,
): Promise<NoteFolderRecord> {
  if (!deps) {
    return createCustomFolderWithFirebase(name);
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error("You must be signed in to create note folders.");
  }
  const trimmedName = normalizeFolderName(name);
  if (!trimmedName) {
    throw new Error("Folder name is required.");
  }

  const normalizedName = normalizeNameForLookup(trimmedName);
  const existing = await deps.listFolderDocs(uid);
  const duplicateExists = existing.some((doc) => {
    if (doc.scope !== "custom") {
      return false;
    }
    return (
      normalizeNameForLookup(typeof doc.name === "string" ? doc.name : "") ===
      normalizedName
    );
  });
  if (duplicateExists) {
    throw new Error("A folder with this name already exists.");
  }

  const created = await deps.createFolderDoc({
    uid,
    folderName: trimmedName,
    normalizedName,
  });
  return {
    id: created.id,
    ownerUid: uid,
    scope: "custom",
    name: trimmedName,
  };
}

export async function syncDefaultNoteFoldersForCurrentUser(
  courseFolders: CourseFolderSeed[],
  deps?: SyncNoteFoldersDeps,
): Promise<SyncDefaultNoteFoldersResult> {
  if (!deps) {
    return syncDefaultFoldersWithFirebase(courseFolders);
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error("You must be signed in to sync note folders.");
  }
  const folders = seedDefaultFolders(courseFolders, uid);
  await deps.upsertFolderDocs({ uid, folders });
  return { addedCount: folders.length };
}

export async function deleteNoteFoldersForCurrentUser(
  folderIds: string[],
  deps?: DeleteNoteFoldersDeps,
): Promise<void> {
  const sanitizedFolderIds = Array.from(
    new Set(folderIds.map((value) => value.trim()).filter(Boolean)),
  );
  if (sanitizedFolderIds.length === 0) {
    return;
  }

  if (!deps) {
    return deleteNoteFoldersWithFirebase(sanitizedFolderIds);
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error("You must be signed in to delete note folders.");
  }
  await deps.deleteFolderDocs({ uid, folderIds: sanitizedFolderIds });
}

export function mapNoteFolderErrorToMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes("already exists")) {
    return "A folder with this name already exists.";
  }
  if (
    error instanceof Error &&
    error.message.includes("Folder name is required")
  ) {
    return "Please enter a folder name.";
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "permission-denied"
  ) {
    return "You do not have permission to update note folders.";
  }
  if (error instanceof Error && error.message.includes("signed in")) {
    return "Please sign in again, then retry this folder action.";
  }
  if (
    error instanceof Error &&
    error.message.includes("Firestore is not configured")
  ) {
    return "Firebase is not configured. Please connect Firebase before using folders.";
  }
  return "We could not update note folders right now. Please try again.";
}
