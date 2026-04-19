import {
  BUILD_GENERATION_TIMEOUT_MS,
  buildPlannerGenerationFeedback,
  classifyGenerationTimeout,
} from "./planner-generation-feedback";

describe("classifyGenerationTimeout", () => {
  it("flags generation runs that exceed the hard timeout", () => {
    expect(
      classifyGenerationTimeout(BUILD_GENERATION_TIMEOUT_MS + 1),
    ).toBe(true);
  });

  it("does not flag runs within the timeout budget", () => {
    expect(classifyGenerationTimeout(BUILD_GENERATION_TIMEOUT_MS - 1)).toBe(false);
  });

  it("flags generation runs exactly at the hard timeout boundary", () => {
    expect(classifyGenerationTimeout(BUILD_GENERATION_TIMEOUT_MS)).toBe(true);
  });
});

describe("buildPlannerGenerationFeedback", () => {
  it("returns catalog failure panel with retry and recovery steps when no proposals exist", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: true,
      proposalCount: 0,
      generationError: null,
      generationTimedOut: false,
    });

    expect(panel?.kind).toBe("catalog-failure");
    expect(panel?.title).toMatch(/catalog/i);
    expect(panel?.actions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/retry/i),
        expect.stringMatching(/adjust constraints/i),
        expect.stringMatching(/widen time window/i),
      ]),
    );
  });

  it("does not show catalog failure panel when proposals are available", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: true,
      proposalCount: 2,
      generationError: null,
      generationTimedOut: false,
    });

    expect(panel).toBeNull();
  });

  it("returns timeout panel when generation exceeded timeout", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: false,
      proposalCount: 0,
      generationError: null,
      generationTimedOut: true,
    });

    expect(panel?.kind).toBe("generation-timeout");
    expect(panel?.title).toMatch(/timed out/i);
  });

  it("returns generation error panel when solver throws", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: false,
      proposalCount: 0,
      generationError: "solver failed",
      generationTimedOut: false,
    });

    expect(panel?.kind).toBe("generation-error");
    expect(panel?.description).not.toMatch(/solver failed/i);
    expect(panel?.description).toMatch(/internal planner error/i);
  });

  it("does not block available proposals just because generation was slow", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: false,
      proposalCount: 2,
      generationError: null,
      generationTimedOut: true,
    });

    expect(panel).toBeNull();
  });

  it("returns no-feasible panel when generation succeeds with zero proposals", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: false,
      proposalCount: 0,
      generationError: null,
      generationTimedOut: false,
    });

    expect(panel?.kind).toBe("no-feasible-schedule");
    expect(panel?.title).toMatch(/No feasible schedules found/i);
    expect(panel?.description).toMatch(/selected courses/i);
    expect(panel?.actions).toEqual(
      expect.arrayContaining([expect.stringMatching(/Reduce selected course load/i)]),
    );
  });

  it("returns null when proposals are available and no failures exist", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: true,
      catalogRetryAvailable: false,
      proposalCount: 3,
      generationError: null,
      generationTimedOut: false,
    });

    expect(panel).toBeNull();
  });

  it("returns null when availability is invalid (handled by availability panel)", () => {
    const panel = buildPlannerGenerationFeedback({
      availabilityValid: false,
      catalogRetryAvailable: true,
      proposalCount: 0,
      generationError: "unused",
      generationTimedOut: true,
    });

    expect(panel).toBeNull();
  });
});
