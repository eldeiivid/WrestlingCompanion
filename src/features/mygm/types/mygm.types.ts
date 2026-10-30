export interface MyGmCareer {
  id: string;
  name: string;
  current_tick: number;
  created_at: string;
}

export interface MyGmCareerDetails extends MyGmCareer {
  brand_name: string;
  brand_logo_url: string | null;
  brand_background_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  brand_tertiary_color: string | null;
  manager_name: string;
  manager_image_url: string | null;
  finances_enabled: boolean;
  fans_enabled: boolean;
  budget_total: string;
  fans_total: string;
}

export interface MyGmOutletContext {
  career: MyGmCareerDetails;
  refreshCareer: () => void;
}
