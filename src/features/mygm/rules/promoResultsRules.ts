import type { BookingPromoTypeId } from "../types/booking.types";

export type PromoEffectField = "moneyChange" | "fansChange";

export function getPromoEffectField(
  promoTypeId: BookingPromoTypeId,
  financesEnabled: boolean,
  fansEnabled: boolean,
): PromoEffectField | null {
  if (promoTypeId === "ad_break" && financesEnabled) {
    return "moneyChange";
  }

  if (
    (promoTypeId === "charity" || promoTypeId === "invasion") &&
    fansEnabled
  ) {
    return "fansChange";
  }

  return null;
}

export function isValidPromoEffectAmount(
  value: string,
  allowNegative: boolean,
): boolean {
  const pattern = allowNegative ? /^-?\d+$/ : /^\d+$/;

  if (!pattern.test(value)) {
    return false;
  }

  const amount = BigInt(value);

  return (
    amount >= BigInt("-9223372036854775808") &&
    amount <= BigInt("9223372036854775807")
  );
}
