import type { CareerRosterAcquisition } from "./careerRoster.types";

export type ContractHistoryStatus =
  | "active"
  | "scheduled"
  | "terminated"
  | "expired"
  | "ended"
  | "season_ended";

export type ContractHistoryActionType =
  | "signed"
  | "extended"
  | "terminated"
  | "expired"
  | "season_ended"
  | "retained"
  | "drafted";

export interface ContractHistoryAction {
  id: string;
  tick: number;
  action: ContractHistoryActionType;
  added_weeks: number | null;
  previous_end_tick: number | null;
  new_end_tick: number | null;
  cost: string | null;
  created_at: string;
}

export interface WrestlerContractStage {
  membership_id: string;
  brand_id: string;
  brand_name: string;
  acquisition_type: CareerRosterAcquisition;
  joined_tick: number;
  left_tick: number | null;
  contract_end_tick: number | null;
  status: ContractHistoryStatus;
  remaining_weeks: number | null;
  actions: ContractHistoryAction[];
}

export interface GetWrestlerContractHistoryInput {
  careerId: string;
  wrestlerId: string;
  page: number;
  pageSize: number;
}

export interface WrestlerContractHistoryPage {
  career_id: string;
  wrestler_id: string;
  current_tick: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  items: WrestlerContractStage[];
}
