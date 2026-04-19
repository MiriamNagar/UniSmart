import { ROUTES } from "@/constants/routes";
import { plannerFlowPopOrReplace } from "@/lib/planner-flow-navigation";

export function goToCustomRulesFromGeneratedOptions(): void {
  plannerFlowPopOrReplace(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES);
}
