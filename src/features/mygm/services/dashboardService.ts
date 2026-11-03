import { supabase } from "../../../lib/supabase";
import type { DashboardCurrentShow, MyGmDashboardData } from "../types/dashboard.types";

export const dashboardService = {
  async getCurrentShow(careerId: string, tick: number, signal: AbortSignal): Promise<DashboardCurrentShow | null> {
    const { data, error } = await supabase
      .from("wc_events")
      .select("id, name, status")
      .eq("game_id", careerId)
      .eq("tick", tick)
      .in("status", ["draft", "confirmed"])
      .abortSignal(signal)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    if (typeof data.id !== "string" || typeof data.name !== "string" || (data.status !== "draft" && data.status !== "confirmed")) {
      throw new Error("The current show response is invalid.");
    }
    return { id: data.id, name: data.name, status: data.status };
  },

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
