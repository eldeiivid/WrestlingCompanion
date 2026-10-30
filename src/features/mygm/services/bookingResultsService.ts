import { supabase } from "../../../lib/supabase";
import type {
  BookingActiveFeud,
  BookingMatchRatingOption,
  BookingPromoRatingId,
  BookingPromoRatingOption,
  BookingPromoWrestlerState,
  CloseBookingShowInput,
} from "../types/bookingResults.types";
import { getShowFinalBalance } from "../rules/showResultsRules";

function isPromoRatingId(value: unknown): value is BookingPromoRatingId {
  return (
    value === "excellent" ||
    value === "good" ||
    value === "okay" ||
    value === "weak" ||
    value === "embarrassing"
  );
}

export async function getMatchRatings(
  signal: AbortSignal,
): Promise<BookingMatchRatingOption[]> {
  const { data, error } = await supabase
    .from("wc_match_ratings")
    .select("stars, name")
    .order("stars", { ascending: true })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    throw new Error("No match ratings are available.");
  }

  return data.map((rating) => ({
    stars: Number(rating.stars),
    name: rating.name,
  }));
}

export async function getPromoRatings(
  signal: AbortSignal,
): Promise<BookingPromoRatingOption[]> {
  const { data, error } = await supabase
    .from("wc_promo_ratings")
    .select("id, name")
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    throw new Error("No promo ratings are available.");
  }

  const ratings = new Map<BookingPromoRatingId, BookingPromoRatingOption>();

  for (const rating of data) {
    if (!isPromoRatingId(rating.id)) {
      throw new Error("An unsupported promo rating was returned.");
    }

    ratings.set(rating.id, {
      id: rating.id,
      name: rating.name,
    });
  }

  const ratingOrder: BookingPromoRatingId[] = [
    "excellent",
    "good",
    "okay",
    "weak",
    "embarrassing",
  ];

  return ratingOrder.flatMap((id) => {
    const rating = ratings.get(id);

    return rating ? [rating] : [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBookingFeudMember(
  value: unknown,
): value is BookingActiveFeud["members"][number] {
  return (
    isRecord(value) &&
    typeof value.wrestler_id === "string" &&
    typeof value.name === "string" &&
    (value.side === 1 || value.side === 2)
  );
}

function isBookingActiveFeud(value: unknown): value is BookingActiveFeud {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (value.name === null || typeof value.name === "string") &&
    (value.kind === "singles" ||
      value.kind === "tag_team" ||
      value.kind === "stable") &&
    (value.level === 1 ||
      value.level === 2 ||
      value.level === 3 ||
      value.level === 4) &&
    typeof value.started_tick === "number" &&
    Number.isInteger(value.started_tick) &&
    Array.isArray(value.members) &&
    value.members.every(isBookingFeudMember)
  );
}

export async function getBookingActiveFeuds(
  careerId: string,
  eventId: string,
  signal: AbortSignal,
): Promise<BookingActiveFeud[]> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_booking_feuds", {
      p_game_id: careerId,
      p_event_id: eventId,
    })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  const payload: unknown = data;

  if (!Array.isArray(payload) || !payload.every(isBookingActiveFeud)) {
    throw new Error("The rivalry data could not be loaded.");
  }

  return payload;
}

export async function getBookingPromoWrestlerStates(
  careerId: string,
  wrestlerIds: string[],
  signal: AbortSignal,
): Promise<BookingPromoWrestlerState[]> {
  const uniqueIds = [...new Set(wrestlerIds)];

  if (uniqueIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("wc_game_wrestlers")
    .select("id, name, role, primary_class, secondary_class, in_ring_skill")
    .eq("game_id", careerId)
    .in("id", uniqueIds)
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data || data.length !== uniqueIds.length) {
    throw new Error("Some promo participants could not be found.");
  }

  return data.map((row: unknown): BookingPromoWrestlerState => {
    if (
      !isRecord(row) ||
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.role !== "string" ||
      typeof row.primary_class !== "string" ||
      !(
        row.secondary_class === null || typeof row.secondary_class === "string"
      ) ||
      typeof row.in_ring_skill !== "number" ||
      !Number.isInteger(row.in_ring_skill)
    ) {
      throw new Error("The promo participant data is invalid.");
    }

    const role = row.role.trim().toLowerCase();

    if (role !== "face" && role !== "heel") {
      throw new Error("The wrestler role is invalid.");
    }

    return {
      id: row.id,
      name: row.name,
      role,
      primary_class: row.primary_class,
      secondary_class: row.secondary_class,
      in_ring_skill: row.in_ring_skill,
    };
  });
}

export async function closeShow(input: CloseBookingShowInput): Promise<string> {
  if (input.draft.eventId !== input.eventId) {
    throw new Error("The results belong to a different show.");
  }

  const finalMoney = getShowFinalBalance(
    input.currentMoney,
    input.draft.show.moneyChange,
  );

  const finalFans = getShowFinalBalance(
    input.currentFans,
    input.draft.show.fansChange,
  );

  const payload = {
    version: 1,
    eventId: input.eventId,
    matches: input.draft.matches,
    promos: input.draft.promos,
    feuds: input.draft.feuds,
    show: {
      moneyChange: input.draft.show.moneyChange,
      fansChange: input.draft.show.fansChange,
      finalMoney: finalMoney ?? "",
      finalFans: finalFans ?? "",
    },
  };

  const { data, error } = await supabase.rpc("wc_close_mygm_show", {
    p_game_id: input.careerId,
    p_event_id: input.eventId,
    p_results: payload,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string" || data !== input.eventId) {
    throw new Error("The show closure could not be confirmed.");
  }

  return data;
}
