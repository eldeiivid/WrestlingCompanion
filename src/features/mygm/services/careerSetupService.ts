import { supabase } from "../../../lib/supabase";
import type { CareerSetupCatalogs } from "../types/careerSetup.types";

export const careerSetupService = {
  async getCatalogs(signal: AbortSignal): Promise<CareerSetupCatalogs> {
    const [brandsResult, managersResult, difficultiesResult] =
      await Promise.all([
        supabase
          .from("wc_catalog_brands")
          .select("id, name, logo_url, primary_color")
          .order("name", { ascending: true })
          .abortSignal(signal),

        supabase
          .from("wc_catalog_managers")
          .select("id, name, image_url")
          .order("name", { ascending: true })
          .abortSignal(signal),

        supabase
          .from("wc_mygm_difficulties")
          .select("id, name")
          .order("name", { ascending: true })
          .abortSignal(signal),
      ]);

    if (brandsResult.error) throw brandsResult.error;
    if (managersResult.error) throw managersResult.error;
    if (difficultiesResult.error) throw difficultiesResult.error;

    return {
      brands: brandsResult.data ?? [],
      managers: managersResult.data ?? [],
      difficulties: difficultiesResult.data ?? [],
    };
  },
};
