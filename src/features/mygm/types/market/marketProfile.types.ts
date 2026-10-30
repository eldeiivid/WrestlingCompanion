import type { WrestlerProfileData } from "../roster/wrestlerProfile.types";

export interface MarketProfileData {
  source: "catalog" | "career";
  catalog_wrestler_id: string;
  profile: WrestlerProfileData;
}
