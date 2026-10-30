export interface SeasonDraftConfirmationResult {
  career_id: string;
  transition_id: string;
  status: "completed";
  season: number;
  current_tick: number;
  roster_count: number;
  retained_count: number;
  drafted_count: number;
  vacated_championship_count: number;
  ended_rivalry_count: number;
  starting_money: string | null;
  starting_fans: string | null;
}
