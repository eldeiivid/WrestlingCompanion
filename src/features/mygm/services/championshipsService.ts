import { supabase } from "../../../lib/supabase";
import type { CatalogChampionship } from "../types/championships.types";

export const championshipsService = {
  async getCatalog(signal: AbortSignal): Promise<CatalogChampionship[]> {
    const { data, error } = await supabase
      .from("wc_catalog_titles")
      .select("id, name, image_url, gender, division, category")
      .in("gender", ["male", "female"])
      .in("category", ["world", "midcard", "tag_team", "mitb"])
      .order("name", { ascending: true })
      .abortSignal(signal);

    if (error) throw error;

    return data ?? [];
  },
};
