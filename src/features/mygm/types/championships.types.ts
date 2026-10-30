export interface CatalogChampionship {
  id: string;
  name: string;
  image_url: string | null;
  gender: "male" | "female" | "mixed" | "open";
  division: "singles" | "tag_team";
  category: "world" | "midcard" | "tag_team" | "mitb" | "other";
}

export type ChampionshipSlot =
  | "worldMale"
  | "worldFemale"
  | "midcardMale"
  | "midcardFemale"
  | "tagMale"
  | "tagFemale";

export interface ChampionshipSelection {
  titleId: string;
  championIds: string[];
}

export interface ChampionshipsDraft {
  selections: Record<ChampionshipSlot, ChampionshipSelection>;
  mitbEnabled: boolean;
}
