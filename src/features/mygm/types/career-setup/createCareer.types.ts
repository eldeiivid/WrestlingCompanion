import type { CareerConfigurationDraft } from "./careerDraft.types";
import type { ChampionshipsDraft } from "./championships.types";

export interface CreateCareerInput {
  requestId: string;
  configuration: CareerConfigurationDraft;
  wrestlerIds: string[];
  championships: ChampionshipsDraft;
}
