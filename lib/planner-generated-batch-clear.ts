export type GeneratedBatchClearTrigger = "button" | "shake" | "clap";

type DecideGeneratedBatchClearPolicyInput = {
  trigger: GeneratedBatchClearTrigger;
  requireConfirmation: boolean;
};

type GeneratedBatchClearPolicyDecision = {
  requireConfirmation: boolean;
  triggerLabel: string;
};

export type RestartPlannerState = {
  selectedCourses: Set<string>;
  selectedDays: Set<string>;
  startHour: string;
  endHour: string;
  professorPreferences: Map<string, string>;
  lastPlannerFlowRoute: string | null;
};

type ShouldProcessGeneratedBatchClearInput = {
  trigger: GeneratedBatchClearTrigger;
  hasGeneratedBatchVisible: boolean;
  isClearingBatch: boolean;
};

export type ClapDetectionState = {
  hitTimestampsMs: number[];
  lastHandledAtMs: number;
  lastPeakAtMs: number;
  wasAboveThreshold: boolean;
};

type EvaluateClapSampleInput = {
  state: ClapDetectionState;
  metering: number;
  nowMs: number;
  thresholdDb?: number;
  windowMs?: number;
  hitsRequired?: number;
  cooldownMs?: number;
  minPeakGapMs?: number;
};

type EvaluateClapSampleResult = {
  nextState: ClapDetectionState;
  shouldTrigger: boolean;
};

type ShouldTriggerShakeGestureInput = {
  x: number;
  y: number;
  z: number;
  nowMs: number;
  lastTriggeredAtMs: number;
  cooldownMs?: number;
  triggerGForce?: number;
};

type ShouldTriggerShakeGestureResult = {
  shouldTrigger: boolean;
  lastTriggeredAtMs: number;
};

export function decideGeneratedBatchClearPolicy({
  trigger,
  requireConfirmation,
}: DecideGeneratedBatchClearPolicyInput): GeneratedBatchClearPolicyDecision {
  const triggerLabelMap: Record<GeneratedBatchClearTrigger, string> = {
    button: "clear button",
    shake: "device shake",
    clap: "clap sound",
  };

  return {
    requireConfirmation,
    triggerLabel: triggerLabelMap[trigger],
  };
}

export function shouldProcessGeneratedBatchClear({
  trigger,
  hasGeneratedBatchVisible,
  isClearingBatch,
}: ShouldProcessGeneratedBatchClearInput): boolean {
  if (isClearingBatch) return false;
  if (trigger === "button") return true;
  return hasGeneratedBatchVisible;
}

export function buildRestartPlannerState(): RestartPlannerState {
  return {
    selectedCourses: new Set<string>(),
    selectedDays: new Set<string>(),
    startHour: "Any",
    endHour: "Any",
    professorPreferences: new Map<string, string>(),
    lastPlannerFlowRoute: null,
  };
}

export function createInitialClapDetectionState(): ClapDetectionState {
  return {
    hitTimestampsMs: [],
    lastHandledAtMs: 0,
    lastPeakAtMs: 0,
    wasAboveThreshold: false,
  };
}

export function evaluateClapSample({
  state,
  metering,
  nowMs,
  thresholdDb = -14,
  windowMs = 900,
  hitsRequired = 2,
  cooldownMs = 1800,
  minPeakGapMs = 120,
}: EvaluateClapSampleInput): EvaluateClapSampleResult {
  const aboveThreshold = metering >= thresholdDb;
  const withinCooldown =
    state.lastHandledAtMs > 0 && nowMs - state.lastHandledAtMs < cooldownMs;

  const nextStateBase: ClapDetectionState = {
    ...state,
    hitTimestampsMs: state.hitTimestampsMs.filter(
      (timestampMs) => nowMs - timestampMs < windowMs,
    ),
    wasAboveThreshold: aboveThreshold,
  };

  if (withinCooldown) {
    return { nextState: nextStateBase, shouldTrigger: false };
  }

  const isRisingEdge = aboveThreshold && !state.wasAboveThreshold;
  if (!isRisingEdge || nowMs - state.lastPeakAtMs < minPeakGapMs) {
    return { nextState: nextStateBase, shouldTrigger: false };
  }

  const hits = [...nextStateBase.hitTimestampsMs, nowMs];
  if (hits.length >= hitsRequired) {
    return {
      shouldTrigger: true,
      nextState: {
        hitTimestampsMs: [],
        lastHandledAtMs: nowMs,
        lastPeakAtMs: nowMs,
        wasAboveThreshold: aboveThreshold,
      },
    };
  }

  return {
    shouldTrigger: false,
    nextState: {
      ...nextStateBase,
      hitTimestampsMs: hits,
      lastPeakAtMs: nowMs,
    },
  };
}

export function shouldTriggerShakeGesture({
  x,
  y,
  z,
  nowMs,
  lastTriggeredAtMs,
  cooldownMs = 1500,
  triggerGForce = 2.2,
}: ShouldTriggerShakeGestureInput): ShouldTriggerShakeGestureResult {
  const gForce = Math.sqrt(x * x + y * y + z * z) / 9.81;
  if (gForce < triggerGForce) {
    return { shouldTrigger: false, lastTriggeredAtMs };
  }
  if (lastTriggeredAtMs > 0 && nowMs - lastTriggeredAtMs < cooldownMs) {
    return { shouldTrigger: false, lastTriggeredAtMs };
  }
  return { shouldTrigger: true, lastTriggeredAtMs: nowMs };
}
