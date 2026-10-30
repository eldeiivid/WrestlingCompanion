import { useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
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

function getSegmentParticipantsLabel(segment: BookingSegmentSummary): string {
  if (segment.kind === "match") {
    const teams = new Map<number, string[]>();

    for (const participant of segment.participants) {
      const team = teams.get(participant.side) ?? [];

      team.push(participant.name);
      teams.set(participant.side, team);
    }

    const label = [...teams.entries()]
      .sort(([firstSide], [secondSide]) => firstSide - secondSide)
      .map(([, names]) => names.join(" & "))
      .join(" vs ");

    return label || "Participants unavailable";
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

function getSegmentDetailsLabel(segment: BookingSegmentSummary): string {
  if (segment.kind === "match") {
    return [segment.label, segment.stipulation_name]
      .filter(Boolean)
      .join(" · ");
  }

  return segment.label;
}

export default function BookingScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

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

  function closeEditor() {
    if (isEditorSaving) return;

    setEditor(null);
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
    if (!data || data.event.status !== "draft" || isBookingBusy) {
      return;
    }

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
    if (!data || data.event.status !== "confirmed" || isBookingBusy) {
      return;
    }

    const wasReopened = await reopenCard(career.id, data.event.id);

    if (wasReopened) {
      refreshBooking();
    }
  }

  return (
    <div className="booking-screen">
      <header className="booking-screen__header">
        {data && (
          <p className="booking-screen__eyebrow">
            {showTypeLabels[data.show_type]}
          </p>
        )}

        <h1>Booking</h1>
        <p>Build the card for your current week.</p>
      </header>

      {isLoading && (
        <p className="booking-screen__state" role="status">
          Opening your show…
        </p>
      )}

      {errorMessage && (
        <section className="booking-screen__panel" role="alert">
          <p>{errorMessage}</p>

          <button
            className="booking-screen__add-button"
            type="button"
            onClick={refreshBooking}
          >
            Try again
          </button>
        </section>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          <section className="booking-screen__panel">
            <div className="booking-screen__card-heading">
              <h2>Show overview</h2>

              <span className="booking-screen__status">
                {statusLabels[data.event.status]}
              </span>
            </div>

            <dl className="booking-screen__overview">
              <div>
                <dt>Matches</dt>
                <dd>
                  {matchCount} / {data.limits.max_matches}
                </dd>
              </div>

              <div>
                <dt>Promos</dt>
                <dd>
                  {promoCount} / {data.limits.max_promos}
                </dd>
              </div>

              <div>
                <dt>First segment</dt>
                <dd>
                  {data.limits.must_start_with_match
                    ? "Match"
                    : "Match or promo"}
                </dd>
              </div>

              <div>
                <dt>Last segment</dt>
                <dd>
                  {data.limits.must_end_with_match ? "Match" : "Match or promo"}
                </dd>
              </div>
            </dl>

            {data.event.status === "draft" && (
              <p className="booking-screen__hint">
                At least {data.limits.min_matches} matches are required to
                confirm the card. Promos are optional.
              </p>
            )}

            {data.event.status === "confirmed" && (
              <p className="booking-screen__hint">
                Your card is confirmed. You can reopen it before results are
                recorded.
              </p>
            )}

            {data.event.status === "completed" && (
              <p className="booking-screen__hint">
                This show has been completed and can no longer be edited.
              </p>
            )}
          </section>

          {data.finances_enabled && (
            <section className="booking-screen__panel">
              <h2>Budget</h2>

              <dl className="booking-screen__overview">
                <div>
                  <dt>Available</dt>
                  <dd>{formatSegmentCost(data.budget_available)}</dd>
                </div>

                <div>
                  <dt>Card cost</dt>
                  <dd>{formatSegmentCost(data.total_cost)}</dd>
                </div>
              </dl>

              {exceedsBudget && (
                <p className="booking-screen__delete-error" role="alert">
                  The card exceeds the available budget.
                </p>
              )}
            </section>
          )}

          <section className="booking-screen__panel">
            <div className="booking-screen__card-heading">
              <h2>Match card</h2>

              {data.event.status === "draft" && (
                <div className="booking-screen__card-actions">
                  <button
                    className="booking-screen__add-button"
                    type="button"
                    disabled={
                      isBookingBusy || matchCount >= data.limits.max_matches
                    }
                    onClick={() => setEditor({ kind: "match" })}
                  >
                    Add match
                  </button>

                  <button
                    className="booking-screen__add-button booking-screen__add-button--secondary"
                    type="button"
                    disabled={
                      isBookingBusy || promoCount >= data.limits.max_promos
                    }
                    onClick={() => setEditor({ kind: "promo" })}
                  >
                    Add promo
                  </button>
                </div>
              )}
            </div>

            {cardIssues.length > 0 && (
              <div
                id="booking-card-issues"
                className="booking-screen__card-validation"
                role="status"
              >
                <h3>Card needs attention</h3>

                <ul>
                  {cardIssues.map((issue) => (
                    <li key={issue.code}>{issue.message}</li>
                  ))}
                </ul>

                <p>
                  You can keep editing this draft. Resolve these issues before
                  confirming the card.
                </p>
              </div>
            )}

            {(isMoving || isRefreshing) && (
              <p className="booking-screen__hint" role="status">
                Updating card…
              </p>
            )}

            {refreshError && (
              <div role="alert">
                <p className="booking-screen__delete-error">{refreshError}</p>

                <button
                  className="booking-screen__confirmation-button"
                  type="button"
                  disabled={isBookingBusy}
                  onClick={refreshBooking}
                >
                  Refresh card
                </button>
              </div>
            )}

            {moveError && (
              <p className="booking-screen__delete-error" role="alert">
                {moveError}
              </p>
            )}

            {confirmationError && !isConfirmationOpen && (
              <p className="booking-screen__delete-error" role="alert">
                {confirmationError}
              </p>
            )}

            {data.segments.length === 0 ? (
              <div className="booking-screen__empty">
                <h3>No segments yet</h3>
                <p>Your draft is saved for this week.</p>
              </div>
            ) : (
              <ol
                className="booking-screen__segment-list"
                aria-busy={isMoving || isRefreshing}
              >
                {data.segments.map((segment, index) => (
                  <li className="booking-screen__segment" key={segment.id}>
                    <span
                      className="booking-screen__segment-position"
                      aria-label={`Segment ${segment.position}`}
                    >
                      {segment.position}
                    </span>

                    <div className="booking-screen__segment-details">
                      <h3 className="booking-screen__segment-title">
                        {getSegmentParticipantsLabel(segment)}
                      </h3>

                      <p className="booking-screen__segment-meta">
                        <span className="booking-screen__segment-kind">
                          {segment.kind === "match" ? "Match" : "Promo"}
                        </span>

                        <span aria-hidden="true"> · </span>

                        <span>{getSegmentDetailsLabel(segment)}</span>
                      </p>

                      {segment.kind === "match" && segment.title && (
                        <p className="booking-screen__segment-championship">
                          <span>Title match</span>
                          <strong>{segment.title.name}</strong>
                        </p>
                      )}

                      {segment.kind === "match" && segment.interference && (
                        <p className="booking-screen__segment-interference">
                          <span>Interference</span>

                          <strong>
                            {segment.interference.wrestler_name}
                            {" → "}
                            {segment.interference.target_wrestler_name}
                          </strong>
                        </p>
                      )}
                    </div>

                    <div className="booking-screen__segment-actions">
                      {data.finances_enabled && (
                        <span className="booking-screen__segment-price">
                          {formatSegmentCost(segment.cost)}
                        </span>
                      )}

                      {data.event.status === "draft" && (
                        <>
                          <button
                            className="booking-screen__confirmation-button"
                            type="button"
                            disabled={isBookingBusy || index === 0}
                            aria-label={`Move segment ${segment.position} up: ${getSegmentParticipantsLabel(segment)}`}
                            onClick={() => handleSegmentMove(segment.id, "up")}
                          >
                            {movingSegmentId === segment.id &&
                            movingDirection === "up"
                              ? "Moving…"
                              : "Move up"}
                          </button>

                          <button
                            className="booking-screen__confirmation-button"
                            type="button"
                            disabled={
                              isBookingBusy ||
                              index === data.segments.length - 1
                            }
                            aria-label={`Move segment ${segment.position} down: ${getSegmentParticipantsLabel(segment)}`}
                            onClick={() =>
                              handleSegmentMove(segment.id, "down")
                            }
                          >
                            {movingSegmentId === segment.id &&
                            movingDirection === "down"
                              ? "Moving…"
                              : "Move down"}
                          </button>

                          <button
                            className="booking-screen__confirmation-button booking-screen__edit-button"
                            type="button"
                            disabled={isBookingBusy}
                            aria-label={`Edit segment ${segment.position}: ${getSegmentParticipantsLabel(segment)}`}
                            onClick={() => openSegmentEditor(segment)}
                          >
                            Edit
                          </button>

                          <button
                            className="booking-screen__delete-button"
                            type="button"
                            disabled={isBookingBusy}
                            aria-label={`Delete segment ${segment.position}: ${getSegmentParticipantsLabel(segment)}`}
                            onClick={() => requestSegmentDeletion(segment)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {data.event.status === "draft" && (
              <div className="booking-screen__confirmation-actions">
                <button
                  className="booking-screen__add-button"
                  type="button"
                  disabled={!canConfirm}
                  aria-describedby={
                    cardIssues.length > 0 ? "booking-card-issues" : undefined
                  }
                  onClick={openCardConfirmation}
                >
                  Confirm card
                </button>
              </div>
            )}

            {data.event.status === "confirmed" && (
              <div className="booking-screen__confirmation-actions">
                <Link
                  className="booking-screen__add-button"
                  to={`/mygm/${career.id}/booking/results`}
                  aria-disabled={isBookingBusy}
                  onClick={(event) => {
                    if (isBookingBusy) {
                      event.preventDefault();
                    }
                  }}
                >
                  Record results
                </Link>

                <button
                  className="booking-screen__confirmation-button"
                  type="button"
                  disabled={isBookingBusy}
                  onClick={handleReopenCard}
                >
                  {pendingAction === "reopen" ? "Reopening…" : "Reopen card"}
                </button>
              </div>
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
                  <p className="booking-screen__delete-error" role="alert">
                    {deleteError}
                  </p>
                )}

                <div className="booking-screen__confirmation-actions">
                  <button
                    className="booking-screen__confirmation-button"
                    type="button"
                    disabled={isDeleting}
                    onClick={closeDeleteConfirmation}
                  >
                    Cancel
                  </button>

                  <button
                    className="booking-screen__confirmation-button booking-screen__confirmation-button--danger"
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
              <p className="booking-screen__hint">
                Review your card before confirming. Editing will be locked until
                you reopen it.
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
                <p className="booking-screen__delete-error" role="alert">
                  {confirmationError}
                </p>
              )}

              <div className="booking-screen__confirmation-actions">
                <button
                  className="booking-screen__confirmation-button"
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={closeCardConfirmation}
                >
                  Cancel
                </button>

                <button
                  className="booking-screen__add-button"
                  type="button"
                  disabled={!canConfirm}
                  onClick={handleConfirmCard}
                >
                  {pendingAction === "confirm" ? "Confirming…" : "Confirm card"}
                </button>
              </div>
            </BookingEditorModal>
          )}
        </>
      )}
    </div>
  );
}
