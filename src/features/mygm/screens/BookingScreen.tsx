import { useId, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Swords,
} from "lucide-react";

import BookingEditorModal from "../components/booking/BookingEditorModal";
import MatchEditor from "../components/booking/MatchEditor";
import PromoEditor from "../components/booking/PromoEditor";

import { useBookingConfirmation } from "../hooks/useBookingConfirmation";
import { useDeleteBookingSegment } from "../hooks/useDeleteBookingSegment";
import { useMoveBookingSegment } from "../hooks/useMoveBookingSegment";
import { useMyGmBooking } from "../hooks/useMyGmBooking";
import { getBookingCardIssues } from "../rules/bookingRules";

import type {
  BookingEventStatus,
  BookingSegmentSummary,
} from "../types/booking.types";
import type { MyGmOutletContext } from "../types/mygm.types";
import BookingSegmentCard from "../components/booking/BookingSegmentCard";

import "./BookingScreen.scss";

interface BookingEditorState {
  kind: "match" | "promo";
  segmentId?: string;
}

const showTypeLabels = {
  weekly: "Weekly show",
  go_home: "Go Home show",
  ple: "PLE",
};

const statusLabels: Record<BookingEventStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  completed: "Completed",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatSegmentCost(value: string): string {
  return currencyFormatter.format(BigInt(value));
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

function getSegmentParticipantsLabel(segment: BookingSegmentSummary): string {
  if (segment.kind === "match") {
    const teams = new Map<number, string[]>();

    for (const participant of segment.participants) {
      const team = teams.get(participant.side) ?? [];

      team.push(participant.name);
      teams.set(participant.side, team);
    }

    return (
      [...teams.entries()]
        .sort(([firstSide], [secondSide]) => firstSide - secondSide)
        .map(([, names]) => names.join(" & "))
        .join(" vs ") || "Participants unavailable"
    );
  }

  const initiators = segment.participants
    .filter((participant) => participant.role === "initiator")
    .map((participant) => participant.name)
    .join(" & ");

  const targets = segment.participants
    .filter((participant) => participant.role === "target")
    .map((participant) => participant.name)
    .join(" & ");

  return (
    [initiators, targets].filter(Boolean).join(" → ") ||
    "Participants unavailable"
  );
}

export default function BookingScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  const headingId = useId();
  const readinessId = useId();

  const {
    data,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshError,
    refreshBooking,
  } = useMyGmBooking(career.id);

  const [editor, setEditor] = useState<BookingEditorState | null>(null);
  const [isEditorSaving, setIsEditorSaving] = useState(false);
  const [segmentToDelete, setSegmentToDelete] =
    useState<BookingSegmentSummary | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const {
    isDeleting,
    errorMessage: deleteError,
    deleteSegment: removeSegment,
    clearError: clearDeleteError,
  } = useDeleteBookingSegment();

  const {
    isMoving,
    movingSegmentId,
    movingDirection,
    errorMessage: moveError,
    moveSegment: moveBookingSegment,
  } = useMoveBookingSegment();

  const {
    isSubmitting: isUpdatingStatus,
    pendingAction,
    errorMessage: confirmationError,
    confirmCard,
    reopenCard,
    clearError: clearConfirmationError,
  } = useBookingConfirmation();

  const matchCount =
    data?.segments.filter((segment) => segment.kind === "match").length ?? 0;

  const promoCount =
    data?.segments.filter((segment) => segment.kind === "promo").length ?? 0;

  const exceedsBudget =
    data !== null &&
    data.finances_enabled &&
    BigInt(data.total_cost) > BigInt(data.budget_available);

  const cardIssues = data ? getBookingCardIssues(data) : [];

  const isBookingBusy =
    isMoving ||
    isRefreshing ||
    isDeleting ||
    isEditorSaving ||
    isUpdatingStatus;

  const canConfirm =
    data?.event.status === "draft" &&
    cardIssues.length === 0 &&
    !exceedsBudget &&
    !isBookingBusy;

  const readinessMessage = isBookingBusy
    ? "Please wait while your card is updated."
    : exceedsBudget
      ? "Reduce the card cost to fit your available budget."
      : cardIssues.length > 0
        ? "Resolve the requirements below before confirming."
        : "Your card is ready to confirm.";

  function closeEditor() {
    if (isEditorSaving) return;
    setEditor(null);
  }

  function openNewSegment(kind: "match" | "promo") {
    if (!data || data.event.status !== "draft" || isBookingBusy) return;

    const limitReached =
      kind === "match"
        ? matchCount >= data.limits.max_matches
        : promoCount >= data.limits.max_promos;

    if (limitReached) return;

    setEditor({ kind });
  }

  function openSegmentEditor(segment: BookingSegmentSummary) {
    if (isBookingBusy) return;

    setEditor({
      kind: segment.kind,
      segmentId: segment.id,
    });
  }

  function handleSegmentSaved() {
    setEditor(null);
    setIsEditorSaving(false);
    refreshBooking();
  }

  function requestSegmentDeletion(segment: BookingSegmentSummary) {
    if (isBookingBusy) return;

    clearDeleteError();
    setSegmentToDelete(segment);
  }

  function closeDeleteConfirmation() {
    if (isDeleting) return;

    setSegmentToDelete(null);
    clearDeleteError();
  }

  async function confirmSegmentDeletion() {
    if (!data || !segmentToDelete || isBookingBusy) return;

    const wasDeleted = await removeSegment(
      career.id,
      data.event.id,
      segmentToDelete.id,
    );

    if (wasDeleted) {
      setSegmentToDelete(null);
      refreshBooking();
    }
  }

  async function handleSegmentMove(
    segmentId: string,
    direction: "up" | "down",
  ) {
    if (!data || data.event.status !== "draft" || isBookingBusy) return;

    const wasMoved = await moveBookingSegment(
      career.id,
      data.event.id,
      segmentId,
      direction,
    );

    if (wasMoved) {
      refreshBooking();
    }
  }

  function openCardConfirmation() {
    if (!canConfirm) return;

    clearConfirmationError();
    setIsConfirmationOpen(true);
  }

  function closeCardConfirmation() {
    if (isUpdatingStatus) return;

    setIsConfirmationOpen(false);
    clearConfirmationError();
  }

  async function handleConfirmCard() {
    if (!data || !canConfirm) return;

    const wasConfirmed = await confirmCard(career.id, data.event.id);

    if (wasConfirmed) {
      setIsConfirmationOpen(false);
      refreshBooking();
    }
  }

  async function handleReopenCard() {
    if (!data || data.event.status !== "confirmed" || isBookingBusy) return;

    const wasReopened = await reopenCard(career.id, data.event.id);

    if (wasReopened) {
      refreshBooking();
    }
  }

  return (
    <section className="booking-screen" aria-labelledby={headingId}>
      <header className="booking-screen__header">
        <div>
          <p className="booking-screen__eyebrow">
            {data ? showTypeLabels[data.show_type] : "Your next show"}
          </p>

          <h1 id={headingId}>Booking</h1>

          <p className="booking-screen__description">
            Build your card, confirm it and record the results.
          </p>
        </div>

        {data && (
          <button
            className="booking-screen__button booking-screen__refresh"
            type="button"
            disabled={isBookingBusy || isLoading}
            aria-label="Refresh booking"
            onClick={refreshBooking}
          >
            <RefreshCw size={17} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        )}
      </header>

      {isLoading && (
        <p
          className="booking-screen__state booking-screen__loading"
          role="status"
        >
          <LoaderCircle
            className="booking-screen__spinner"
            size={20}
            aria-hidden="true"
          />
          Opening your show…
        </p>
      )}

      {errorMessage && (
        <section className="booking-screen__state">
          <p role="alert">{errorMessage}</p>

          <button
            className="booking-screen__button"
            type="button"
            onClick={refreshBooking}
          >
            Try again
          </button>
        </section>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          <section
            className="booking-screen__summary"
            aria-label="Show overview"
          >
            <div className="booking-screen__show-heading">
              <div>
                <p className="booking-screen__period">
                  {formatPeriod(data.event.tick)}
                </p>
                <h2>{data.event.name}</h2>
              </div>

              <span
                className={`booking-screen__status booking-screen__status--${data.event.status}`}
              >
                {statusLabels[data.event.status]}
              </span>
            </div>

            <dl className="booking-screen__metrics">
              <div>
                <dt>Matches</dt>
                <dd>
                  {matchCount}
                  <span> / {data.limits.max_matches}</span>
                </dd>
              </div>

              <div>
                <dt>Promos</dt>
                <dd>
                  {promoCount}
                  <span> / {data.limits.max_promos}</span>
                </dd>
              </div>

              {data.finances_enabled && (
                <>
                  <div>
                    <dt>Card cost</dt>
                    <dd
                      className={
                        exceedsBudget
                          ? "booking-screen__over-budget"
                          : undefined
                      }
                    >
                      {formatSegmentCost(data.total_cost)}
                    </dd>
                  </div>

                  <div>
                    <dt>Available budget</dt>
                    <dd>{formatSegmentCost(data.budget_available)}</dd>
                  </div>
                </>
              )}
            </dl>

            <details className="booking-screen__rules">
              <summary>
                Show requirements
                <ChevronDown size={15} aria-hidden="true" />
              </summary>

              <ul>
                <li>
                  {data.limits.min_matches === data.limits.max_matches
                    ? `Exactly ${data.limits.min_matches} matches.`
                    : `${data.limits.min_matches}–${data.limits.max_matches} matches.`}
                </li>
                <li>Up to {data.limits.max_promos} optional promos.</li>
                <li>
                  {data.limits.must_start_with_match
                    ? "The opening segment must be a match."
                    : "The opening segment can be a match or promo."}
                </li>
                <li>
                  {data.limits.must_end_with_match
                    ? "The final segment must be a match."
                    : "The final segment can be a match or promo."}
                </li>
              </ul>
            </details>
          </section>

          {data.event.status !== "draft" && (
            <div className="booking-screen__notice">
              <ShieldCheck size={19} aria-hidden="true" />
              <p>
                {data.event.status === "confirmed"
                  ? "Your card is confirmed. Record the results after playing your show, or reopen the card to make changes."
                  : "This show is completed. Its card can no longer be edited."}
              </p>
            </div>
          )}

          <section
            className="booking-screen__workspace"
            aria-label="Match card"
          >
            <header className="booking-screen__card-heading">
              <div>
                <h2>Match card</h2>
                <p>
                  {data.segments.length}{" "}
                  {data.segments.length === 1 ? "segment" : "segments"}
                  {data.event.status === "draft" && " · Shown in running order"}
                </p>
              </div>
            </header>

            {data.event.status === "draft" && (
              <div className="booking-screen__add-controls">
                <div>
                  <button
                    className="booking-screen__button booking-screen__button--accent"
                    type="button"
                    disabled={
                      isBookingBusy || matchCount >= data.limits.max_matches
                    }
                    onClick={() => openNewSegment("match")}
                  >
                    <Plus size={17} aria-hidden="true" />
                    Add match
                  </button>

                  <span>
                    {matchCount >= data.limits.max_matches
                      ? "Match limit reached"
                      : `${data.limits.max_matches - matchCount} available`}
                  </span>
                </div>

                <div>
                  <button
                    className="booking-screen__button"
                    type="button"
                    disabled={
                      isBookingBusy || promoCount >= data.limits.max_promos
                    }
                    onClick={() => openNewSegment("promo")}
                  >
                    <Plus size={17} aria-hidden="true" />
                    Add promo
                  </button>

                  <span>
                    {promoCount >= data.limits.max_promos
                      ? "Promo limit reached"
                      : `${data.limits.max_promos - promoCount} available`}
                  </span>
                </div>
              </div>
            )}

            {(isMoving || isRefreshing) && (
              <p className="booking-screen__updating" role="status">
                <LoaderCircle
                  className="booking-screen__spinner"
                  size={16}
                  aria-hidden="true"
                />
                Updating card…
              </p>
            )}

            {refreshError && (
              <div className="booking-screen__error">
                <p role="alert">{refreshError}</p>
                <button
                  className="booking-screen__button"
                  type="button"
                  disabled={isBookingBusy}
                  onClick={refreshBooking}
                >
                  Refresh card
                </button>
              </div>
            )}

            {moveError && (
              <p className="booking-screen__error" role="alert">
                {moveError}
              </p>
            )}

            {confirmationError && !isConfirmationOpen && (
              <p className="booking-screen__error" role="alert">
                {confirmationError}
              </p>
            )}

            {data.segments.length === 0 ? (
              <div className="booking-screen__empty">
                <Swords size={32} strokeWidth={1.25} aria-hidden="true" />
                <h3>Your show starts here</h3>
                <p>
                  {data.event.status === "draft"
                    ? "Add your opening match, then build the rest of the card."
                    : "No segments are recorded for this show."}
                </p>
              </div>
            ) : (
              <ol
                className="booking-screen__segment-list"
                aria-label="Segments in running order"
                aria-busy={isMoving || isRefreshing}
              >
                {data.segments.map((segment, index) => (
                  <li key={segment.id}>
                    <BookingSegmentCard
                      segment={segment}
                      financesEnabled={data.finances_enabled}
                      editable={data.event.status === "draft"}
                      isBusy={isBookingBusy}
                      isFirst={index === 0}
                      isLast={index === data.segments.length - 1}
                      movingDirection={
                        movingSegmentId === segment.id ? movingDirection : null
                      }
                      onMove={(direction) =>
                        handleSegmentMove(segment.id, direction)
                      }
                      onEdit={() => openSegmentEditor(segment)}
                      onDelete={() => requestSegmentDeletion(segment)}
                    />
                  </li>
                ))}
              </ol>
            )}

            {data.event.status === "draft" && (
              <footer className="booking-screen__review">
                <div
                  className={`booking-screen__readiness${
                    cardIssues.length === 0 && !exceedsBudget
                      ? " booking-screen__readiness--ready"
                      : ""
                  }`}
                >
                  <div className="booking-screen__readiness-heading">
                    {cardIssues.length === 0 && !exceedsBudget ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <CircleAlert size={18} aria-hidden="true" />
                    )}

                    <h3>
                      {cardIssues.length === 0 && !exceedsBudget
                        ? "Ready for your show"
                        : "Before you confirm"}
                    </h3>
                  </div>

                  <p id={readinessId}>{readinessMessage}</p>

                  {(cardIssues.length > 0 || exceedsBudget) && (
                    <ul>
                      {cardIssues.map((issue) => (
                        <li key={issue.code}>{issue.message}</li>
                      ))}

                      {exceedsBudget && (
                        <li>The card exceeds your available budget.</li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="booking-screen__finish">
                  <p>
                    Confirming locks editing until you reopen the card. It does
                    not charge the card cost or advance the week.
                  </p>

                  <button
                    className="booking-screen__button booking-screen__button--accent"
                    type="button"
                    disabled={!canConfirm}
                    aria-describedby={readinessId}
                    onClick={openCardConfirmation}
                  >
                    Confirm card
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                </div>
              </footer>
            )}

            {data.event.status === "confirmed" && (
              <footer className="booking-screen__finish booking-screen__finish--confirmed">
                <button
                  className="booking-screen__button"
                  type="button"
                  disabled={isBookingBusy}
                  onClick={handleReopenCard}
                >
                  {pendingAction === "reopen" ? "Reopening…" : "Reopen card"}
                </button>

                <Link
                  className="booking-screen__button booking-screen__button--accent"
                  to={`/mygm/${career.id}/booking/results`}
                  aria-disabled={isBookingBusy}
                  onClick={(event) => {
                    if (isBookingBusy) {
                      event.preventDefault();
                    }
                  }}
                >
                  Record results
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </footer>
            )}

            {data.event.status === "completed" && (
              <footer className="booking-screen__finish">
                <Link
                  className="booking-screen__button"
                  to={`/mygm/${career.id}/history/${data.event.id}`}
                >
                  View show results
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </footer>
            )}
          </section>

          {editor && data.event.status === "draft" && (
            <BookingEditorModal
              title={
                editor.kind === "match"
                  ? editor.segmentId
                    ? "Edit match"
                    : "Add match"
                  : editor.segmentId
                    ? "Edit promo"
                    : "Add promo"
              }
              isBusy={isEditorSaving}
              onRequestClose={closeEditor}
            >
              {editor.kind === "match" ? (
                <MatchEditor
                  key={`match:${editor.segmentId ?? "new"}`}
                  careerId={career.id}
                  eventId={data.event.id}
                  segmentId={editor.segmentId}
                  financesEnabled={data.finances_enabled}
                  budgetAvailable={data.budget_available}
                  currentCardCost={data.total_cost}
                  onCancel={closeEditor}
                  onSavingChange={setIsEditorSaving}
                  onSaved={handleSegmentSaved}
                />
              ) : (
                <PromoEditor
                  key={`promo:${editor.segmentId ?? "new"}`}
                  careerId={career.id}
                  eventId={data.event.id}
                  segmentId={editor.segmentId}
                  financesEnabled={data.finances_enabled}
                  budgetAvailable={data.budget_available}
                  currentCardCost={data.total_cost}
                  onCancel={closeEditor}
                  onSavingChange={setIsEditorSaving}
                  onSaved={handleSegmentSaved}
                />
              )}
            </BookingEditorModal>
          )}

          {segmentToDelete && data.event.status === "draft" && (
            <BookingEditorModal
              title="Delete segment"
              isBusy={isDeleting}
              onRequestClose={closeDeleteConfirmation}
            >
              <div className="booking-screen__delete-confirmation">
                <p>
                  Delete segment {segmentToDelete.position}:{" "}
                  <strong>
                    {getSegmentParticipantsLabel(segmentToDelete)}
                  </strong>
                  ?
                </p>

                <p className="booking-screen__delete-description">
                  Its participants will become available again, and the card
                  cost will be updated. This action cannot be undone.
                </p>

                {deleteError && (
                  <p className="booking-screen__error" role="alert">
                    {deleteError}
                  </p>
                )}

                <div className="booking-screen__confirmation-actions">
                  <button
                    className="booking-screen__button"
                    type="button"
                    disabled={isDeleting}
                    onClick={closeDeleteConfirmation}
                  >
                    Cancel
                  </button>

                  <button
                    className="booking-screen__button booking-screen__button--danger"
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmSegmentDeletion}
                  >
                    {isDeleting ? "Deleting…" : "Delete segment"}
                  </button>
                </div>
              </div>
            </BookingEditorModal>
          )}

          {isConfirmationOpen && data.event.status === "draft" && (
            <BookingEditorModal
              title="Confirm card"
              isBusy={isUpdatingStatus}
              onRequestClose={closeCardConfirmation}
            >
              <div className="booking-screen__confirmation-content">
                <p className="booking-screen__hint">
                  Review your card before confirming. Editing will be locked
                  until you reopen it.
                </p>

                <dl className="booking-screen__overview">
                  <div>
                    <dt>Show</dt>
                    <dd>{data.event.name}</dd>
                  </div>
                  <div>
                    <dt>Show type</dt>
                    <dd>{showTypeLabels[data.show_type]}</dd>
                  </div>
                  <div>
                    <dt>Matches</dt>
                    <dd>{matchCount}</dd>
                  </div>
                  <div>
                    <dt>Promos</dt>
                    <dd>{promoCount}</dd>
                  </div>

                  {data.finances_enabled && (
                    <div>
                      <dt>Card cost</dt>
                      <dd>{formatSegmentCost(data.total_cost)}</dd>
                    </div>
                  )}
                </dl>

                <p className="booking-screen__hint">
                  Confirming does not charge the card cost or advance the week.
                </p>

                {confirmationError && (
                  <p className="booking-screen__error" role="alert">
                    {confirmationError}
                  </p>
                )}

                <div className="booking-screen__confirmation-actions">
                  <button
                    className="booking-screen__button"
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={closeCardConfirmation}
                  >
                    Cancel
                  </button>

                  <button
                    className="booking-screen__button booking-screen__button--accent"
                    type="button"
                    disabled={!canConfirm}
                    onClick={handleConfirmCard}
                  >
                    {pendingAction === "confirm"
                      ? "Confirming…"
                      : "Confirm card"}
                  </button>
                </div>
              </div>
            </BookingEditorModal>
          )}
        </>
      )}
    </section>
  );
}
