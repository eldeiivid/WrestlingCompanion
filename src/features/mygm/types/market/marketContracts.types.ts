export type SigningWrestlerReference =
  | {
      source: "catalog";
      catalogWrestlerId: string;
    }
  | {
      source: "career";
      wrestlerId: string;
    };

export interface SignWrestlerInput {
  careerId: string;
  requestId: string;
  wrestler: SigningWrestlerReference;
  contractWeeks: number;
  cost: string | null;
}

export interface SignWrestlerResult {
  career_id: string;
  wrestler_id: string;
  membership_id: string;
  joined_tick: number;
  contract_end_tick: number;
}

export interface TerminateContractInput {
  careerId: string;
  membershipId: string;
  requestId: string;
}

export interface TerminateContractResult {
  career_id: string;
  wrestler_id: string;
  membership_id: string;
  left_tick: number;
}

export interface ExtendContractInput {
  careerId: string;
  membershipId: string;
  requestId: string;
  addedWeeks: number;
  cost: string | null;
}

export interface ExtendContractResult {
  career_id: string;
  wrestler_id: string;
  membership_id: string;
  previous_end_tick: number;
  contract_end_tick: number;
  added_weeks: number;
}
