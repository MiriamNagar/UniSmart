import {
  evaluateRunOptimizerPress,
  getRunOptimizerCtaState,
} from "./planner-optimizer-cta";

describe("getRunOptimizerCtaState", () => {
  it("disables the CTA and shows busy label while optimizer is running", () => {
    const state = getRunOptimizerCtaState({
      hasAvailabilityError: false,
      isSubmitting: true,
      errorMessage: null,
    });

    expect(state.label).toBe("RUNNING OPTIMIZER...");
    expect(state.disabled).toBe(true);
    expect(state.busy).toBe(true);
    expect(state.showRetry).toBe(false);
  });

  it("disables the CTA when availability has validation errors", () => {
    const state = getRunOptimizerCtaState({
      hasAvailabilityError: true,
      isSubmitting: false,
      errorMessage: null,
    });

    expect(state.label).toBe("RUN OPTIMIZER");
    expect(state.disabled).toBe(true);
    expect(state.busy).toBe(false);
  });

  it("surfaces retry when a non-validation failure happened", () => {
    const state = getRunOptimizerCtaState({
      hasAvailabilityError: false,
      isSubmitting: false,
      errorMessage: "Failed to open generated options.",
    });

    expect(state.disabled).toBe(false);
    expect(state.showRetry).toBe(true);
    expect(state.errorMessage).toBe("Failed to open generated options.");
  });

  it("hides retry when availability is invalid even if an error exists", () => {
    const state = getRunOptimizerCtaState({
      hasAvailabilityError: true,
      isSubmitting: false,
      errorMessage: "Could not open generated options.",
    });

    expect(state.disabled).toBe(true);
    expect(state.showRetry).toBe(false);
  });
});

describe("evaluateRunOptimizerPress", () => {
  it("ignores press when lock is already held", () => {
    const decision = evaluateRunOptimizerPress({
      isPressLocked: true,
      ctaDisabled: false,
      availabilityCheckOk: true,
    });

    expect(decision).toBe("ignore");
  });

  it("ignores press when CTA is disabled", () => {
    const decision = evaluateRunOptimizerPress({
      isPressLocked: false,
      ctaDisabled: true,
      availabilityCheckOk: true,
    });

    expect(decision).toBe("ignore");
  });

  it("returns validation-error when availability check fails", () => {
    const decision = evaluateRunOptimizerPress({
      isPressLocked: false,
      ctaDisabled: false,
      availabilityCheckOk: false,
    });

    expect(decision).toBe("validation-error");
  });

  it("returns start when CTA is ready and availability is valid", () => {
    const decision = evaluateRunOptimizerPress({
      isPressLocked: false,
      ctaDisabled: false,
      availabilityCheckOk: true,
    });

    expect(decision).toBe("start");
  });
});
