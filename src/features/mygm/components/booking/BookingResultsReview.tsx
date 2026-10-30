import {
  getBookingFeudContexts,
  supportsBookingFeudResults,
} from "../../rules/bookingFeudResultsRules";
import { getPromoAutomaticEffect } from "../../rules/promoAutomaticEffectsRules";
import { getPromoEffectField } from "../../rules/promoResultsRules";
import type {
  BookingSegmentSummary,
  MyGmBookingData,
} from "../../types/booking.types";
import type {
  BookingActiveFeud,
  BookingMatchRatingOption,
  BookingPromoRatingOption,
  BookingPromoWrestlerState,
  BookingResultsDraft,
} from "../../types/bookingResults.types";
import "./BookingResultsReview.scss";
import { getShowFinalBalance } from "../../rules/showResultsRules";

interface BookingResultsReviewProps {
  booking: MyGmBookingData;
  draft: BookingResultsDraft;
  showRating: number | null;
  matchRatings: BookingMatchRatingOption[];
  promoRatings: BookingPromoRatingOption[];
  feuds: BookingActiveFeud[];
  wrestlers: BookingPromoWrestlerState[];
  onEditSegment: (segmentId: string) => void;
  onEditShow: () => void;
}

function formatAmount(value: string, money = false): string {
  if (!/^-?\d+$/.test(value)) {
    return "Pending";
  }

  const amount = BigInt(value);

  return money
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)
    : new Intl.NumberFormat("en-US").format(amount);
}

function getSideLabel(feud: BookingActiveFeud, side: 1 | 2): string {
  return feud.members
    .filter((member) => member.side === side)
    .map((member) => member.name)
    .join(" & ");
}

function getFeudLabel(feud: BookingActiveFeud): string {
  return (
    feud.name?.trim() || `${getSideLabel(feud, 1)} vs ${getSideLabel(feud, 2)}`
  );
}

function getSegmentParticipants(segment: BookingSegmentSummary): string {
  if (segment.kind === "promo") {
    const initiators = segment.participants
      .filter((participant) => participant.role !== "target")
      .map((participant) => participant.name)
      .join(" & ");

    const targets = segment.participants
      .filter((participant) => participant.role === "target")
      .map((participant) => participant.name)
      .join(" & ");

    return targets ? `${initiators} → ${targets}` : initiators;
  }

  const sides = new Map<number, string[]>();

  for (const participant of segment.participants) {
    const names = sides.get(participant.side) ?? [];

    names.push(participant.name);
    sides.set(participant.side, names);
  }

  return [...sides.entries()]
    .sort(([first], [second]) => first - second)
    .map(([, names]) => names.join(" & "))
    .join(" vs ");
}

export default function BookingResultsReview({
  booking,
  draft,
  showRating,
  matchRatings,
  promoRatings,
  feuds,
  wrestlers,
  onEditSegment,
  onEditShow,
}: BookingResultsReviewProps) {
  const segments = [...booking.segments].sort(
    (first, second) => first.position - second.position,
  );

  const feudContexts = getBookingFeudContexts(
    segments,
    draft.feuds,
    feuds,
    booking.current_tick,
  );

  const finalMoney = getShowFinalBalance(
    booking.budget_available,
    draft.show.moneyChange,
  );

  const finalFans = getShowFinalBalance(
    booking.fans_available,
    draft.show.fansChange,
  );

  return (
    <section className="results-review">
      <header className="results-review__header">
        <h2>Review show results</h2>

        <p>
          Review the results and changes before closing the show. Nothing has
          been applied to your career yet.
        </p>
      </header>

      <section className="results-review__card">
        <div className="results-review__card-header">
          <h3>Show summary</h3>

          <button type="button" onClick={onEditShow}>
            Edit show results
          </button>
        </div>

        <dl className="results-review__details">
          <div>
            <dt>Show rating</dt>
            <dd>
              {showRating === null
                ? "Pending"
                : `${showRating.toFixed(2)} / 5 stars`}
            </dd>
          </div>

          {booking.finances_enabled && (
            <>
              <div>
                <dt>Card cost</dt>
                <dd>{formatAmount(booking.total_cost, true)}</dd>
              </div>

              <div>
                <dt>Final money balance</dt>
                <dd>{formatAmount(finalMoney ?? "", true)}</dd>
              </div>
            </>
          )}

          {booking.fans_enabled && (
            <div>
              <dt>Final fan total</dt>
              <dd>{formatAmount(finalFans ?? "")}</dd>
            </div>
          )}
        </dl>

        {booking.finances_enabled && (
          <p className="results-review__hint">
            The final money balance already includes expenses and income. Card
            costs will not be deducted from that balance again.
          </p>
        )}
      </section>

      <div className="results-review__segments">
        {segments.map((segment) => {
          const matchResult = draft.matches[segment.id];
          const promoResult = draft.promos[segment.id];
          const feudResult = draft.feuds[segment.id];

          const context = feudContexts.get(segment.id) ?? feuds;

          const affectedFeud =
            feudResult?.action === "increase" ||
            feudResult?.action === "resolve"
              ? context.find((feud) => feud.id === feudResult.feudId)
              : undefined;

          const automaticEffect = getPromoAutomaticEffect(segment, wrestlers);

          const effectField =
            segment.kind === "promo"
              ? getPromoEffectField(
                  segment.promo_type_id,
                  booking.finances_enabled,
                  booking.fans_enabled,
                )
              : null;

          const effectAmount = effectField
            ? (promoResult?.effects?.[effectField] ?? "")
            : "";

          const winningNames =
            segment.kind === "match"
              ? segment.participants
                  .filter(
                    (participant) =>
                      participant.side === matchResult?.winningSide,
                  )
                  .map((participant) => participant.name)
                  .join(" & ")
              : "";

          const matchRating = matchRatings.find(
            (rating) => rating.stars === matchResult?.ratingStars,
          );

          const promoRating = promoRatings.find(
            (rating) => rating.id === promoResult?.ratingId,
          );

          const names = new Map(
            segment.participants.map((participant): [string, string] => [
              participant.wrestler_id,
              participant.name,
            ]),
          );

          if (segment.kind === "match" && segment.interference) {
            names.set(
              segment.interference.wrestler_id,
              segment.interference.wrestler_name,
            );

            names.set(
              segment.interference.target_wrestler_id,
              segment.interference.target_wrestler_name,
            );
          }

          const newFeudLabel =
            feudResult?.action === "create"
              ? ([1, 2] as const)
                  .map((side) =>
                    feudResult.members
                      .filter((member) => member.side === side)
                      .map(
                        (member) =>
                          names.get(member.wrestlerId) ?? "Unknown wrestler",
                      )
                      .join(" & "),
                  )
                  .join(" vs ")
              : "";

          return (
            <article className="results-review__card" key={segment.id}>
              <div className="results-review__card-header">
                <div>
                  <p className="results-review__position">
                    Segment {segment.position} ·{" "}
                    {segment.kind === "match" ? "Match" : "Promo"}
                  </p>

                  <h3>{getSegmentParticipants(segment)}</h3>

                  <p className="results-review__metadata">
                    {segment.label}
                    {segment.kind === "match" &&
                      segment.stipulation_name &&
                      ` · ${segment.stipulation_name}`}
                  </p>
                </div>

                <button type="button" onClick={() => onEditSegment(segment.id)}>
                  Edit
                </button>
              </div>

              <dl className="results-review__details">
                {segment.kind === "match" ? (
                  <>
                    <div>
                      <dt>Winner</dt>
                      <dd>{winningNames || "Pending"}</dd>
                    </div>

                    <div>
                      <dt>Match rating</dt>
                      <dd>
                        {matchRating
                          ? `${matchRating.stars} stars — ${matchRating.name}`
                          : "Pending"}
                      </dd>
                    </div>

                    {segment.title && (
                      <div>
                        <dt>Title at stake</dt>
                        <dd>{segment.title.name}</dd>
                      </div>
                    )}

                    {segment.interference && (
                      <div>
                        <dt>Interference</dt>
                        <dd>
                          {segment.interference.wrestler_name}
                          {" → "}
                          {segment.interference.target_wrestler_name}
                        </dd>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Promo rating</dt>
                      <dd>{promoRating?.name ?? "Pending"}</dd>
                    </div>

                    {effectField && (
                      <div>
                        <dt>
                          {effectField === "moneyChange"
                            ? "Money change"
                            : "Fan change"}
                        </dt>
                        <dd>
                          {formatAmount(
                            effectAmount,
                            effectField === "moneyChange",
                          )}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>

              {automaticEffect.status === "ready" && (
                <div className="results-review__outcome">
                  <h4>Changes on show close</h4>

                  <ul>
                    {automaticEffect.changes.map((change) => (
                      <li key={change.label}>
                        {change.label}: {change.before} → {change.after}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {automaticEffect.status === "invalid" && (
                <p className="results-review__warning">
                  {automaticEffect.message}
                </p>
              )}

              {supportsBookingFeudResults(segment) && (
                <div className="results-review__outcome">
                  <h4>Rivalry outcome</h4>

                  {!feudResult && <p>Pending</p>}

                  {feudResult?.action === "none" && <p>No rivalry change.</p>}

                  {feudResult?.action === "create" && (
                    <p>Create {newFeudLabel} at level 1.</p>
                  )}

                  {feudResult?.action === "increase" && (
                    <p>
                      {affectedFeud
                        ? `${getFeudLabel(affectedFeud)}: level ${affectedFeud.level} → ${Math.min(affectedFeud.level + 1, 4)}.`
                        : "The selected rivalry is unavailable."}
                    </p>
                  )}

                  {feudResult?.action === "resolve" && (
                    <>
                      <p>
                        {affectedFeud
                          ? `End ${getFeudLabel(affectedFeud)}.`
                          : "The selected rivalry is unavailable."}
                      </p>

                      <p>
                        Winner:{" "}
                        {affectedFeud && feudResult.winningSide !== null
                          ? getSideLabel(affectedFeud, feudResult.winningSide)
                          : "No winner assigned"}
                      </p>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
