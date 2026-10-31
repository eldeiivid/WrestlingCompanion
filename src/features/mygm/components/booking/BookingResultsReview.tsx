import { useId } from "react";
import { Pencil, Star } from "lucide-react";

import BookingSegmentCard from "./BookingSegmentCard";

import {
  getBookingFeudContexts,
  getBookingFeudResultsError,
  supportsBookingFeudResults,
} from "../../rules/bookingFeudResultsRules";
import { getPromoAutomaticEffect } from "../../rules/promoAutomaticEffectsRules";
import { getPromoEffectField } from "../../rules/promoResultsRules";
import { getShowFinalBalance } from "../../rules/showResultsRules";

import type {
  BookingSegmentSummary,
  MyGmBookingData,
} from "../../types/booking.types";
import type {
  BookingActiveFeud,
  BookingFeudActionDraft,
  BookingMatchRatingOption,
  BookingPromoRatingOption,
  BookingPromoWrestlerState,
  BookingResultsDraft,
} from "../../types/bookingResults.types";

import "./BookingResultsReview.scss";

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

interface RivalryActionsSummaryProps {
  segment: BookingSegmentSummary;
  actions: BookingFeudActionDraft[] | undefined;
  feuds: BookingActiveFeud[];
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyChangeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

const numberFormatter = new Intl.NumberFormat("en-US");

const numberChangeFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
});

const showTypeLabels = {
  weekly: "Weekly show",
  go_home: "Go Home show",
  ple: "PLE",
};

function formatAmount(
  value: string | null,
  money = false,
  signed = false,
): string {
  if (value === null || !/^-?\d+$/.test(value)) {
    return "Pending";
  }

  const amount = BigInt(value);

  if (money) {
    return signed
      ? moneyChangeFormatter.format(amount)
      : moneyFormatter.format(amount);
  }

  return signed
    ? numberChangeFormatter.format(amount)
    : numberFormatter.format(amount);
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

function RivalryActionsSummary({
  segment,
  actions,
  feuds,
}: RivalryActionsSummaryProps) {
  if (!supportsBookingFeudResults(segment)) {
    return null;
  }

  const error = getBookingFeudResultsError(segment, actions, feuds);

  if (!error && actions?.length === 1 && actions[0].action === "none") {
    return (
      <p className="results-review__unchanged">
        <span>Rivalries</span>
        No change
      </p>
    );
  }

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

  return (
    <section className="results-review__changes" aria-label="Rivalry changes">
      <h4>Rivalry changes</h4>

      {error && <p className="results-review__warning">{error}</p>}

      <ol className="results-review__rivalry-actions">
        {(actions ?? []).map((action) => {
          if (action.action === "none") {
            return (
              <li key={action.id}>
                <p>No rivalry change.</p>
              </li>
            );
          }

          if (action.action === "create") {
            const name = ([1, 2] as const)
              .map((side) =>
                action.members
                  .filter((member) => member.side === side)
                  .map(
                    (member) =>
                      names.get(member.wrestlerId) ?? "Unknown wrestler",
                  )
                  .join(" & "),
              )
              .join(" vs ");

            return (
              <li key={action.id}>
                <span className="results-review__action-label">
                  New rivalry
                </span>

                <strong>
                  {action.members.length > 0 ? name : "Participants pending"}
                </strong>

                <span className="results-review__change-detail">
                  Starts at level 1
                </span>
              </li>
            );
          }

          const feud = feuds.find((item) => item.id === action.feudId);

          return (
            <li key={action.id}>
              <span className="results-review__action-label">
                {action.action === "increase"
                  ? "Level increased"
                  : "Rivalry ended"}
              </span>

              <strong>
                {feud ? getFeudLabel(feud) : "Selected rivalry unavailable"}
              </strong>

              <span className="results-review__change-detail">
                {action.action === "increase"
                  ? feud
                    ? `Level ${feud.level} → ${Math.min(feud.level + 1, 4)}`
                    : "Pending"
                  : `Winner: ${
                      feud && action.winningSide !== null
                        ? getSideLabel(feud, action.winningSide)
                        : "No winner assigned"
                    }`}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
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
  const headingId = useId();

  const segments = [...booking.segments].sort(
    (first, second) => first.position - second.position,
  );

  const matchCount = segments.filter(
    (segment) => segment.kind === "match",
  ).length;

  const promoCount = segments.filter(
    (segment) => segment.kind === "promo",
  ).length;

  const season = Math.floor((booking.event.tick - 1) / 50) + 1;
  const week = ((booking.event.tick - 1) % 50) + 1;

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
    <section className="results-review" aria-labelledby={headingId}>
      <header className="results-review__header">
        <h2 id={headingId}>Final review</h2>
        <p>Check your card before closing the show.</p>
      </header>

      <section className="results-review__hero" aria-label="Show summary">
        <div className="results-review__hero-heading">
          <div className="results-review__show">
            <p className="results-review__eyebrow">
              {showTypeLabels[booking.show_type]}
              {" · "}
              Season {season} · Week {week}
            </p>

            <h3>{booking.event.name}</h3>

            <p className="results-review__show-count">
              {matchCount} {matchCount === 1 ? "match" : "matches"}
              {" · "}
              {promoCount} {promoCount === 1 ? "promo" : "promos"}
            </p>
          </div>

          <dl className="results-review__show-rating">
            <dt>Show rating</dt>
            <dd>
              <Star size={21} aria-hidden="true" />
              <strong>
                {showRating === null ? "Pending" : showRating.toFixed(2)}
              </strong>
              {showRating !== null && <span>/ 5</span>}
            </dd>
          </dl>
        </div>

        {(booking.finances_enabled || booking.fans_enabled) && (
          <dl className="results-review__metrics">
            {booking.finances_enabled && (
              <div>
                <dt>Final balance</dt>
                <dd>
                  <strong>{formatAmount(finalMoney, true)}</strong>

                  <span className="results-review__metric-context">
                    <span>
                      Current: {formatAmount(booking.budget_available, true)}
                    </span>
                    <span>
                      Change: {formatAmount(draft.show.moneyChange, true, true)}
                    </span>
                  </span>
                </dd>
              </div>
            )}

            {booking.fans_enabled && (
              <div>
                <dt>Final fans</dt>
                <dd>
                  <strong>{formatAmount(finalFans)}</strong>

                  <span className="results-review__metric-context">
                    <span>Current: {formatAmount(booking.fans_available)}</span>
                    <span>
                      Change: {formatAmount(draft.show.fansChange, false, true)}
                    </span>
                  </span>
                </dd>
              </div>
            )}
          </dl>
        )}

        <footer className="results-review__hero-footer">
          <p>
            {booking.finances_enabled
              ? `Card cost: ${formatAmount(
                  booking.total_cost,
                  true,
                )}. Included in the overall money change.`
              : "Results will be applied when you close the show."}
          </p>

          <button
            className="results-review__edit"
            type="button"
            onClick={onEditShow}
          >
            <Pencil size={14} aria-hidden="true" />
            Edit show results
          </button>
        </footer>
      </section>

      <div className="results-review__segments">
        {segments.map((segment, index) => {
          const matchResult = draft.matches[segment.id];
          const promoResult = draft.promos[segment.id];

          const matchRating = matchRatings.find(
            (rating) => rating.stars === matchResult?.ratingStars,
          );

          const promoRating = promoRatings.find(
            (rating) => rating.id === promoResult?.ratingId,
          );

          const winnerNames =
            segment.kind === "match"
              ? segment.participants
                  .filter(
                    (participant) =>
                      participant.side === matchResult?.winningSide,
                  )
                  .map((participant) => participant.name)
                  .join(" & ")
              : "";

          const winnerCount =
            segment.kind === "match"
              ? segment.participants.filter(
                  (participant) =>
                    participant.side === matchResult?.winningSide,
                ).length
              : 0;

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

          return (
            <div className="results-review__segment" key={segment.id}>
              <BookingSegmentCard
                segment={segment}
                financesEnabled={booking.finances_enabled}
                editable={false}
                isBusy={false}
                isFirst={index === 0}
                isLast={index === segments.length - 1}
                movingDirection={null}
                winningSide={
                  segment.kind === "match"
                    ? (matchResult?.winningSide ?? null)
                    : undefined
                }
                onMove={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />

              <div className="results-review__recorded">
                <div className="results-review__result-heading">
                  <div className="results-review__primary-result">
                    <span>
                      {segment.kind === "match"
                        ? winnerCount > 1
                          ? "Winners"
                          : "Winner"
                        : "Promo rating"}
                    </span>

                    <strong>
                      {segment.kind === "match"
                        ? winnerNames || "Pending"
                        : (promoRating?.name ?? "Pending")}
                    </strong>
                  </div>

                  {segment.kind === "match" && (
                    <p
                      className="results-review__match-rating"
                      aria-label={
                        matchRating
                          ? `Match rating: ${matchRating.stars} out of 5 stars. ${matchRating.name}`
                          : "Match rating pending"
                      }
                    >
                      <Star size={18} aria-hidden="true" />
                      <strong>{matchRating?.stars ?? "Pending"}</strong>
                      {matchRating && <span>/ 5</span>}
                    </p>
                  )}

                  {segment.kind === "promo" && effectField && (
                    <div className="results-review__reported">
                      <span>
                        {effectField === "moneyChange"
                          ? "Reported money change"
                          : "Reported fan change"}
                      </span>
                      <strong>
                        {formatAmount(
                          effectAmount,
                          effectField === "moneyChange",
                          true,
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                {automaticEffect.status === "ready" && (
                  <section
                    className="results-review__changes"
                    aria-label="Automatic changes"
                  >
                    <h4>On show close</h4>
                    <p className="results-review__effect-name">
                      {automaticEffect.wrestlerName}
                    </p>

                    <ul className="results-review__automatic-changes">
                      {automaticEffect.changes.map((change) => (
                        <li key={change.label}>
                          <span>{change.label}</span>
                          <strong>
                            {change.before} → {change.after}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {automaticEffect.status === "invalid" && (
                  <p className="results-review__warning">
                    {automaticEffect.message}
                  </p>
                )}

                <RivalryActionsSummary
                  segment={segment}
                  actions={draft.feuds[segment.id]}
                  feuds={feudContexts.get(segment.id) ?? feuds}
                />

                <footer className="results-review__segment-footer">
                  <button
                    className="results-review__edit"
                    type="button"
                    onClick={() => onEditSegment(segment.id)}
                    aria-label={`Edit results for segment ${segment.position}`}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Edit results
                  </button>
                </footer>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
