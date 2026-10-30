export interface CareerSettingsCareer {
  id: string;
  name: string;
  game_version: string;
  current_tick: number;
  season: number;
  week: number;
  created_at: string;
}

export interface CareerSettingsRules {
  difficulty: string;
  finances_enabled: boolean;
  fans_enabled: boolean;
  mitb_enabled: boolean;
  weeks_per_season: number;
}

export interface CareerSettingsData {
  career: CareerSettingsCareer;
  rules: CareerSettingsRules;
}

export interface RenameCareerInput {
  careerId: string;
  name: string;
}

export interface RenameCareerResult {
  career_id: string;
  name: string;
}

export interface DeleteCareerInput {
  careerId: string;
  confirmationName: string;
}

export interface DeleteCareerResult {
  career_id: string;
}
