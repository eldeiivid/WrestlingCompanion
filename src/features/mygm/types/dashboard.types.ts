export interface DashboardHolder {
  id: string;
  name: string;
  image_url: string | null;
}

export interface DashboardChampionship {
  id: string;
  name: string;
  image_url: string | null;
  category: "world" | "midcard" | "tag_team" | "mitb" | "other";
  reign_id: string | null;
  won_tick: number | null;
  defenses: number;
  holders: DashboardHolder[];
}

export interface MyGmDashboardData {
  has_completed_shows: boolean;
  championships: DashboardChampionship[];
}
