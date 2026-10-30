import { supabase } from "../../../lib/supabase";

import type { RosterFilters, RosterPage } from "../types/roster.types";

export const ROSTER_PAGE_SIZE = 12;

function escapeSearch(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export const rosterService = {
  async getPrimaryClasses(signal: AbortSignal): Promise<string[]> {
    const { data, error } = await supabase
      .from("wc_catalog_wrestler_classes")
      .select("primary_class")
      .order("primary_class", { ascending: true })
      .abortSignal(signal);

    if (error) throw error;

    return (data ?? []).map((row) => row.primary_class);
  },

  async getWrestlers(
    filters: RosterFilters,
    page: number,
    signal: AbortSignal,
  ): Promise<RosterPage> {
    const firstRow = (page - 1) * ROSTER_PAGE_SIZE;

    let query = supabase.from("wc_catalog_wrestlers").select(
      `
          id,
          name,
          gender,
          primary_class,
          secondary_class,
          default_role,
          mic_skill,
          in_ring_skill,
          image_url,
          mygm_category
        `,
      { count: "exact" },
    );

    const search = filters.search.trim();

    if (search) {
      query = query.ilike("name", `%${escapeSearch(search)}%`);
    }

    if (filters.gender) {
      query = query.eq("gender", filters.gender);
    }

    if (filters.primaryClass) {
      query = query.eq("primary_class", filters.primaryClass);
    }

    if (filters.role) {
      query = query.eq("default_role", filters.role);
    }

    if (filters.category) {
      query = query.eq("mygm_category", filters.category);
    }

    if (filters.sort === "name") {
      query = query.order("name", { ascending: true });
    } else {
      query = query
        .order(filters.sort, {
          ascending: false,
          nullsFirst: false,
        })
        .order("name", { ascending: true });
    }

    // Stable ordering prevents ties from moving between pages.
    query = query.order("id", { ascending: true });

    const { data, count, error } = await query
      .range(firstRow, firstRow + ROSTER_PAGE_SIZE - 1)
      .abortSignal(signal);

    if (error) throw error;

    return {
      wrestlers: data ?? [],
      total: count ?? 0,
    };
  },
};
