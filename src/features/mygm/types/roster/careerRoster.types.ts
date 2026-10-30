export type CareerRosterGender = "male" | "female";

export type CareerRosterRole = "face" | "heel";

export type CareerRosterCategory = "active" | "legend" | "local";

export type CareerRosterSort =
  | "name_asc"
  | "name_desc"
  | "mic_skill_desc"
  | "in_ring_skill_desc";

export type CareerRosterAcquisition =
  | "draft"
  | "market"
  | "custom"
  | "transfer";

export interface CareerRosterMembership {
  id: string;
  joined_tick: number;
  contract_end_tick: number | null;
  acquisition_type: CareerRosterAcquisition;
}

export interface CareerRosterWrestler {
  id: string;
  name: string;
  gender: CareerRosterGender;
  primary_class: string | null;
  secondary_class: string | null;
  role: CareerRosterRole;
  mic_skill: number | null;
  in_ring_skill: number | null;
  image_url: string | null;
  mygm_category: CareerRosterCategory | null;
  membership: CareerRosterMembership;
}

export interface CareerRosterFilters {
  gender: CareerRosterGender | "all";
  primaryClass: string;
  role: CareerRosterRole | "all";
  category: CareerRosterCategory | "all";
  search: string;
  sort: CareerRosterSort;
}

export interface GetCareerRosterInput extends CareerRosterFilters {
  careerId: string;
  page: number;
  pageSize: number;
}

export interface CareerRosterPage {
  career_id: string;
  current_tick: number;
  roster_count: number;
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  available_classes: string[];
  items: CareerRosterWrestler[];
}
