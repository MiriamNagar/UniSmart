import {
  buildRestartPlannerState,
  createInitialClapDetectionState,
  decideGeneratedBatchClearPolicy,
  evaluateClapSample,
  shouldProcessGeneratedBatchClear,
  shouldTriggerShakeGesture,
} from "./planner-generated-batch-clear";

describe("decideGeneratedBatchClearPolicy", () => {
  it("requires confirmation for button clear when policy is enabled", () => {
    const policy = decideGeneratedBatchClearPolicy({
      trigger: "button",
      requireConfirmation: true,
    });

    expect(policy).toEqual({
      requireConfirmation: true,
      triggerLabel: "clear button",
    });
  });

  it("requires confirmation for shake clear when policy is enabled", () => {
    const policy = decideGeneratedBatchClearPolicy({
      trigger: "shake",
      requireConfirmation: true,
    });

    expect(policy).toEqual({
      requireConfirmation: true,
      triggerLabel: "device shake",
    });
  });

  it("requires confirmation for clap clear when policy is enabled", () => {
    const policy = decideGeneratedBatchClearPolicy({
      trigger: "clap",
      requireConfirmation: true,
    });

    expect(policy).toEqual({
      requireConfirmation: true,
      triggerLabel: "clap sound",
    });
  });

  it("does not require confirmation when policy is disabled", () => {
    const policy = decideGeneratedBatchClearPolicy({
      trigger: "button",
      requireConfirmation: false,
    });

    expect(policy).toEqual({
      requireConfirmation: false,
      triggerLabel: "clear button",
    });
  });
});

describe("buildRestartPlannerState", () => {
  it("returns planner restart posture values", () => {
    const state = buildRestartPlannerState();

    expect(state.selectedCourses.size).toBe(0);
    expect(state.selectedDays.size).toBe(0);
    expect(state.startHour).toBe("Any");
    expect(state.endHour).toBe("Any");
    expect(state.professorPreferences.size).toBe(0);
    expect(state.lastPlannerFlowRoute).toBeNull();
  });
});

describe("shouldProcessGeneratedBatchClear", () => {
  it("allows button clear even when generated batch is not visible", () => {
    expect(
      shouldProcessGeneratedBatchClear({
        trigger: "button",
        hasGeneratedBatchVisible: false,
        isClearingBatch: false,
      }),
    ).toBe(true);
  });

  it("blocks motion triggers when no generated batch is visible", () => {
    expect(
      shouldProcessGeneratedBatchClear({
        trigger: "shake",
        hasGeneratedBatchVisible: false,
        isClearingBatch: false,
      }),
    ).toBe(false);
  });

  it("blocks all triggers during an active clear operation", () => {
    expect(
      shouldProcessGeneratedBatchClear({
        trigger: "button",
        hasGeneratedBatchVisible: true,
        isClearingBatch: true,
      }),
    ).toBe(false);
  });
});

describe("evaluateClapSample", () => {
  it("requires rising edges so sustained loud noise does not trigger", () => {
    let state = createInitialClapDetectionState();

    const first = evaluateClapSample({
      state,
      metering: -10,
      nowMs: 1000,
    });
    state = first.nextState;
    expect(first.shouldTrigger).toBe(false);

    const sustained = evaluateClapSample({
      state,
      metering: -9,
      nowMs: 1100,
    });
    expect(sustained.shouldTrigger).toBe(false);
  });

  it("triggers after two valid peaks inside the clap window", () => {
    let state = createInitialClapDetectionState();

    const firstPeak = evaluateClapSample({
      state,
      metering: -10,
      nowMs: 1000,
    });
    state = firstPeak.nextState;

    const coolDownToBaseline = evaluateClapSample({
      state,
      metering: -50,
      nowMs: 1150,
    });
    state = coolDownToBaseline.nextState;

    const secondPeak = evaluateClapSample({
      state,
      metering: -9,
      nowMs: 1400,
    });
    expect(secondPeak.shouldTrigger).toBe(true);
  });
});

describe("shouldTriggerShakeGesture", () => {
  it("triggers above g-force threshold and respects cooldown", () => {
    const triggered = shouldTriggerShakeGesture({
      x: 18,
      y: 18,
      z: 18,
      nowMs: 1000,
      lastTriggeredAtMs: 0,
    });
    expect(triggered.shouldTrigger).toBe(true);

    const suppressedByCooldown = shouldTriggerShakeGesture({
      x: 20,
      y: 20,
      z: 20,
      nowMs: 1800,
      lastTriggeredAtMs: triggered.lastTriggeredAtMs,
    });
    expect(suppressedByCooldown.shouldTrigger).toBe(false);
  });
});
