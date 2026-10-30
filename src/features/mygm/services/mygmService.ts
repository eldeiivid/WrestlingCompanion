import { supabase } from "../../../lib/supabase";

import type { MyGmCareer, MyGmCareerDetails } from "../types/mygm.types";

export const mygmService = {
  async getCareers(
    ownerId: string,
    signal: AbortSignal,
  ): Promise<MyGmCareer[]> {
    const { data, error } = await supabase
      .from("wc_games")
      .select("id, name, current_tick, created_at")
      .eq("owner_id", ownerId)
      .eq("mode", "mygm")
      .order("created_at", { ascending: false })
      .abortSignal(signal);

    if (error) throw error;

    return data ?? [];
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
