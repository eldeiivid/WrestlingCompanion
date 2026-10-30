import { getPromoAutomaticEffect } from "../../rules/promoAutomaticEffectsRules";
import type { BookingSegmentSummary } from "../../types/booking.types";
import type { BookingPromoWrestlerState } from "../../types/bookingResults.types";
import "./PromoAutomaticEffectPreview.scss";

interface PromoAutomaticEffectPreviewProps {
  segment: BookingSegmentSummary;
  wrestlers: BookingPromoWrestlerState[];
}

export default function PromoAutomaticEffectPreview({
  segment,
  wrestlers,
}: PromoAutomaticEffectPreviewProps) {
  const effect = getPromoAutomaticEffect(segment, wrestlers);

  if (effect.status === "not_applicable") {
    return null;
  }

  if (effect.status === "invalid") {
    return (
      <p className="promo-effect-preview__error" role="alert">
        {effect.message}
      </p>
    );
  }

  return (
    <aside className="promo-effect-preview">
      <h4>Change on show close</h4>

      <p className="promo-effect-preview__name">{effect.wrestlerName}</p>

      <dl className="promo-effect-preview__changes">
        {effect.changes.map((change) => (
          <div key={change.label}>
            <dt>{change.label}</dt>
            <dd>
              <span>{change.before}</span>
              <span aria-hidden="true"> → </span>
              <span className="promo-effect-preview__next">
                <span className="promo-effect-preview__sr-only">
                  changes to{" "}
                </span>
                {change.after}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="promo-effect-preview__hint">
        This change will be applied when you close the show.
      </p>
    </aside>
  );
}
