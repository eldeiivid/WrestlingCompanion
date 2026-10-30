export interface RecordBookEntity {
  id: string;
  name: string;
  image_url: string | null;
}

export interface RecordBookReign {
  rank: number;
  reign_id: string;
  title: RecordBookEntity;
  holders: RecordBookEntity[];
  won_tick: number;
  lost_tick: number | null;
  duration_weeks: number;
  defenses: number;
  is_active: boolean;
}

export interface RecordBookHighRatedWrestler {
  rank: number;
  wrestler: RecordBookEntity;
  match_count: number;
}

export interface RecordBookMainEventer {
  rank: number;
  wrestler: RecordBookEntity;
  appearance_count: number;
}

export interface RecordBookSummaryData {
  career_id: string;
  current_tick: number;
  longest_reigns: RecordBookReign[];
  most_defenses: RecordBookReign[];
  high_rated_wrestlers: RecordBookHighRatedWrestler[];
  wrestlemania_main_eventers: RecordBookMainEventer[];
}
