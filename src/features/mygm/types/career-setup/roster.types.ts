export interface RosterWrestler {
  id: string;
  name: string;
  gender: "male" | "female";
  primary_class: string | null;
  secondary_class: string | null;
  default_role: "face" | "heel";
  mic_skill: number | null;
  in_ring_skill: number | null;
  image_url: string | null;
  mygm_category: "active" | "legend" | "local" | null;
}

export type RosterSort = "name" | "mic_skill" | "in_ring_skill";

export interface RosterFilters {
  search: string;
  gender: "" | "male" | "female";
  primaryClass: string;
  role: "" | "face" | "heel";
  category: "" | "active" | "legend" | "local";
  sort: RosterSort;
}

export interface RosterPage {
  wrestlers: RosterWrestler[];
  total: number;
}
