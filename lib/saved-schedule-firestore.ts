export const SAVED_SCHEDULES_SUBCOLLECTION = 'savedSchedules';
const USERS_COLLECTION = 'users';

function requireCleanId(value: string, label: string): string {
  if (!value.trim()) {
    throw new Error(`${label} is required.`);
  }
  if (value !== value.trim()) {
    throw new Error(`${label} must not contain leading or trailing spaces.`);
  }
  return value;
}

export function savedSchedulesCollectionPath(uid: string): string {
  const userId = requireCleanId(uid, 'User id');
  return `${USERS_COLLECTION}/${userId}/${SAVED_SCHEDULES_SUBCOLLECTION}`;
}

export function savedScheduleDocPath(uid: string, scheduleId: string): string {
  const docId = requireCleanId(scheduleId, 'Schedule id');
  return `${savedSchedulesCollectionPath(uid)}/${docId}`;
}

export function shouldAllowSavedScheduleOwnerWrite(input: {
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

export type SavedPlanSchedule = {
  SUN: unknown[];
  MON: unknown[];
  TUE: unknown[];
  WED: unknown[];
  THU: unknown[];
  FRI: unknown[];
};

export type SavedPlanRecord = {
  id: string;
  date: string;
  fitScore: number;
  schedule: SavedPlanSchedule;
};

type SaveGeneratedPlanParams = {
  fitScore: number;
  schedule: SavedPlanSchedule;
};

type SavedPlanFirestoreDoc = {
  id: string;
  fitScore?: number;
  schedule?: unknown;
  createdAt?: unknown;
};

type SaveGeneratedPlanDeps = {
  getCurrentUserUid: () => string | undefined;
  now: () => Date;
  writeScheduleDoc: (input: {
    uid: string;
    planId: string;
    fitScore: number;
    schedule: SavedPlanSchedule;
    dateLabel: string;
  }) => Promise<void>;
};

type ReadSavedPlansDeps = {
  getCurrentUserUid: () => string | undefined;
  readScheduleDocs: (uid: string) => Promise<SavedPlanFirestoreDoc[]>;
};

type DeleteSavedPlanDeps = {
  getCurrentUserUid: () => string | undefined;
  deleteScheduleDoc: (input: { uid: string; planId: string }) => Promise<void>;
};

let localPlanSequence = 0;

function createLocalPlanId(now: Date): string {
  localPlanSequence += 1;
  return `plan-${now.getTime()}-${localPlanSequence}`;
}

function formatSavedPlanTimestamp(date: Date): string {
  const datePart = date.toLocaleDateString('en-GB');
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleanedEntries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefinedDeep(v)] as const);
    return Object.fromEntries(cleanedEntries) as T;
  }
  return value;
}

function timestampToMillis(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    const candidate = value as { toMillis?: unknown };
    if (typeof candidate.toMillis === 'function') {
      const result = candidate.toMillis();
      return typeof result === 'number' ? result : null;
    }
  }
  return null;
}

function normalizeSavedSchedule(input: unknown): SavedPlanSchedule {
  const source = input as Partial<Record<keyof SavedPlanSchedule, unknown>> | undefined;
  return {
    SUN: Array.isArray(source?.SUN) ? stripUndefinedDeep(source.SUN) : [],
    MON: Array.isArray(source?.MON) ? stripUndefinedDeep(source.MON) : [],
    TUE: Array.isArray(source?.TUE) ? stripUndefinedDeep(source.TUE) : [],
    WED: Array.isArray(source?.WED) ? stripUndefinedDeep(source.WED) : [],
    THU: Array.isArray(source?.THU) ? stripUndefinedDeep(source.THU) : [],
    FRI: Array.isArray(source?.FRI) ? stripUndefinedDeep(source.FRI) : [],
  };
}

function mapSavedPlanDocToRecord(doc: SavedPlanFirestoreDoc): SavedPlanRecord {
  const createdAtMillis = timestampToMillis(doc.createdAt);
  return {
    id: doc.id,
    date:
      createdAtMillis !== null
        ? formatSavedPlanTimestamp(new Date(createdAtMillis))
        : 'Unknown date',
    fitScore: typeof doc.fitScore === 'number' ? doc.fitScore : 0,
    schedule: normalizeSavedSchedule(doc.schedule),
  };
}

async function saveGeneratedPlanWithFirebase(params: SaveGeneratedPlanParams): Promise<SavedPlanRecord> {
  const { auth, db } = await import('@/lib/firebase');
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to save plans.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  const { collection, doc, serverTimestamp, setDoc } = await import('firebase/firestore');
  const now = new Date();
  const schedulesCollectionRef = collection(
    db,
    USERS_COLLECTION,
    uid,
    SAVED_SCHEDULES_SUBCOLLECTION,
  );
  const ref = doc(schedulesCollectionRef);
  const planId = ref.id;
  const dateLabel = formatSavedPlanTimestamp(now);
  // Must use separate path segments — not `doc(db, "users/uid/savedSchedules", id)` — or the write targets the wrong path and rules return permission-denied.
  const cleanedSchedule = stripUndefinedDeep(params.schedule);
  await setDoc(ref, {
    ownerUid: uid,
    title: `Saved plan ${dateLabel}`,
    fitScore: params.fitScore,
    schedule: cleanedSchedule,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: planId,
    date: dateLabel,
    fitScore: params.fitScore,
    schedule: cleanedSchedule,
  };
}

/**
 * Loads a single saved plan by id for the signed-in user (e.g. deep link to detail).
 */
export async function getSavedPlanByIdForCurrentUser(
  planId: string,
): Promise<SavedPlanRecord | null> {
  const id = planId.trim();
  if (!id) {
    return null;
  }
  const { auth, db } = await import('@/lib/firebase');
  if (typeof auth?.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to open saved plans.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  const { doc, getDoc } = await import('firebase/firestore');
  const ref = doc(db, USERS_COLLECTION, uid, SAVED_SCHEDULES_SUBCOLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }
  const data = snap.data() as { ownerUid?: unknown };
  if (data.ownerUid !== uid) {
    return null;
  }
  return mapSavedPlanDocToRecord({
    id: snap.id,
    ...(snap.data() as Omit<SavedPlanFirestoreDoc, 'id'>),
  });
}

async function listSavedPlansWithFirebase(): Promise<SavedPlanRecord[]> {
  const { auth, db } = await import('@/lib/firebase');
  if (typeof auth?.authStateReady === 'function') {
    await auth.authStateReady();
  }
  const uid = auth?.currentUser?.uid;
  if (!uid) {
    throw new Error('You must be signed in to browse saved plans.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const schedulesRef = collection(db, USERS_COLLECTION, uid, SAVED_SCHEDULES_SUBCOLLECTION);
  // Include ownerUid filter so query shape matches security rule constraints.
  const scheduleQuery = query(schedulesRef, where('ownerUid', '==', uid));
  const snapshot = await getDocs(scheduleQuery);
  const docs = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SavedPlanFirestoreDoc, 'id'>),
  }));
  docs.sort(
    (left, right) =>
      (timestampToMillis(right.createdAt) ?? -1) - (timestampToMillis(left.createdAt) ?? -1),
  );
  return docs.map((doc) =>
    mapSavedPlanDocToRecord({
      id: doc.id,
      fitScore: doc.fitScore,
      schedule: doc.schedule,
      createdAt: doc.createdAt,
    }),
  );
}

export async function saveGeneratedPlanForCurrentUser(
  params: SaveGeneratedPlanParams,
  deps?: SaveGeneratedPlanDeps,
): Promise<SavedPlanRecord> {
  const cleanedSchedule = stripUndefinedDeep(params.schedule);
  if (!deps) {
    return saveGeneratedPlanWithFirebase({
      ...params,
      schedule: cleanedSchedule,
    });
  }
  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error('You must be signed in to save plans.');
  }
  const now = deps.now();
  const planId = createLocalPlanId(now);
  const dateLabel = formatSavedPlanTimestamp(now);
  await deps.writeScheduleDoc({
    uid,
    planId,
    fitScore: params.fitScore,
    schedule: cleanedSchedule,
    dateLabel,
  });
  return {
    id: planId,
    date: dateLabel,
    fitScore: params.fitScore,
    schedule: cleanedSchedule,
  };
}

export async function listSavedPlansForCurrentUser(
  deps?: ReadSavedPlansDeps,
): Promise<SavedPlanRecord[]> {
  if (!deps) {
    return listSavedPlansWithFirebase();
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error('You must be signed in to browse saved plans.');
  }

  const docs = await deps.readScheduleDocs(uid);
  docs.sort(
    (left, right) =>
      (timestampToMillis(right.createdAt) ?? -1) - (timestampToMillis(left.createdAt) ?? -1),
  );
  return docs.map(mapSavedPlanDocToRecord);
}

export async function deleteSavedPlanForCurrentUser(
  planId: string,
  deps?: DeleteSavedPlanDeps,
): Promise<void> {
  const trimmedPlanId = planId.trim();
  if (!trimmedPlanId) {
    throw new Error('Saved plan id is required.');
  }

  if (!deps) {
    const { auth, db } = await import('@/lib/firebase');
    if (typeof auth?.authStateReady === 'function') {
      await auth.authStateReady();
    }
    const uid = auth?.currentUser?.uid;
    if (!uid) {
      throw new Error('You must be signed in to delete saved plans.');
    }
    if (!db) {
      throw new Error('Firestore is not configured.');
    }
    const { deleteDoc, doc } = await import('firebase/firestore');
    const ref = doc(db, USERS_COLLECTION, uid, SAVED_SCHEDULES_SUBCOLLECTION, trimmedPlanId);
    await deleteDoc(ref);
    return;
  }

  const uid = deps.getCurrentUserUid();
  if (!uid) {
    throw new Error('You must be signed in to delete saved plans.');
  }
  await deps.deleteScheduleDoc({ uid, planId: trimmedPlanId });
}

export function mapSavedPlanWriteErrorToMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'permission-denied'
  ) {
    return 'You do not have permission to save this plan.';
  }
  if (error instanceof Error && error.message.includes('signed in')) {
    return 'Please sign in again, then try saving your plan.';
  }
  if (error instanceof Error && error.message.includes('Firestore is not configured')) {
    return 'Firebase is not configured. Please connect Firebase before saving.';
  }
  return 'We could not save your plan right now. Please try again.';
}

export function mapSavedPlanReadErrorToMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'permission-denied'
  ) {
    return 'You do not have permission to view these saved plans.';
  }
  if (error instanceof Error && error.message.includes('signed in')) {
    return 'Please sign in again, then open Saved once more.';
  }
  if (error instanceof Error && error.message.includes('Firestore is not configured')) {
    return 'Firebase is not configured. Please connect Firebase before opening Saved.';
  }
  return 'We could not load your saved plans right now. Please try again.';
}

export function mapSavedPlanDeleteErrorToMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'permission-denied'
  ) {
    return 'You do not have permission to delete this saved plan.';
  }
  if (error instanceof Error && error.message.includes('signed in')) {
    return 'Please sign in again, then try deleting this plan.';
  }
  if (error instanceof Error && error.message.includes('Firestore is not configured')) {
    return 'Firebase is not configured. Please connect Firebase before deleting.';
  }
  return 'We could not delete this plan right now. Please try again.';
}
