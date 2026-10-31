import { useId, useState } from "react";
import { Check, UserRound } from "lucide-react";

import PromoAutomaticEffectPreview from "./PromoAutomaticEffectPreview";

import {
  getPromoEffectField,
  isValidPromoEffectAmount,
} from "../../rules/promoResultsRules";
import { getPromoAutomaticEffect } from "../../rules/promoAutomaticEffectsRules";

import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingPromoRatingOption,
  BookingPromoResultDraft,
  BookingPromoResultsDraft,
  BookingPromoWrestlerState,
} from "../../types/bookingResults.types";

import "./PromoResultsEditor.scss";

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

function ParticipantImage({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(src)}
    />
  ) : (
    <UserRound size={26} strokeWidth={1.25} aria-hidden="true" />
  );
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
  const headingId = useId();

  const promos = segments
    .filter((segment) => segment.kind === "promo")
    .sort((first, second) => first.position - second.position);

  return (
    <section className="promo-results" aria-labelledby={headingId}>
      <header className="promo-results__header">
        <h2 id={headingId}>Promo results</h2>
        <p>Record the rating and required outcome shown in your game.</p>
      </header>

      {promos.length === 0 ? (
        <p className="promo-results__empty">No promos are available.</p>
      ) : (
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

            const initiators = segment.participants.filter(
              (participant) => participant.role !== "target",
            );

            const targets = segment.participants.filter(
              (participant) => participant.role === "target",
            );

            const groups = [
              {
                id: "initiators",
                label: initiators.length === 1 ? "Performer" : "Performers",
                members: initiators,
              },
              {
                id: "targets",
                label: targets.length === 1 ? "Target" : "Targets",
                members: targets,
              },
            ].filter((group) => group.members.length > 0);

            const cardTitleId = `${fieldId}-${segment.id}-title`;
            const ratingName = `${fieldId}-${segment.id}-rating`;
            const amountId = `${fieldId}-${segment.id}-amount`;
            const helpId = `${amountId}-help`;
            const errorId = `${amountId}-error`;

            const hasInvalidAmount =
              effectField !== null && effectValue !== "" && !validEffect;

            return (
              <article
                className="promo-results__card"
                key={segment.id}
                aria-labelledby={cardTitleId}
              >
                <header className="promo-results__card-header">
                  <div>
                    <p className="promo-results__position">
                      Segment {segment.position}
                    </p>
                    <h3 id={cardTitleId}>{segment.label}</h3>
                  </div>

                  <span
                    className={`promo-results__status${
                      isComplete ? " promo-results__status--complete" : ""
                    }`}
                  >
                    {isComplete && <Check size={13} aria-hidden="true" />}
                    {isComplete ? "Complete" : "Pending"}
                  </span>
                </header>

                {groups.length > 0 ? (
                  <div className="promo-results__people">
                    {groups.map((group) => (
                      <section
                        className="promo-results__group"
                        key={group.id}
                        aria-label={group.label}
                      >
                        <h4>{group.label}</h4>

                        <ul>
                          {group.members.map((participant) => (
                            <li key={participant.wrestler_id}>
                              <span
                                className="promo-results__portrait"
                                aria-hidden="true"
                              >
                                <ParticipantImage src={participant.image_url} />
                              </span>
                              <span>{participant.name}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="promo-results__help">
                    Participants unavailable.
                  </p>
                )}

                <fieldset className="promo-results__fields" disabled={disabled}>
                  <legend className="promo-results__legend">
                    Result for {segment.label}, segment {segment.position}
                  </legend>

                  <fieldset className="promo-results__ratings">
                    <legend>Promo rating</legend>

                    {ratings.length > 0 ? (
                      <div className="promo-results__rating-options">
                        {ratings.map((rating) => (
                          <label
                            className="promo-results__rating-option"
                            key={rating.id}
                          >
                            <input
                              type="radio"
                              name={ratingName}
                              value={rating.id}
                              checked={result?.ratingId === rating.id}
                              onChange={() =>
                                onResultChange(segment.id, {
                                  ratingId: rating.id,
                                })
                              }
                            />

                            <span>{rating.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="promo-results__warning">
                        No promo ratings are available.
                      </p>
                    )}

                    {selectedRating && (
                      <button
                        className="promo-results__clear"
                        type="button"
                        onClick={() =>
                          onResultChange(segment.id, { ratingId: null })
                        }
                      >
                        Clear rating
                      </button>
                    )}

                    {result?.ratingId != null && !selectedRating && (
                      <p className="promo-results__warning" role="status">
                        The saved rating is unavailable. Choose another rating.
                      </p>
                    )}
                  </fieldset>

                  {effectField && (
                    <div className="promo-results__outcome">
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
                          placeholder={
                            allowNegative ? "e.g. 500 or -500" : "e.g. 500"
                          }
                          value={effectValue}
                          aria-invalid={hasInvalidAmount}
                          aria-describedby={
                            hasInvalidAmount ? `${helpId} ${errorId}` : helpId
                          }
                          onChange={(event) => {
                            const value = event.target.value;
                            const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;

                            if (!pattern.test(value)) return;

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
                            Enter a valid whole number within the supported
                            range.
                          </p>
                        )}
                      </div>

                      <p className="promo-results__outcome-note">
                        Record this promo’s change here. In Show results, enter
                        the overall change shown in your game.
                      </p>
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
      )}
    </section>
  );
}
