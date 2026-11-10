export interface BookingMatchRatingOption {
  stars: number;
  name: string;
}

export interface BookingMatchResultDraft {
  winningSide: number | null;
  ratingStars: number | null;
}

export type BookingMatchResultsDraft = Partial<
  Record<string, BookingMatchResultDraft>
>;

export interface BookingResultsDraft {
  eventId: string;
  matches: BookingMatchResultsDraft;
  promos: BookingPromoResultsDraft;
  show: BookingShowResultDraft;
  feuds: BookingFeudResultsDraft;
}

export interface BookingMatchResultInput {
  segmentId: string;
  winningSide: number;
  ratingStars: number;
}

export type BookingResultsStepId = "segments" | "show" | "review";

export interface BookingResultsStep {
  id: BookingResultsStepId;
  label: string;
  isComplete: boolean;
  isAvailable: boolean;
}

export type BookingPromoRatingId =
  | "excellent"
  | "good"
  | "okay"
  | "weak"
  | "embarrassing";

export interface BookingPromoRatingOption {
  id: BookingPromoRatingId;
  name: string;
}

export interface BookingPromoResultDraft {
  ratingId: BookingPromoRatingId | null;
  effects?: BookingPromoEffectsDraft;
}

export type BookingPromoResultsDraft = Partial<
  Record<string, BookingPromoResultDraft>
>;

export interface BookingShowResultDraft {
  moneyChange: string;
  fansChange: string;
}

export interface BookingPromoEffectsDraft {
  moneyChange: string;
  fansChange: string;
}

export type BookingFeudSide = 1 | 2;

export type BookingFeudKind = "singles" | "tag_team" | "stable";

export type BookingFeudLevel = 1 | 2 | 3 | 4;

export interface BookingFeudMember {
  wrestler_id: string;
  name: string;
  side: BookingFeudSide;
}

export interface BookingActiveFeud {
  id: string;
  name: string | null;
  kind: BookingFeudKind;
  level: BookingFeudLevel;
  started_tick: number;
  members: BookingFeudMember[];
}

export interface BookingNewFeudMember {
  wrestlerId: string;
  side: BookingFeudSide;
}

export type BookingFeudResultDraft =
  | {
      action: "none";
    }
  | {
      action: "create";
      kind: "singles" | "tag_team";
      members: BookingNewFeudMember[];
    }
  | {
      action: "increase";
      feudId: string;
    }
  | {
      action: "resolve";
      feudId: string;
      winningSide: BookingFeudSide | null;
    };

export type BookingFeudActionDraft = BookingFeudResultDraft & {
  id: string;
};

export type BookingFeudResultsDraft = Partial<
  Record<string, BookingFeudActionDraft[]>
>;

export interface BookingPromoWrestlerState {
  id: string;
  name: string;
  role: "face" | "heel";
  primary_class: string;
  secondary_class: string | null;
  in_ring_skill: number;
}

export interface CloseBookingShowInput {
  careerId: string;
  eventId: string;
  currentMoney: string;
  currentFans: string;
  draft: BookingResultsDraft;
}
