import type {
  BookingPromoRole,
  BookingPromoTypeId,
} from "../types/booking.types";

interface PromoParticipantSlot {
  label: string;
  role: BookingPromoRole;
}

export function getPromoParticipantSlots(
  typeId: BookingPromoTypeId,
): PromoParticipantSlot[] {
  if (typeId === "call_out") {
    return [
      { label: "Calling wrestler", role: "initiator" },
      { label: "Target wrestler", role: "target" },
    ];
  }

  if (typeId === "tag_call_out") {
    return [
      { label: "Calling team · Wrestler 1", role: "initiator" },
      { label: "Calling team · Wrestler 2", role: "initiator" },
      { label: "Target team · Wrestler 1", role: "target" },
      { label: "Target team · Wrestler 2", role: "target" },
    ];
  }

  return [{ label: "Wrestler", role: "initiator" }];
}
