import { supabase } from "../../../lib/supabase";
import type { MyGmDashboardData } from "../types/dashboard.types";

export const dashboardService = {
  async getDashboard(
    careerId: string,
    signal: AbortSignal,
  ): Promise<MyGmDashboardData> {
    const { data, error } = await supabase
      .rpc("wc_get_mygm_dashboard", {
        p_game_id: careerId,
      })
      .abortSignal(signal);

    if (error) throw error;

    if (!data) {
      throw new Error("Career unavailable.");
    }

    return data as MyGmDashboardData;
  },
};
