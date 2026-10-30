import { supabase } from "../../../lib/supabase";
import type { CreateCareerInput } from "../types/createCareer.types";

export const createCareerService = {
  async create(input: CreateCareerInput): Promise<string> {
    const { data, error } = await supabase.rpc("wc_create_mygm_career", {
      p_game_id: input.requestId,
      p_configuration: input.configuration,
      p_wrestler_ids: input.wrestlerIds,
      p_championships: input.championships,
    });

    if (error) throw error;

    if (typeof data !== "string") {
      throw new Error("Invalid career creation response.");
    }

    return data;
  },
};
