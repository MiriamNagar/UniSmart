import { useCallback, useEffect, useState } from "react";

import {
    DEFAULT_BGU_PROGRAM_KEY,
    fetchBguCatalogJsonFromFirestore,
} from "@/lib/bgu-catalog-firestore";
import { bguCatalogToCourses } from "@/lib/bgu-catalog-to-courses";
import { db } from "@/lib/firebase";
import { bguPlannerCourses as fallbackCourses } from "@/mockData/bgu-planner-courses";
import type { Course } from "@/types/courses";

export type PlannerCatalogSource = "firestore" | "mock";

export interface UseBguPlannerCatalogResult {
  /** Full catalog for prerequisites and lookups; same seed as legacy mock when from Firestore. */
  allCourses: Course[];
  loading: boolean;
  source: PlannerCatalogSource;
  loadError: string | null;
  /** True when Firebase app is configured with Firestore (fetch attempted or possible). */
  hasFirebaseDb: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads the BGU CS catalog from Firestore (`bgu_cs_*` collections) when `db` is configured.
 * Falls back to bundled `mockData/bgu-planner-courses` if Firestore is unavailable, empty, or errors.
 */
export function useBguPlannerCatalog(): UseBguPlannerCatalogResult {
  const [allCourses, setAllCourses] = useState<Course[]>(fallbackCourses);
  const [loading, setLoading] = useState(Boolean(db));
  const [source, setSource] = useState<PlannerCatalogSource>("mock");
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!db) {
      setAllCourses(fallbackCourses);
      setSource("mock");
      setLoadError(null);
      setLoading(false);
      if (__DEV__) {
        console.log(
          "[UniSmart] Planner catalog: bundled (Firebase db not initialized — check EXPO_PUBLIC_* in .env)",
        );
      }
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const json = await fetchBguCatalogJsonFromFirestore(db, {
        programKey: DEFAULT_BGU_PROGRAM_KEY,
      });
      const n = Object.keys(json.courses ?? {}).length;
      if (n === 0) {
        throw new Error(
          "Firestore catalog is empty. Seed with: node scripts/seed-firestore-3nf.mjs (see script header).",
        );
      }
      const list = bguCatalogToCourses(json, { seed: 42 });
      setAllCourses(list);
      setSource("firestore");
      if (__DEV__) {
        console.log(
          `[UniSmart] Planner catalog: Firestore (${n} courses in JSON, ${list.length} solver courses)`,
        );
      }
    } catch (e) {
      setAllCourses(fallbackCourses);
      setSource("mock");
      setLoadError(e instanceof Error ? e.message : String(e));
      if (__DEV__) {
        console.warn(
          "[UniSmart] Planner catalog: using embedded sample courses (Firestore unavailable or error):",
          e,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    allCourses,
    loading,
    source,
    loadError,
    hasFirebaseDb: Boolean(db),
    refresh,
  };
}
