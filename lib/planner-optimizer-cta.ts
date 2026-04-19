type RunOptimizerCtaInput = {
  hasAvailabilityError: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
};

export type RunOptimizerCtaState = {
  label: string;
  disabled: boolean;
  busy: boolean;
  showRetry: boolean;
  errorMessage: string | null;
};

type RunOptimizerPressInput = {
  isPressLocked: boolean;
  ctaDisabled: boolean;
  availabilityCheckOk: boolean;
};

export type RunOptimizerPressDecision = "ignore" | "validation-error" | "start";

export function getRunOptimizerCtaState(
  input: RunOptimizerCtaInput,
): RunOptimizerCtaState {
  const disabled = input.hasAvailabilityError || input.isSubmitting;

  return {
    label: input.isSubmitting ? "RUNNING OPTIMIZER..." : "RUN OPTIMIZER",
    disabled,
    busy: input.isSubmitting,
    showRetry:
      !input.hasAvailabilityError &&
      !input.isSubmitting &&
      Boolean(input.errorMessage),
    errorMessage: input.errorMessage,
  };
}

export function evaluateRunOptimizerPress(
  input: RunOptimizerPressInput,
): RunOptimizerPressDecision {
  if (input.isPressLocked || input.ctaDisabled) {
    return "ignore";
  }

  if (!input.availabilityCheckOk) {
    return "validation-error";
  }

  return "start";
}
