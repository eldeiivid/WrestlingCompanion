import type { ShowHistoryItem } from "./showHistory.types";

export type ShowDetailEvent = Omit<
  ShowHistoryItem,
  "match_count" | "promo_count"
>;

export interface ShowDetailSummary {
  match_count: number;
  promo_count: number;
  total_cost: string;
  finances_recorded: boolean;
  fans_recorded: boolean;
  money_change: string | null;
  fan_change: string | null;
  final_money: string | null;
  final_fans: string | null;
}

export type ShowDetailRivalryAction =
  | "none"
  | "create"
  | "increase"
  | "resolve";

export interface ShowDetailRivalryMember {
  wrestler_id: string;
  name: string;
  side: 1 | 2;
}

export interface ShowDetailRivalry {
  action: ShowDetailRivalryAction | null;
  id: string | null;
  name: string | null;
  kind: "singles" | "tag_team" | "stable" | null;
  level_after: 1 | 2 | 3 | 4 | null;
  winning_side: 1 | 2 | null;
  members: ShowDetailRivalryMember[];
}

export type ShowDetailMatchOutcome = "decisive" | "draw" | "no_contest";

export type ShowDetailParticipantResult =
  | "winner"
  | "loser"
  | "draw"
  | "no_contest";

export interface ShowDetailMatchParticipant {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  side: number;
  result: ShowDetailParticipantResult | null;
}

export type ShowDetailTitleResult =
  | "retained"
  | "changed"
  | "awarded"
  | "unrecorded";

export interface ShowDetailTitle {
  id: string;
  name: string;
  image_url: string | null;
  result: ShowDetailTitleResult;
}

export interface ShowDetailInterference {
  wrestler_id: string;
  wrestler_name: string;
  target_wrestler_id: string;
  target_wrestler_name: string;
}

export interface ShowDetailPromoParticipant {
  wrestler_id: string;
  name: string;
  image_url: string | null;
  role: "initiator" | "target" | "support";
}

export interface ShowDetailPromoRating {
  id: string;
  name: string;
}

interface ShowDetailSegmentBase {
  id: string;
  position: number;
  label: string;
  cost: string;
  rivalry: ShowDetailRivalry;
}

export interface ShowDetailMatch extends ShowDetailSegmentBase {
  kind: "match";
  format_id: string | null;
  stipulation_id: string | null;
  stipulation_name: string | null;
  rating: number | null;
  outcome: ShowDetailMatchOutcome | null;
  participants: ShowDetailMatchParticipant[];
  titles: ShowDetailTitle[];
  interference: ShowDetailInterference | null;
}

export interface ShowDetailPromo extends ShowDetailSegmentBase {
  kind: "promo";
  promo_type_id: string | null;
  promo_rating: ShowDetailPromoRating | null;
  reported_money_change: string | null;
  reported_fan_change: string | null;
  participants: ShowDetailPromoParticipant[];
}

export type ShowDetailSegment = ShowDetailMatch | ShowDetailPromo;

export interface ShowDetailData {
  career_id: string;
  event: ShowDetailEvent;
  summary: ShowDetailSummary;
  segments: ShowDetailSegment[];
}
