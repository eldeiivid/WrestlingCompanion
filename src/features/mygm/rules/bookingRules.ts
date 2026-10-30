import type { MyGmBookingData } from "../types/booking.types";

interface BookingCardIssue {
  code:
    | "minimum_matches"
    | "maximum_matches"
    | "maximum_promos"
    | "promo_slots"
    | "consecutive_promos"
    | "opening_match"
    | "closing_match";
  message: string;
}

export function getBookingCardIssues(
  booking: MyGmBookingData,
): BookingCardIssue[] {
  if (booking.event.status !== "draft") return [];

  const issues: BookingCardIssue[] = [];

  const segments = [...booking.segments].sort(
    (first, second) => first.position - second.position,
  );

  const matchCount = segments.filter(
    (segment) => segment.kind === "match",
  ).length;

  const promoCount = segments.filter(
    (segment) => segment.kind === "promo",
  ).length;

  if (matchCount < booking.limits.min_matches) {
    issues.push({
      code: "minimum_matches",
      message: `At least ${booking.limits.min_matches} matches are required.`,
    });
  }

  if (matchCount > booking.limits.max_matches) {
    issues.push({
      code: "maximum_matches",
      message: `This show allows up to ${booking.limits.max_matches} matches.`,
    });
  }

  if (promoCount > booking.limits.max_promos) {
    issues.push({
      code: "maximum_promos",
      message: `This show allows up to ${booking.limits.max_promos} promos.`,
    });
  }

  const closingMatchSlots = booking.limits.must_end_with_match ? 1 : 0;

  const availablePromoSlots = Math.max(0, matchCount - closingMatchSlots);

  const hasEnoughPromoSlots = promoCount <= availablePromoSlots;

  if (!hasEnoughPromoSlots) {
    const missingMatches = promoCount + closingMatchSlots - matchCount;

    const excessPromos = promoCount - availablePromoSlots;

    const canAddRequiredMatches =
      matchCount + missingMatches <= booking.limits.max_matches;

    const matchWord = missingMatches === 1 ? "match" : "matches";

    const promoWord = excessPromos === 1 ? "promo" : "promos";

    issues.push({
      code: "promo_slots",
      message: canAddRequiredMatches
        ? `Add ${missingMatches} more ${matchWord} or remove ${excessPromos} ${promoWord} to fit the available promo slots.`
        : `Remove at least ${excessPromos} ${promoWord} to fit the available promo slots.`,
    });
  }

  const hasConsecutivePromos = segments.some(
    (segment, index) =>
      segment.kind === "promo" && segments[index - 1]?.kind === "promo",
  );

  if (hasEnoughPromoSlots && hasConsecutivePromos) {
    issues.push({
      code: "consecutive_promos",
      message: "Promos must be separated by matches.",
    });
  }

  if (segments.length > 0) {
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    if (
      booking.limits.must_start_with_match &&
      firstSegment?.kind !== "match"
    ) {
      issues.push({
        code: "opening_match",
        message: "The first segment must be a match.",
      });
    }

    if (
      hasEnoughPromoSlots &&
      booking.limits.must_end_with_match &&
      lastSegment?.kind !== "match"
    ) {
      issues.push({
        code: "closing_match",
        message: "The last segment must be a match.",
      });
    }
  }

  return issues;
}
