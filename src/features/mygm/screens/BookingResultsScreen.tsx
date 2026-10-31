import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingResultsReview from "../components/booking/BookingResultsReview";
import BookingResultsStepper from "../components/booking/BookingResultsStepper";
import FeudResultsEditor from "../components/booking/FeudResultsEditor";
import MatchResultsEditor from "../components/booking/MatchResultsEditor";
import PromoResultsEditor from "../components/booking/PromoResultsEditor";
import ShowResultsEditor from "../components/booking/ShowResultsEditor";
import { useBookingActiveFeuds } from "../hooks/useBookingActiveFeuds";
import { useBookingMatchRatings } from "../hooks/useBookingMatchRatings";
import { useBookingPromoRatings } from "../hooks/useBookingPromoRatings";
import { useBookingPromoWrestlerStates } from "../hooks/useBookingPromoWrestlerStates";
import { useBookingResultsDraft } from "../hooks/useBookingResultsDraft";
import { useCloseBookingShow } from "../hooks/useCloseBookingShow";
import { useMyGmBooking } from "../hooks/useMyGmBooking";
import {
  getBookingFeudContexts,
  getBookingFeudResultsError,
} from "../rules/bookingFeudResultsRules";
import { getPromoAutomaticEffect } from "../rules/promoAutomaticEffectsRules";
import {
  getPromoEffectField,
  isValidPromoEffectAmount,
} from "../rules/promoResultsRules";
import type {
  BookingSegmentSummary,
  MyGmBookingData,
} from "../types/booking.types";
import type {
  BookingResultsStep,
  BookingResultsStepId,
} from "../types/bookingResults.types";
import type { MyGmOutletContext } from "../types/mygm.types";
import "./BookingResultsScreen.scss";
import { getShowFinalBalance } from "../rules/showResultsRules";

interface BookingResultsFlowProps {
  careerId: string;
  booking: MyGmBookingData;
  onShowClosed: () => void;
}

function getSegmentNavigationLabel(segment: BookingSegmentSummary): string {
  const label = segment.kind === "match" ? "Match" : segment.label;

  const participants = segment.participants
    .map((participant) => participant.name)
    .join(" / ");

  return `${segment.position}. ${label} — ${participants}`;
}

function BookingResultsFlow({
  careerId,
  booking,
  onShowClosed,
}: BookingResultsFlowProps) {
  const orderedSegments = [...booking.segments].sort(
    (first, second) => first.position - second.position,
  );

  const [currentStep, setCurrentStep] =
    useState<BookingResultsStepId>("segments");

  const [currentSegmentId, setCurrentSegmentId] = useState(
    () => orderedSegments[0]?.id ?? "",
  );

  const {
    ratings: matchRatings,
    isLoading: isLoadingMatchRatings,
    errorMessage: matchRatingsError,
    retry: retryMatchRatings,
  } = useBookingMatchRatings();

  const {
    ratings: promoRatings,
    isLoading: isLoadingPromoRatings,
    errorMessage: promoRatingsError,
    retry: retryPromoRatings,
  } = useBookingPromoRatings();

  const {
    draft,
    isLoadingDraft,
    storageError,
    updateMatchResult,
    updatePromoResult,
    updateShowResult,
    updateFeudResult,
    clearDraft,
  } = useBookingResultsDraft(careerId, booking.event.id, booking.segments);

  const {
    feuds,
    isLoading: isLoadingFeuds,
    errorMessage: feudsError,
    retry: retryFeuds,
  } = useBookingActiveFeuds(careerId, booking.event.id);

  const {
    wrestlers: promoWrestlers,
    isLoading: isLoadingPromoWrestlers,
    errorMessage: promoWrestlersError,
    retry: retryPromoWrestlers,
  } = useBookingPromoWrestlerStates(careerId, booking.segments);

  const {
    isClosing,
    errorMessage: closeError,
    closeShow,
  } = useCloseBookingShow();

  const feudContexts = getBookingFeudContexts(
    orderedSegments,
    draft.feuds,
    feuds,
    booking.current_tick,
  );

  const hasPromos = orderedSegments.some((segment) => segment.kind === "promo");

  const isLoading =
    isLoadingMatchRatings ||
    (hasPromos && isLoadingPromoRatings) ||
    isLoadingDraft ||
    isLoadingFeuds ||
    isLoadingPromoWrestlers;

  const resultsError =
    matchRatingsError ||
    (hasPromos ? promoRatingsError : "") ||
    feudsError ||
    promoWrestlersError;

  function isSegmentComplete(segment: BookingSegmentSummary): boolean {
    const segmentFeuds = feudContexts.get(segment.id) ?? feuds;

    const feudError = getBookingFeudResultsError(
      segment,
      draft.feuds[segment.id],
      segmentFeuds,
    );

    if (feudError !== null) {
      return false;
    }

    if (segment.kind === "promo") {
      const result = draft.promos[segment.id];

      const hasRating =
        result?.ratingId != null &&
        promoRatings.some((rating) => rating.id === result.ratingId);

      const automaticEffect = getPromoAutomaticEffect(segment, promoWrestlers);

      const effectField = getPromoEffectField(
        segment.promo_type_id,
        booking.finances_enabled,
        booking.fans_enabled,
      );

      const hasRequiredEffect =
        effectField === null ||
        isValidPromoEffectAmount(
          result?.effects?.[effectField] ?? "",
          segment.promo_type_id !== "invasion",
        );

      return (
        hasRating && hasRequiredEffect && automaticEffect.status !== "invalid"
      );
    }

    const result = draft.matches[segment.id];

    return (
      result?.winningSide != null &&
      result.ratingStars != null &&
      segment.participants.some(
        (participant) => participant.side === result.winningSide,
      ) &&
      matchRatings.some((rating) => rating.stars === result.ratingStars)
    );
  }

  const completedCount = orderedSegments.filter(isSegmentComplete).length;

  const allSegmentsComplete =
    orderedSegments.length > 0 && completedCount === orderedSegments.length;

  const matches = orderedSegments.filter((segment) => segment.kind === "match");

  const allMatchRatingsComplete =
    matches.length > 0 &&
    matches.every((segment) => {
      const stars = draft.matches[segment.id]?.ratingStars;

      return (
        stars != null && matchRatings.some((rating) => rating.stars === stars)
      );
    });

  const showRating = allMatchRatingsComplete
    ? matches.reduce(
        (total, segment) =>
          total + (draft.matches[segment.id]?.ratingStars ?? 0),
        0,
      ) / matches.length
    : null;

  const finalMoney = getShowFinalBalance(
    booking.budget_available,
    draft.show.moneyChange,
  );

  const finalFans = getShowFinalBalance(
    booking.fans_available,
    draft.show.fansChange,
  );

  const isMoneyComplete = !booking.finances_enabled || finalMoney !== null;

  const isFansComplete = !booking.fans_enabled || finalFans !== null;

  const isShowComplete =
    showRating !== null && isMoneyComplete && isFansComplete;

  const hasInvalidMoney =
    booking.finances_enabled &&
    draft.show.moneyChange !== "" &&
    finalMoney === null;

  const hasInvalidFans =
    booking.fans_enabled && draft.show.fansChange !== "" && finalFans === null;

  const steps: BookingResultsStep[] = [
    {
      id: "segments",
      label: "Segment results",
      isComplete: allSegmentsComplete,
      isAvailable: true,
    },
    {
      id: "show",
      label: "Show results",
      isComplete: isShowComplete,
      isAvailable: allSegmentsComplete,
    },
    {
      id: "review",
      label: "Review & close",
      isComplete: false,
      isAvailable: allSegmentsComplete && isShowComplete,
    },
  ];

  const selectedIndex = orderedSegments.findIndex(
    (segment) => segment.id === currentSegmentId,
  );

  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const currentSegment = orderedSegments[currentIndex];

  const previousSegment =
    currentIndex > 0 ? orderedSegments[currentIndex - 1] : undefined;

  const nextSegment = orderedSegments[currentIndex + 1];

  const isCurrentSegmentComplete = currentSegment
    ? isSegmentComplete(currentSegment)
    : false;

  function handleStepChange(stepId: BookingResultsStepId) {
    const step = steps.find((item) => item.id === stepId);

    if (isLoading || isClosing || resultsError || !step?.isAvailable) {
      return;
    }

    setCurrentStep(stepId);
  }

  function handleSegmentChange(segmentId: string) {
    if (
      isLoading ||
      isClosing ||
      resultsError ||
      !orderedSegments.some((segment) => segment.id === segmentId)
    ) {
      return;
    }

    setCurrentSegmentId(segmentId);
  }

  function handleEditSegment(segmentId: string) {
    if (
      isLoading ||
      isClosing ||
      resultsError ||
      !orderedSegments.some((segment) => segment.id === segmentId)
    ) {
      return;
    }

    setCurrentSegmentId(segmentId);
    setCurrentStep("segments");
  }

  function retryRatings() {
    if (isClosing) {
      return;
    }

    retryMatchRatings();
    retryFeuds();
    retryPromoWrestlers();

    if (hasPromos) {
      retryPromoRatings();
    }
  }

  async function handleCloseShow() {
    if (
      isLoading ||
      isClosing ||
      resultsError ||
      !allSegmentsComplete ||
      !isShowComplete
    ) {
      return;
    }

    const success = await closeShow({
      careerId,
      eventId: booking.event.id,
      currentMoney: booking.budget_available,
      currentFans: booking.fans_available,
      draft,
    });

    if (!success) {
      return;
    }

    clearDraft();
    onShowClosed();
  }

  return (
    <fieldset
      className="booking-results-screen__flow"
      disabled={isClosing}
      aria-label="Show results"
      aria-busy={isClosing}
    >
      <BookingResultsStepper
        steps={steps}
        currentStep={currentStep}
        disabled={isLoading || isClosing || Boolean(resultsError)}
        onStepChange={handleStepChange}
      />

      <p className="booking-results-screen__draft-notice">
        {isLoadingDraft
          ? "Loading your results draft…"
          : storageError
            ? "Results are applied when you close the show. Check the draft storage warning below."
            : "Your draft is saved on this device. Results are applied when you close the show."}
      </p>

      <section
        className="booking-results-screen__panel"
        aria-busy={isLoading || isClosing}
      >
        {storageError && (
          <p className="booking-results-screen__warning" role="alert">
            {storageError}
          </p>
        )}

        {isLoading && (
          <p className="booking-results-screen__message" role="status">
            Loading results…
          </p>
        )}

        {!isLoading && resultsError && (
          <div role="alert">
            <p className="booking-results-screen__error">{resultsError}</p>

            <button
              className="booking-results-screen__button"
              type="button"
              onClick={retryRatings}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !resultsError && currentStep === "segments" && (
          <>
            {currentSegment ? (
              <>
                <div className="booking-results-screen__segment-navigation">
                  <label className="booking-results-screen__segment-picker">
                    <span>Segment</span>

                    <select
                      value={currentSegment.id}
                      onChange={(event) =>
                        handleSegmentChange(event.target.value)
                      }
                    >
                      {orderedSegments.map((segment) => (
                        <option key={segment.id} value={segment.id}>
                          {getSegmentNavigationLabel(segment)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p className="booking-results-screen__segment-count">
                    Segment {currentIndex + 1} of {orderedSegments.length}
                  </p>
                </div>

                <div className="booking-results-screen__progress">
                  <div role="status">
                    <span>Segment results complete</span>
                    <strong>
                      {completedCount} / {orderedSegments.length}
                    </strong>
                  </div>

                  <progress
                    value={completedCount}
                    max={Math.max(1, orderedSegments.length)}
                    aria-label="Completed segment results"
                  />
                </div>

                {currentSegment.kind === "match" ? (
                  <MatchResultsEditor
                    segments={[currentSegment]}
                    ratings={matchRatings}
                    results={draft.matches}
                    disabled={isClosing}
                    onResultChange={updateMatchResult}
                  />
                ) : (
                  <PromoResultsEditor
                    segments={[currentSegment]}
                    ratings={promoRatings}
                    results={draft.promos}
                    wrestlers={promoWrestlers}
                    financesEnabled={booking.finances_enabled}
                    fansEnabled={booking.fans_enabled}
                    disabled={isClosing}
                    onResultChange={updatePromoResult}
                  />
                )}

                <FeudResultsEditor
                  segment={currentSegment}
                  feuds={feudContexts.get(currentSegment.id) ?? feuds}
                  result={draft.feuds[currentSegment.id]}
                  disabled={isClosing}
                  onResultChange={(result) =>
                    updateFeudResult(currentSegment.id, result)
                  }
                />

                {!isCurrentSegmentComplete ? (
                  <p className="booking-results-screen__navigation-hint">
                    Complete this segment’s result and rivalry settings to
                    continue.
                  </p>
                ) : !nextSegment && !allSegmentsComplete ? (
                  <p className="booking-results-screen__navigation-hint">
                    Some earlier segments still need attention. Use the segment
                    selector to return to them.
                  </p>
                ) : null}

                <div className="booking-results-screen__navigation">
                  <button
                    className="booking-results-screen__button"
                    type="button"
                    disabled={isClosing || !previousSegment}
                    onClick={() => {
                      if (previousSegment) {
                        handleSegmentChange(previousSegment.id);
                      }
                    }}
                  >
                    Previous segment
                  </button>

                  {nextSegment ? (
                    <button
                      className="booking-results-screen__button booking-results-screen__button--primary"
                      type="button"
                      disabled={isClosing || !isCurrentSegmentComplete}
                      onClick={() => handleSegmentChange(nextSegment.id)}
                    >
                      Next segment
                    </button>
                  ) : (
                    <button
                      className="booking-results-screen__button booking-results-screen__button--primary"
                      type="button"
                      disabled={isClosing || !allSegmentsComplete}
                      onClick={() => handleStepChange("show")}
                    >
                      Continue to show results
                    </button>
                  )}
                </div>

                {allSegmentsComplete && (
                  <p className="booking-results-screen__message" role="status">
                    All segment results are complete.
                  </p>
                )}
              </>
            ) : (
              <p className="booking-results-screen__message">
                No segments are available for this show.
              </p>
            )}
          </>
        )}

        {!isLoading && !resultsError && currentStep === "show" && (
          <>
            <ShowResultsEditor
              showRating={showRating}
              result={draft.show}
              currentMoney={booking.budget_available}
              currentFans={booking.fans_available}
              financesEnabled={booking.finances_enabled}
              fansEnabled={booking.fans_enabled}
              disabled={isClosing}
              onResultChange={updateShowResult}
            />

            {hasInvalidMoney && (
              <p className="booking-results-screen__error" role="alert">
                Enter a valid whole-number change. The resulting balance must
                remain within the supported range and cannot be negative.
              </p>
            )}

            {hasInvalidFans && (
              <p className="booking-results-screen__error" role="alert">
                Enter a valid whole-number change. The resulting fan total must
                remain within the supported range and cannot be negative.
              </p>
            )}

            <div className="booking-results-screen__navigation">
              <button
                className="booking-results-screen__button"
                type="button"
                disabled={isClosing}
                onClick={() => handleStepChange("segments")}
              >
                Back to segment results
              </button>

              <button
                className="booking-results-screen__button booking-results-screen__button--primary"
                type="button"
                disabled={isClosing || !allSegmentsComplete || !isShowComplete}
                onClick={() => handleStepChange("review")}
              >
                Review results
              </button>
            </div>

            {!isShowComplete && (
              <p className="booking-results-screen__navigation-hint">
                Complete the required show results before reviewing.
              </p>
            )}
          </>
        )}

        {!isLoading && !resultsError && currentStep === "review" && (
          <>
            <BookingResultsReview
              booking={booking}
              draft={draft}
              showRating={showRating}
              matchRatings={matchRatings}
              promoRatings={promoRatings}
              feuds={feuds}
              wrestlers={promoWrestlers}
              onEditSegment={handleEditSegment}
              onEditShow={() => handleStepChange("show")}
            />

            {closeError && (
              <p className="booking-results-screen__error" role="alert">
                {closeError}
              </p>
            )}

            {isClosing && (
              <p className="booking-results-screen__message" role="status">
                Closing show and updating your career…
              </p>
            )}

            <div className="booking-results-screen__closing-notice">
              <strong>Close this show and advance one week</strong>
              <p>
                This applies the results to your career. Completed results
                cannot be edited.
              </p>
            </div>

            <div className="booking-results-screen__navigation">
              <button
                className="booking-results-screen__button"
                type="button"
                disabled={isClosing || !allSegmentsComplete}
                onClick={() => handleStepChange("show")}
              >
                Back to show results
              </button>

              <button
                className="booking-results-screen__button booking-results-screen__button--primary"
                type="button"
                disabled={isClosing || !allSegmentsComplete || !isShowComplete}
                onClick={() => void handleCloseShow()}
              >
                {isClosing ? "Closing show…" : "Close show & advance week"}
              </button>
            </div>
          </>
        )}
      </section>
    </fieldset>
  );
}

export default function BookingResultsScreen() {
  const { career, refreshCareer } = useOutletContext<MyGmOutletContext>();

  const navigate = useNavigate();

  const {
    data: booking,
    isLoading,
    errorMessage,
    refreshBooking,
  } = useMyGmBooking(career.id);

  const bookingPath = `/mygm/${career.id}/booking`;

  function handleShowClosed() {
    refreshCareer();

    navigate(`/mygm/${career.id}`, {
      replace: true,
    });
  }

  if (!isLoading && !errorMessage && booking?.event.status === "draft") {
    return <Navigate to={bookingPath} replace />;
  }

  return (
    <section
      className="booking-results-screen"
      aria-label="Record show results"
    >
      <header className="booking-results-screen__header">
        <Link className="booking-results-screen__back-link" to={bookingPath}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to booking
        </Link>

        {booking && (
          <p className="booking-results-screen__eyebrow">
            {booking.event.name}
          </p>
        )}

        <h1>Record results</h1>

        <p className="booking-results-screen__description">
          Record segment results, review your show and close the week.
        </p>
      </header>

      {isLoading && (
        <p className="booking-results-screen__message" role="status">
          Loading show…
        </p>
      )}

      {!isLoading && errorMessage && (
        <section className="booking-results-screen__panel" role="alert">
          <p className="booking-results-screen__error">{errorMessage}</p>

          <button
            className="booking-results-screen__button"
            type="button"
            onClick={() => refreshBooking()}
          >
            Try again
          </button>
        </section>
      )}

      {!isLoading && !errorMessage && booking?.event.status === "confirmed" && (
        <BookingResultsFlow
          key={`${career.id}:${booking.event.id}`}
          careerId={career.id}
          booking={booking}
          onShowClosed={handleShowClosed}
        />
      )}

      {!isLoading && !errorMessage && booking?.event.status === "completed" && (
        <section className="booking-results-screen__panel">
          <p className="booking-results-screen__message">
            This show has already been completed. Its results cannot be edited.
          </p>
        </section>
      )}
    </section>
  );
}
