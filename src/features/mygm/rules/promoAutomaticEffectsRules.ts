import type { BookingSegmentSummary } from "../types/booking.types";
import type { BookingPromoWrestlerState } from "../types/bookingResults.types";

export type PromoAutomaticEffect =
  | {
      status: "not_applicable";
    }
  | {
      status: "invalid";
      message: string;
    }
  | {
      status: "ready";
      wrestlerName: string;
      changes: {
        label: string;
        before: string;
        after: string;
      }[];
    };

export function getPromoAutomaticEffect(
  segment: BookingSegmentSummary,
  wrestlers: readonly BookingPromoWrestlerState[],
): PromoAutomaticEffect {
  if (
    segment.kind !== "promo" ||
    (segment.promo_type_id !== "turn" &&
      segment.promo_type_id !== "class_change")
  ) {
    return { status: "not_applicable" };
  }

  const initiators = segment.participants.filter(
    (participant) => participant.role === "initiator",
  );

  if (initiators.length !== 1) {
    return {
      status: "invalid",
      message: "This promo requires exactly one performing wrestler.",
    };
  }

  const wrestler = wrestlers.find(
    (item) => item.id === initiators[0].wrestler_id,
  );

  if (!wrestler) {
    return {
      status: "invalid",
      message: "The wrestler details are unavailable. Reload the results.",
    };
  }

  if (segment.promo_type_id === "turn") {
    return {
      status: "ready",
      wrestlerName: wrestler.name,
      changes: [
        {
          label: "Role",
          before: wrestler.role === "face" ? "Face" : "Heel",
          after: wrestler.role === "face" ? "Heel" : "Face",
        },
      ],
    };
  }

  const primaryClass = wrestler.primary_class.trim();
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";

  if (
    wrestler.in_ring_skill < 15 ||
    primaryClass === "" ||
    secondaryClass === "" ||
    primaryClass.toLowerCase() === secondaryClass.toLowerCase()
  ) {
    return {
      status: "invalid",
      message:
        "Class Change requires an in-ring level of at least 15 and two different classes.",
    };
  }

  return {
    status: "ready",
    wrestlerName: wrestler.name,
    changes: [
      {
        label: "Primary class",
        before: primaryClass,
        after: secondaryClass,
      },
      {
        label: "Secondary class",
        before: secondaryClass,
        after: primaryClass,
      },
    ],
  };
}
