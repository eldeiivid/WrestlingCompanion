import { supabase } from "../../../lib/supabase";

import type { MyGmCareerDetails, MyGmCareerSummary } from "../types/mygm.types";

export const mygmService = {
  async getCareers(
    ownerId: string,
    signal: AbortSignal,
  ): Promise<MyGmCareerSummary[]> {
    const { data, error } = await supabase
      .from("wc_games")
      .select(
        `
      id,
      name,
      current_tick,
      created_at,
      brands:wc_game_brands!wc_game_brands_game_id_fkey (
        id,
        name,
        logo_url,
        background_url,
        primary_color
      ),
      managers:wc_game_managers!wc_game_managers_game_id_fkey (
        id,
        brand_id,
        name,
        image_url
      )
    `,
      )
      .eq("owner_id", ownerId)
      .eq("mode", "mygm")
      .order("created_at", { ascending: false })
      .abortSignal(signal);

    if (error) throw error;

    return (data ?? []).map(({ brands, managers, ...career }) => {
      const brand = brands[0];

      const manager = brand
        ? managers.find((item) => item.brand_id === brand.id)
        : undefined;

      return {
        ...career,
        brand_name: brand?.name ?? null,
        brand_logo_url: brand?.logo_url ?? null,
        brand_background_url: brand?.background_url ?? null,
        brand_primary_color: brand?.primary_color ?? null,
        manager_name: manager?.name ?? null,
        manager_image_url: manager?.image_url ?? null,
      };
    });
  },

  async getCareer(
    careerId: string,
    signal: AbortSignal,
  ): Promise<MyGmCareerDetails | null> {
    const { data, error } = await supabase
      .rpc("wc_get_mygm_career_header", {
        p_game_id: careerId,
      })
      .abortSignal(signal)
      .maybeSingle();

    if (error) throw error;

    return data as MyGmCareerDetails | null;
  },
};
