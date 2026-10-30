import { supabase } from "../../../lib/supabase";
import type { MyGmBookingData } from "../types/booking.types";
import type {
  AddBookingMatchInput,
  BookingMatchOptions,
} from "../types/booking.types";

import type {
  AddBookingPromoInput,
  BookingPromoOptions,
} from "../types/booking.types";

import type {
  BookingMatchEditorData,
  BookingPromoEditorData,
} from "../types/booking.types";

export const bookingService = {
  async openCurrentShow(
    careerId: string,
    signal: AbortSignal,
  ): Promise<MyGmBookingData> {
    const { data, error } = await supabase
      .rpc("wc_open_mygm_booking", {
        p_game_id: careerId,
      })
      .abortSignal(signal);

    if (error) throw error;

    if (!data) {
      throw new Error("Booking is unavailable.");
    }

    return data as MyGmBookingData;
  },
};

export async function getMatchOptions(
  careerId: string,
  eventId: string,
  signal: AbortSignal,
): Promise<BookingMatchOptions> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_match_options", {
      p_game_id: careerId,
      p_event_id: eventId,
    })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Match options are unavailable.");
  }

  return data as BookingMatchOptions;
}

async function saveMatch(
  input: AddBookingMatchInput,
  operation: "create" | "update",
): Promise<string> {
  const { data, error } = await supabase.rpc("wc_save_mygm_match", {
    p_game_id: input.careerId,
    p_event_id: input.eventId,
    p_segment_id: input.segmentId,
    p_format_id: input.formatId,
    p_stipulation_id: input.stipulationId,
    p_participants: input.participants,
    p_operation: operation,
    p_title_id: input.titleId ?? null,
    p_interference: input.interference ?? null,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("The match could not be saved.");
  }

  return data;
}

export async function addMatch(input: AddBookingMatchInput): Promise<string> {
  return saveMatch(input, "create");
}

export async function getPromoOptions(
  careerId: string,
  eventId: string,
  signal: AbortSignal,
): Promise<BookingPromoOptions> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_promo_options", {
      p_game_id: careerId,
      p_event_id: eventId,
    })
    .abortSignal(signal);

  if (error) throw error;

  if (!data) {
    throw new Error("Promo options are unavailable.");
  }

  return data as BookingPromoOptions;
}

export async function addPromo(input: AddBookingPromoInput): Promise<string> {
  const { data, error } = await supabase.rpc("wc_add_mygm_promo", {
    p_game_id: input.careerId,
    p_event_id: input.eventId,
    p_segment_id: input.segmentId,
    p_promo_type_id: input.promoTypeId,
    p_participants: input.participants,
  });

  if (error) throw error;

  if (typeof data !== "string") {
    throw new Error("The promo could not be saved.");
  }

  return data;
}

export async function getMatchForEditing(
  careerId: string,
  eventId: string,
  segmentId: string,
  signal: AbortSignal,
): Promise<BookingMatchEditorData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_match_for_editing", {
      p_game_id: careerId,
      p_event_id: eventId,
      p_segment_id: segmentId,
    })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("The match could not be loaded.");
  }

  return data as BookingMatchEditorData;
}

export async function getPromoForEditing(
  careerId: string,
  eventId: string,
  segmentId: string,
  signal: AbortSignal,
): Promise<BookingPromoEditorData> {
  const { data, error } = await supabase
    .rpc("wc_get_mygm_promo_for_editing", {
      p_game_id: careerId,
      p_event_id: eventId,
      p_segment_id: segmentId,
    })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("The promo could not be loaded.");
  }

  return data as BookingPromoEditorData;
}

export async function updateMatch(
  input: AddBookingMatchInput,
): Promise<string> {
  return saveMatch(input, "update");
}

export async function updatePromo(
  input: AddBookingPromoInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("wc_update_mygm_promo", {
    p_game_id: input.careerId,
    p_event_id: input.eventId,
    p_segment_id: input.segmentId,
    p_promo_type_id: input.promoTypeId,
    p_participants: input.participants,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("The promo could not be updated.");
  }

  return data;
}

export async function deleteSegment(
  careerId: string,
  eventId: string,
  segmentId: string,
): Promise<void> {
  const { error } = await supabase.rpc("wc_delete_mygm_segment", {
    p_game_id: careerId,
    p_event_id: eventId,
    p_segment_id: segmentId,
  });

  if (error) {
    throw error;
  }
}

export async function moveSegment(
  careerId: string,
  eventId: string,
  segmentId: string,
  direction: "up" | "down",
): Promise<void> {
  const { error } = await supabase.rpc("wc_move_mygm_segment", {
    p_game_id: careerId,
    p_event_id: eventId,
    p_segment_id: segmentId,
    p_direction: direction,
  });

  if (error) {
    throw error;
  }
}

export async function openCurrentShow(
  careerId: string,
  signal: AbortSignal,
): Promise<MyGmBookingData> {
  const { data, error } = await supabase
    .rpc("wc_open_mygm_booking", {
      p_game_id: careerId,
    })
    .abortSignal(signal);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Booking is unavailable.");
  }

  return data as MyGmBookingData;
}

export async function confirmBooking(
  careerId: string,
  eventId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("wc_confirm_mygm_booking", {
    p_game_id: careerId,
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("The card could not be confirmed.");
  }

  return data;
}

export async function reopenBooking(
  careerId: string,
  eventId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("wc_reopen_mygm_booking", {
    p_game_id: careerId,
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  if (typeof data !== "string") {
    throw new Error("The card could not be reopened.");
  }

  return data;
}
