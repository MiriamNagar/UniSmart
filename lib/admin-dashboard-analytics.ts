export const OFFERINGS_QUERY_LIMIT = 400;
const DEFAULT_BGU_PROGRAM_KEY = "bgu_computer_science";
const HIGH_DEMAND_THRESHOLD_PERCENT = 80;
const TOP_DEMAND_LIMIT = 5;

export type OfferingSeatSnapshot = {
  courseId: string;
  capacity?: number;
  occupancy?: number;
};

export type TopDemandCourse = {
  courseId: string;
  occupancyPercent: number;
};

export type EnrollmentSummary = {
  totalOccupancy: number;
  totalCapacity: number;
  totalSections: number;
  fullSections: number;
  highDemandSections: number;
  utilizationPercent: number;
  topDemandCourses: TopDemandCourse[];
};

export type PlannerUsageRollup = {
  plannerRuns30d: number;
  savedPlans30d: number;
  activePlanners7d: number;
  generatedAtMs?: number;
};

export type AdminDashboardAnalytics = {
  enrollment: EnrollmentSummary;
  plannerUsage: PlannerUsageRollup | null;
};

type LoadAnalyticsDeps = {
  listOfferings: (limitCount: number) => Promise<OfferingSeatSnapshot[]>;
  readPlannerUsageRollup: () => Promise<PlannerUsageRollup | null>;
};

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPermissionDeniedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "permission-denied"
  );
}

function occupancyPercent(capacity: number, occupancy: number): number {
  if (capacity <= 0) {
    return 0;
  }
  const boundedOccupancy = Math.min(Math.max(occupancy, 0), capacity);
  return Math.round((boundedOccupancy / capacity) * 100);
}

function toPlannerUsageRollupOrNull(value: unknown): PlannerUsageRollup | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const rollup = value as Record<string, unknown>;
  const plannerRuns30d = rollup.plannerRuns30d;
  const savedPlans30d = rollup.savedPlans30d;
  const activePlanners7d = rollup.activePlanners7d;
  const generatedAtMs = rollup.generatedAtMs;

  if (
    !isFiniteNonNegativeNumber(plannerRuns30d) ||
    !isFiniteNonNegativeNumber(savedPlans30d) ||
    !isFiniteNonNegativeNumber(activePlanners7d)
  ) {
    return null;
  }

  return {
    plannerRuns30d,
    savedPlans30d,
    activePlanners7d,
    generatedAtMs: isFiniteNonNegativeNumber(generatedAtMs) ? generatedAtMs : undefined,
  };
}

export function computeEnrollmentSummary(rows: OfferingSeatSnapshot[]): EnrollmentSummary {
  let totalCapacity = 0;
  let totalOccupancy = 0;
  let totalSections = 0;
  let fullSections = 0;
  let highDemandSections = 0;
  /** One row per courseId for ranking: same course can appear on many offerings. */
  const demandByCourseId = new Map<string, number>();

  for (const row of rows) {
    if (!isFiniteNonNegativeNumber(row.capacity) || !isFiniteNonNegativeNumber(row.occupancy)) {
      continue;
    }

    const capacity = row.capacity;
    const occupancy = Math.min(row.occupancy, capacity);
    const percent = occupancyPercent(capacity, occupancy);

    totalCapacity += capacity;
    totalOccupancy += occupancy;
    totalSections += 1;

    if (occupancy >= capacity && capacity > 0) {
      fullSections += 1;
    }
    if (percent >= HIGH_DEMAND_THRESHOLD_PERCENT) {
      highDemandSections += 1;
    }

    const prev = demandByCourseId.get(row.courseId);
    if (prev === undefined || percent > prev) {
      demandByCourseId.set(row.courseId, percent);
    }
  }

  const topDemandCourses = Array.from(demandByCourseId.entries())
    .map(([courseId, occupancyPercent]) => ({ courseId, occupancyPercent }))
    .sort((left, right) => right.occupancyPercent - left.occupancyPercent)
    .slice(0, TOP_DEMAND_LIMIT);

  return {
    totalOccupancy,
    totalCapacity,
    totalSections,
    fullSections,
    highDemandSections,
    utilizationPercent: occupancyPercent(totalCapacity, totalOccupancy),
    topDemandCourses,
  };
}

async function listOfferingsWithFirebase(limitCount: number): Promise<OfferingSeatSnapshot[]> {
  const { db } = await import("@/lib/firebase");
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const { collection, getDocs, limit, query, where } = await import("firebase/firestore");
  let snapshot = await getDocs(
    query(
      collection(db, "bgu_cs_offerings"),
      where("programKey", "==", DEFAULT_BGU_PROGRAM_KEY),
      limit(limitCount),
    ),
  );

  if (snapshot.empty) {
    snapshot = await getDocs(query(collection(db, "bgu_cs_offerings"), limit(limitCount)));
  }

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as {
      courseId?: unknown;
      capacity?: unknown;
      occupancy?: unknown;
    };
    return {
      courseId: typeof data.courseId === "string" ? data.courseId : docSnap.id,
      capacity: isFiniteNonNegativeNumber(data.capacity) ? data.capacity : undefined,
      occupancy: isFiniteNonNegativeNumber(data.occupancy) ? data.occupancy : undefined,
    };
  });
}

async function readPlannerUsageRollupWithFirebase(): Promise<PlannerUsageRollup | null> {
  const { auth, db } = await import("@/lib/firebase");
  if (typeof auth?.authStateReady === "function") {
    await auth.authStateReady();
  }
  if (!auth?.currentUser?.uid) {
    throw new Error("You must be signed in to view admin analytics.");
  }
  if (!db) {
    throw new Error("Firestore is not configured.");
  }

  const { doc, getDoc } = await import("firebase/firestore");
  const rollupRef = doc(db, "adminAnalyticsRollups", "global_latest");
  let rollupSnap;
  try {
    rollupSnap = await getDoc(rollupRef);
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return null;
    }
    throw error;
  }
  if (!rollupSnap.exists()) {
    return null;
  }
  return toPlannerUsageRollupOrNull(rollupSnap.data());
}

export async function loadAdminDashboardAnalytics(
  deps?: LoadAnalyticsDeps,
): Promise<AdminDashboardAnalytics> {
  const resolvedDeps: LoadAnalyticsDeps = deps ?? {
    listOfferings: listOfferingsWithFirebase,
    readPlannerUsageRollup: readPlannerUsageRollupWithFirebase,
  };

  const [offeringRows, plannerUsage] = await Promise.all([
    resolvedDeps.listOfferings(OFFERINGS_QUERY_LIMIT),
    resolvedDeps.readPlannerUsageRollup(),
  ]);

  return {
    enrollment: computeEnrollmentSummary(offeringRows),
    plannerUsage,
  };
}
