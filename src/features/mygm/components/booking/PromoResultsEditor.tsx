import { useId } from "react";
import {
  getPromoEffectField,
  isValidPromoEffectAmount,
} from "../../rules/promoResultsRules";
import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingPromoRatingOption,
  BookingPromoResultDraft,
  BookingPromoResultsDraft,
  BookingPromoWrestlerState,
} from "../../types/bookingResults.types";
import "./PromoResultsEditor.scss";
import PromoAutomaticEffectPreview from "./PromoAutomaticEffectPreview";
import { getPromoAutomaticEffect } from "../../rules/promoAutomaticEffectsRules";

interface PromoResultsEditorProps {
  segments: BookingSegmentSummary[];
  ratings: BookingPromoRatingOption[];
  results: BookingPromoResultsDraft;
  financesEnabled: boolean;
  fansEnabled: boolean;
  disabled?: boolean;
  wrestlers: BookingPromoWrestlerState[];
  onResultChange: (
    segmentId: string,
    changes: Partial<BookingPromoResultDraft>,
  ) => void;
}

export default function PromoResultsEditor({
  segments,
  ratings,
  results,
  wrestlers,
  financesEnabled,
  fansEnabled,
  disabled = false,
  onResultChange,
}: PromoResultsEditorProps) {
  const fieldId = useId();

  const promos = segments
    .filter((segment) => segment.kind === "promo")
    .sort((first, second) => first.position - second.position);

  return (
    <section className="promo-results">
      <header className="promo-results__header">
        <h2>Promo results</h2>
        <p>Record the rating and any required outcome from the game.</p>
      </header>

      <div className="promo-results__list">
        {promos.map((segment) => {
          const result = results[segment.id];

          const selectedRating = ratings.find(
            (rating) => rating.id === result?.ratingId,
          );

          const effectField = getPromoEffectField(
            segment.promo_type_id,
            financesEnabled,
            fansEnabled,
          );

          const effectValue = effectField
            ? (result?.effects?.[effectField] ?? "")
            : "";

          const allowNegative = segment.promo_type_id !== "invasion";

          const validEffect =
            effectField === null ||
            isValidPromoEffectAmount(effectValue, allowNegative);

          const automaticEffect = getPromoAutomaticEffect(segment, wrestlers);

          const isComplete =
            Boolean(selectedRating) &&
            validEffect &&
            automaticEffect.status !== "invalid";

          const initiators = segment.participants
            .filter((participant) => participant.role !== "target")
            .map((participant) => participant.name)
            .join(" & ");

          const targets = segment.participants
            .filter((participant) => participant.role === "target")
            .map((participant) => participant.name)
            .join(" & ");

          const participantLabel = targets
            ? `${initiators} → ${targets}`
            : initiators;

          const selectId = `${fieldId}-${segment.id}-rating`;
          const amountId = `${fieldId}-${segment.id}-amount`;
          const helpId = `${amountId}-help`;
          const errorId = `${amountId}-error`;

          const hasInvalidAmount =
            effectField !== null && effectValue !== "" && !validEffect;

          return (
            <article className="promo-results__card" key={segment.id}>
              <header className="promo-results__card-header">
                <div>
                  <p className="promo-results__position">
                    Segment {segment.position}
                  </p>

                  <h3>{segment.label}</h3>

                  <p className="promo-results__participants">
                    {participantLabel || "No participants"}
                  </p>
                </div>

                <span
                  className={
                    isComplete
                      ? "promo-results__status promo-results__status--complete"
                      : "promo-results__status"
                  }
                >
                  {isComplete ? "Complete" : "Pending"}
                </span>
              </header>

              <fieldset className="promo-results__fields" disabled={disabled}>
                <legend className="promo-results__legend">
                  Result for {segment.label}, segment {segment.position}
                </legend>

                <div className="promo-results__field">
                  <label htmlFor={selectId}>Promo rating</label>

                  <select
                    id={selectId}
                    value={selectedRating?.id ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;

                      if (value === "") {
                        onResultChange(segment.id, { ratingId: null });
                        return;
                      }

                      const rating = ratings.find(
                        (option) => option.id === value,
                      );

                      if (rating) {
                        onResultChange(segment.id, {
                          ratingId: rating.id,
                        });
                      }
                    }}
                  >
                    <option value="">Select a rating</option>

                    {ratings.map((rating) => (
                      <option key={rating.id} value={rating.id}>
                        {rating.name}
                      </option>
                    ))}
                  </select>

                  {result?.ratingId != null && !selectedRating && (
                    <p className="promo-results__warning" role="status">
                      The saved rating is unavailable. Please choose another
                      rating.
                    </p>
                  )}
                </div>

                {effectField && (
                  <div className="promo-results__field">
                    <label htmlFor={amountId}>
                      {effectField === "moneyChange"
                        ? "Money gained or lost"
                        : allowNegative
                          ? "Fans gained or lost"
                          : "Fans gained"}
                    </label>

                    <input
                      id={amountId}
                      type="text"
                      inputMode={allowNegative ? "text" : "numeric"}
                      autoComplete="off"
                      placeholder="Enter amount"
                      value={effectValue}
                      aria-invalid={hasInvalidAmount}
                      aria-describedby={
                        hasInvalidAmount ? `${helpId} ${errorId}` : helpId
                      }
                      onChange={(event) => {
                        const value = event.target.value;

                        const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;

                        if (!pattern.test(value)) {
                          return;
                        }

                        onResultChange(segment.id, {
                          effects: {
                            moneyChange: result?.effects?.moneyChange ?? "",
                            fansChange: result?.effects?.fansChange ?? "",
                            [effectField]: value,
                          },
                        });
                      }}
                    />

                    <p className="promo-results__help" id={helpId}>
                      {allowNegative
                        ? "Use a negative number for a loss. Enter 0 if there was no change."
                        : "Enter the fans gained from this promo. Enter 0 if there was no gain."}
                    </p>

                    {hasInvalidAmount && (
                      <p
                        className="promo-results__warning"
                        id={errorId}
                        role="alert"
                      >
                        Enter a valid whole number within the supported database
                        range.
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
              <PromoAutomaticEffectPreview
                segment={segment}
                wrestlers={wrestlers}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
