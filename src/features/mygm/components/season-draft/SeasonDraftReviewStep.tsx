import { useEffect, useId, useRef } from "react";

import { useSeasonDraftReview } from "../../hooks/season-draft/useSeasonDraftReview";
import { useConfirmSeasonDraft } from "../../hooks/season-draft/useConfirmSeasonDraft";

import type { SeasonDraftConfirmationResult } from "../../types/season-draft/seasonDraftConfirmation.types";

import SeasonDraftRosterReview from "./SeasonDraftRosterReview";
import SeasonDraftEffectsReview from "./SeasonDraftEffectsReview";

import "./SeasonDraftReviewStep.scss";

interface SeasonDraftReviewStepProps {
  careerId: string;
  transitionId: string;
  onBack: () => void;
  onEditRetentions: () => void;
  onEditDraft: () => void;
  onEditBalances: () => void;
  onConfirmed: (result: SeasonDraftConfirmationResult) => void;
  onConfirmingChange?: (isConfirming: boolean) => void;
}

const numberFormatter = new Intl.NumberFormat("en-US");

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function SeasonDraftReviewStep({
  careerId,
  transitionId,
  onBack,
  onEditRetentions,
  onEditDraft,
  onEditBalances,
  onConfirmed,
  onConfirmingChange,
}: SeasonDraftReviewStepProps) {
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useSeasonDraftReview(
    careerId,
    transitionId,
  );

  const {
    isConfirming,
    errorMessage: confirmationError,
    confirm,
    clearError,
  } = useConfirmSeasonDraft();

  const submittingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasUnavailableWrestlers =
    (data?.unavailable_draft_keys.length ?? 0) > 0;

  const hasMissingBalances =
    data !== null &&
    data !== undefined &&
    ((data.finances_enabled && data.starting_money === null) ||
      (data.fans_enabled && data.starting_fans === null));

  const canConfirm =
    Boolean(data) &&
    !isLoading &&
    !errorMessage &&
    !isConfirming &&
    !hasUnavailableWrestlers &&
    !hasMissingBalances;

  function handleRefresh() {
    if (submittingRef.current) return;

    clearError();
    retry();
  }

  async function handleConfirm() {
    if (!data || !canConfirm || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      onConfirmingChange?.(true);

      const result = await confirm({
        careerId,
        transitionId,
        expectedReview: data,
      });

      if (result && mountedRef.current) {
        onConfirmed(result);
      }
    } finally {
      submittingRef.current = false;

      if (mountedRef.current) {
        onConfirmingChange?.(false);
      }
    }
  }

  return (
    <section
      className="season-draft-review-step"
      aria-labelledby={headingId}
      aria-busy={isLoading || isConfirming}
    >
      <header className="season-draft-review-step__header">
        <div>
          <h2 id={headingId}>Review & confirm</h2>

          <p>
            Review your roster, championship changes and starting balances
            before opening the new season.
          </p>
        </div>

        <button
          className="season-draft-review-step__button"
          type="button"
          disabled={isLoading || isConfirming}
          onClick={handleRefresh}
        >
          Refresh review
        </button>
      </header>

      {isLoading && (
        <p className="season-draft-review-step__message" role="status">
          Loading season draft review…
        </p>
      )}

      {!isLoading && errorMessage && (
        <div className="season-draft-review-step__state">
          <p className="season-draft-review-step__error" role="alert">
            {errorMessage}
          </p>

          <button
            className="season-draft-review-step__button"
            type="button"
            disabled={isConfirming}
            onClick={handleRefresh}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && data && (
        <fieldset
          className="season-draft-review-step__fields"
          disabled={isConfirming}
        >
          <legend>Season {data.transition.to_season}</legend>

          <SeasonDraftRosterReview
            roster={data.roster}
            disabled={isConfirming}
            onEditRetentions={onEditRetentions}
            onEditDraft={onEditDraft}
          />

          {hasUnavailableWrestlers && (
            <div className="season-draft-review-step__state">
              <p className="season-draft-review-step__error" role="alert">
                Some selected wrestlers are no longer available. Update your
                draft selections before confirming.
              </p>

              <button
                className="season-draft-review-step__button"
                type="button"
                onClick={onEditDraft}
              >
                Edit draft roster
              </button>
            </div>
          )}

          <SeasonDraftEffectsReview
            championships={data.championships}
            rivalries={data.rivalries}
          />

          {(data.finances_enabled || data.fans_enabled) && (
            <section className="season-draft-review-step__balances">
              <header>
                <h3>Starting balances</h3>

                <button
                  className="season-draft-review-step__button"
                  type="button"
                  onClick={onEditBalances}
                >
                  Edit balances
                </button>
              </header>

              <dl className="season-draft-review-step__totals">
                {data.finances_enabled && (
                  <div>
                    <dt>Budget</dt>

                    <dd>
                      {data.starting_money === null
                        ? "Not recorded"
                        : moneyFormatter.format(BigInt(data.starting_money))}
                    </dd>
                  </div>
                )}

                {data.fans_enabled && (
                  <div>
                    <dt>Fans</dt>

                    <dd>
                      {data.starting_fans === null
                        ? "Not recorded"
                        : numberFormatter.format(BigInt(data.starting_fans))}
                    </dd>
                  </div>
                )}
              </dl>

              <p className="season-draft-review-step__message">
                These will be your total balances after the draft.
              </p>

              {hasMissingBalances && (
                <p className="season-draft-review-step__error" role="alert">
                  Enter all enabled starting balances before confirming.
                </p>
              )}
            </section>
          )}

          <p className="season-draft-review-step__message">
            Confirming closes the previous season’s contracts and opens fresh
            draft contracts for your selected roster. Remaining weeks from
            previous contracts do not carry over.
          </p>

          {confirmationError && (
            <p className="season-draft-review-step__error" role="alert">
              {confirmationError}
            </p>
          )}

          {isConfirming && (
            <p className="season-draft-review-step__message" role="status">
              Confirming season draft…
            </p>
          )}

          <div className="season-draft-review-step__actions">
            <button
              className="season-draft-review-step__button"
              type="button"
              onClick={onBack}
            >
              Back
            </button>

            <button
              className="season-draft-review-step__button season-draft-review-step__button--primary"
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              {isConfirming
                ? "Confirming…"
                : `Confirm & start season ${data.transition.to_season}`}
            </button>
          </div>
        </fieldset>
      )}
    </section>
  );
}
