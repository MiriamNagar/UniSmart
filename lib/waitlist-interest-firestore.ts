const USERS_COLLECTION = "users";
export const WAITLIST_INTERESTS_SUBCOLLECTION = "waitlistInterests";

function requireCleanId(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (value !== value.trim()) {
    throw new Error(`${label} must not contain leading or trailing spaces.`);
  }
  return value;
}

export function waitlistInterestsCollectionPath(uid: string): string {
  const userId = requireCleanId(uid, "User id");
  return `${USERS_COLLECTION}/${userId}/${WAITLIST_INTERESTS_SUBCOLLECTION}`;
}

export function waitlistInterestDocPath(uid: string, interestId: string): string {
  const docId = requireCleanId(interestId, "Waitlist interest id");
  return `${waitlistInterestsCollectionPath(uid)}/${docId}`;
}

export function shouldAllowWaitlistInterestOwnerWrite(input: {
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

export type WaitlistInterestRecord = {
  id: string;
  docPath: string;
  ownerUid: string;
  courseId: string;
  courseName: string;
  sectionId: string;
  status: "waitlist" | "interest";
  createdAtMs: number;
};

type WaitlistInterestListItem = WaitlistInterestRecord;

type CreateWaitlistInterestParams = {
  courseId: string;
  courseName: string;
  sectionId: string;
  status: "waitlist" | "interest";
};

type CreateWaitlistInterestDeps = {
  getCurrentUserUid: () => string | undefined;
  now: () => Date;
  writeWaitlistInterest: (input: {
    uid: string;
    courseId: string;
    courseName: string;
    sectionId: string;
    status: "waitlist" | "interest";
    createdAtMs: number;
  }) => Promise<{ id: string }>;
};

type RemoveWaitlistInterestParams = {
  courseId: string;
  sectionId: string;
  status?: "waitlist" | "interest";
};

function normalizeWaitlistPayload(params: CreateWaitlistInterestParams) {
  const courseId = requireCleanId(params.courseId, "Course id");
  const courseName = requireCleanId(params.courseName, "Course name");
  const sectionId = requireCleanId(params.sectionId, "Section id");
  return {
    courseId,
    courseName,
    sectionId,
    status: params.status,
  };
}

async function createWaitlistInterestWithFirebase(
  params: CreateWaitlistInterestParams,
): Promise<WaitlistInterestRecord> {
  const payload = normalizeWaitlistPayload(params);
  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to join a waitlist.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }
  const { addDoc, collection, serverTimestamp } = await import(
    "firebase/firestore"
  );
  const createdAtMs = Date.now();
  const ref = await addDoc(
    collection(db, USERS_COLLECTION, uid, WAITLIST_INTERESTS_SUBCOLLECTION),
    {
      ownerUid: uid,
      courseId: payload.courseId,
      courseName: payload.courseName,
      sectionId: payload.sectionId,
      status: payload.status,
      createdAtMs,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  );
  if (__DEV__) {
    const { app: firebaseApp } = await import("@/lib/firebase");
    const projectId = firebaseApp?.options?.projectId ?? "(unknown)";
    console.log(
      `[waitlist] Saved to Firestore subcollection "${WAITLIST_INTERESTS_SUBCOLLECTION}": ${ref.path} (projectId=${projectId})`,
    );
  }
  return {
    id: ref.id,
    docPath: waitlistInterestDocPath(uid, ref.id),
    ownerUid: uid,
    courseId: payload.courseId,
    courseName: payload.courseName,
    sectionId: payload.sectionId,
    status: payload.status,
    createdAtMs,
  };
}

async function getCurrentUserUidWithFirebase(): Promise<string> {
  const { auth } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error("You must be signed in to join a waitlist.");
  }
  return uid;
}

export async function listWaitlistInterestsForCurrentUser(): Promise<
  WaitlistInterestListItem[]
> {
  const uid = await getCurrentUserUidWithFirebase();
  const { db } = await import("@/lib/firebase");
  if (!db) {
    throw new Error("Firestore is not configured.");
  }
  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const snap = await getDocs(
    query(
      collection(db, USERS_COLLECTION, uid, WAITLIST_INTERESTS_SUBCOLLECTION),
      where("ownerUid", "==", uid),
    ),
  );
  return snap.docs
    .map((docSnap) => {
      const data = docSnap.data() as {
        ownerUid?: unknown;
        courseId?: unknown;
        courseName?: unknown;
        sectionId?: unknown;
        status?: unknown;
        createdAtMs?: unknown;
      };
      if (
        typeof data.ownerUid !== "string" ||
        typeof data.courseId !== "string" ||
        typeof data.courseName !== "string" ||
        typeof data.sectionId !== "string" ||
        (data.status !== "waitlist" && data.status !== "interest") ||
        typeof data.createdAtMs !== "number"
      ) {
        return null;
      }
      return {
        id: docSnap.id,
        docPath: waitlistInterestDocPath(uid, docSnap.id),
        ownerUid: data.ownerUid,
        courseId: data.courseId,
        courseName: data.courseName,
        sectionId: data.sectionId,
        status: data.status,
        createdAtMs: data.createdAtMs,
      } satisfies WaitlistInterestListItem;
    })
    .filter((item): item is WaitlistInterestListItem => item !== null);
}

export async function removeWaitlistInterestForCurrentUser(
  params: RemoveWaitlistInterestParams,
): Promise<{ removedCount: number }> {
  const courseId = requireCleanId(params.courseId, "Course id");
  const sectionId = requireCleanId(params.sectionId, "Section id");
  const expectedStatus = params.status ?? "waitlist";
  const uid = await getCurrentUserUidWithFirebase();
  const { db } = await import("@/lib/firebase");
  if (!db) {
    throw new Error("Firestore is not configured.");
  }
  const { collection, deleteDoc, getDocs, query, where } = await import(
    "firebase/firestore"
  );
  const snap = await getDocs(
    query(
      collection(db, USERS_COLLECTION, uid, WAITLIST_INTERESTS_SUBCOLLECTION),
      where("ownerUid", "==", uid),
      where("courseId", "==", courseId),
      where("sectionId", "==", sectionId),
      where("status", "==", expectedStatus),
    ),
  );
  const matches = snap.docs;
  if (matches.length === 0) {
    return { removedCount: 0 };
  }
  await Promise.all(matches.map((docSnap) => deleteDoc(docSnap.ref)));
  return { removedCount: matches.length };
}

export async function createWaitlistInterestForCurrentUser(
  params: CreateWaitlistInterestParams,
  deps?: CreateWaitlistInterestDeps,
): Promise<WaitlistInterestRecord> {
  const payload = normalizeWaitlistPayload(params);
  if (!deps) {
    return createWaitlistInterestWithFirebase(payload);
  }
  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error("You must be signed in to join a waitlist.");
  }
  const createdAtMs = deps.now().getTime();
  const result = await deps.writeWaitlistInterest({
    uid,
    courseId: payload.courseId,
    courseName: payload.courseName,
    sectionId: payload.sectionId,
    status: payload.status,
    createdAtMs,
  });
  return {
    id: result.id,
    docPath: waitlistInterestDocPath(uid, result.id),
    ownerUid: uid,
    courseId: payload.courseId,
    courseName: payload.courseName,
    sectionId: payload.sectionId,
    status: payload.status,
    createdAtMs,
  };
}

export function mapWaitlistInterestErrorToMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "permission-denied"
  ) {
    return "You do not have permission to join this waitlist. If you are signed in, Firestore rules for this feature may not be deployed yet, or the app may be pointed at a different Firebase project than the one you updated in the console.";
  }
  if (error instanceof Error && error.message.includes("signed in")) {
    return "Please sign in again, then try joining the waitlist.";
  }
  if (error instanceof Error && error.message.includes("Firestore is not configured")) {
    return "Firebase is not configured. Please connect Firebase before joining waitlists.";
  }
  return "We could not submit your waitlist request right now. Please try again.";
}
