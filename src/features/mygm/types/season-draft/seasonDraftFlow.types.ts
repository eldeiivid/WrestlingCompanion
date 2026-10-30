export type SeasonDraftStepId = "retention" | "draft" | "balances" | "review";

export interface SeasonDraftFlowStep {
  id: SeasonDraftStepId;
  label: string;
  isComplete: boolean;
}
