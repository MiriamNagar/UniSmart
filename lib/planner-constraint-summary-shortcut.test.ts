import { ROUTES } from "@/constants/routes";
import { plannerFlowPopOrReplace } from "@/lib/planner-flow-navigation";
import { goToCustomRulesFromGeneratedOptions } from "@/lib/planner-constraint-summary-shortcut";

jest.mock("@/lib/planner-flow-navigation", () => ({
  plannerFlowPopOrReplace: jest.fn(),
}));

describe("goToCustomRulesFromGeneratedOptions", () => {
  it("navigates back to custom rules via planner-flow replace", () => {
    goToCustomRulesFromGeneratedOptions();

    expect(plannerFlowPopOrReplace).toHaveBeenCalledWith(
      ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES,
    );
  });
});
