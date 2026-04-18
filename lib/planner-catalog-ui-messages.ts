import type { PlannerCatalogSource } from "@/hooks/use-bgu-planner-catalog";

export type PlannerCatalogUiModel = {
  /** Firestore was configured but the last fetch failed; user can retry. */
  showRetry: boolean;
  headline: string;
  bodyLines: string[];
  /** Single line for compact strips (generated options, etc.). */
  compactNonEnrollmentNote: string;
};

const NON_ENROLLMENT =
  "This list is for planning only. It is not an official enrollment record—always confirm seats and sections with your department or registrar.";

/**
 * Builds catalog status copy for planner screens (NFR-I1, UX-DR16).
 * `activeTermSummary` examples: "Year 1 · Semester A".
 */
export function buildPlannerCatalogUiModel(input: {
  hasFirebaseDb: boolean;
  source: PlannerCatalogSource;
  loadError: string | null;
  loading: boolean;
  activeTermSummary: string;
}): PlannerCatalogUiModel {
  const { hasFirebaseDb, source, loadError, loading, activeTermSummary } =
    input;

  if (loading) {
    return {
      showRetry: false,
      headline: "Loading catalog…",
      bodyLines: [
        `Showing courses for your active term: ${activeTermSummary}.`,
      ],
      compactNonEnrollmentNote: NON_ENROLLMENT,
    };
  }

  if (!hasFirebaseDb) {
    return {
      showRetry: false,
      headline: "Demo / offline catalog",
      bodyLines: [
        "Firebase is not configured in this build, so the app uses the embedded sample catalog.",
        `Courses are filtered for: ${activeTermSummary}.`,
        NON_ENROLLMENT,
      ],
      compactNonEnrollmentNote: NON_ENROLLMENT,
    };
  }

  if (source === "firestore") {
    return {
      showRetry: false,
      headline: "Seeded catalog (Firestore)",
      bodyLines: [
        "Loaded from your project’s Firestore seed. Offerings may differ from the live registrar.",
        `Courses are filtered for: ${activeTermSummary}.`,
        NON_ENROLLMENT,
      ],
      compactNonEnrollmentNote: NON_ENROLLMENT,
    };
  }

  // Bundled path with Firebase configured: either fetch error or empty seed handled as error.
  return {
    showRetry: true,
    headline: "Could not load the course catalog from Firestore",
    bodyLines: [
      loadError
        ? `Details: ${loadError}`
        : "An unknown error occurred while loading.",
      "Showing the embedded sample catalog so you can keep planning.",
      `Courses are filtered for: ${activeTermSummary}.`,
      NON_ENROLLMENT,
    ],
    compactNonEnrollmentNote: NON_ENROLLMENT,
  };
}
