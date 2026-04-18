export const BUILD_GENERATION_TIMEOUT_MS = 3000;

export type PlannerGenerationPanelKind =
  | "catalog-failure"
  | "generation-timeout"
  | "generation-error"
  | "no-feasible-schedule";

export type PlannerGenerationFeedbackPanel = {
  kind: PlannerGenerationPanelKind;
  title: string;
  description: string;
  actions: string[];
};

export function classifyGenerationTimeout(elapsedMs: number): boolean {
  return elapsedMs >= BUILD_GENERATION_TIMEOUT_MS;
}

export function buildPlannerGenerationFeedback(input: {
  availabilityValid: boolean;
  catalogRetryAvailable: boolean;
  proposalCount: number;
  generationError: string | null;
  generationTimedOut: boolean;
}): PlannerGenerationFeedbackPanel | null {
  if (!input.availabilityValid) {
    return null;
  }

  const commonRecoveryActions = [
    "Retry generation.",
    "Adjust constraints.",
    "Widen time window in Availability.",
  ];

  if (input.catalogRetryAvailable && input.proposalCount === 0) {
    return {
      kind: "catalog-failure",
      title: "Catalog data could not be refreshed",
      description:
        "The app is using embedded sample data right now. Retry the catalog load, then regenerate options.",
      actions: ["Retry catalog load from Firestore.", ...commonRecoveryActions],
    };
  }

  if (input.generationTimedOut && input.proposalCount === 0) {
    return {
      kind: "generation-timeout",
      title: "Generation timed out",
      description:
        "Generating schedule options exceeded the expected runtime. Try again with fewer constraints.",
      actions: commonRecoveryActions,
    };
  }

  if (input.generationError) {
    return {
      kind: "generation-error",
      title: "Could not generate schedule options",
      description:
        "Generation failed due to an internal planner error. Please retry or adjust constraints.",
      actions: commonRecoveryActions,
    };
  }

  if (input.proposalCount === 0) {
    return {
      kind: "no-feasible-schedule",
      title: "No feasible schedules found",
      description:
        "No schedule satisfied all hard caps for your selected courses, constraints, and availability window.",
      actions: [
        "Reduce selected course load and try again.",
        ...commonRecoveryActions,
      ],
    };
  }

  return null;
}
