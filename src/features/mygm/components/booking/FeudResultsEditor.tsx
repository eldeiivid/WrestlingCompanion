import { useId } from "react";
import {
  getBookingFeudCandidates,
  getBookingFeudResultError,
  getCompatibleBookingFeuds,
  supportsBookingFeudResults,
} from "../../rules/bookingFeudResultsRules";
import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingActiveFeud,
  BookingFeudResultDraft,
  BookingFeudSide,
} from "../../types/bookingResults.types";
import "./FeudResultsEditor.scss";

interface FeudResultsEditorProps {
  segment: BookingSegmentSummary;
  feuds: BookingActiveFeud[];
  result: BookingFeudResultDraft | undefined;
  disabled?: boolean;
  onResultChange: (result: BookingFeudResultDraft) => void;
}

function getFeudSideLabel(
  feud: BookingActiveFeud,
  side: BookingFeudSide,
): string {
  return feud.members
    .filter((member) => member.side === side)
    .map((member) => member.name)
    .join(" & ");
}

function getFeudLabel(feud: BookingActiveFeud): string {
  return (
    feud.name?.trim() ||
    `${getFeudSideLabel(feud, 1)} vs ${getFeudSideLabel(feud, 2)}`
  );
}

export default function FeudResultsEditor({
  segment,
  feuds,
  result,
  disabled = false,
  onResultChange,
}: FeudResultsEditorProps) {
  const fieldId = useId();

  if (!supportsBookingFeudResults(segment)) {
    return null;
  }

  const candidates = getBookingFeudCandidates(segment);

  const newCandidates = candidates.filter(
    (candidate) =>
      getBookingFeudResultError(
        segment,
        {
          action: "create",
          kind: candidate.kind,
          members: candidate.members,
        },
        feuds,
      ) === null,
  );

  const compatibleFeuds = getCompatibleBookingFeuds(segment, feuds);

  const increasableFeuds = compatibleFeuds.filter((feud) => feud.level < 4);

  const selectedFeud =
    result?.action === "increase" || result?.action === "resolve"
      ? compatibleFeuds.find((feud) => feud.id === result.feudId)
      : undefined;

  const selectedCandidate =
    result?.action === "create"
      ? newCandidates.find(
          (candidate) =>
            candidate.kind === result.kind &&
            candidate.members.length === result.members.length &&
            candidate.members.every((member) =>
              result.members.some(
                (selected) =>
                  selected.wrestlerId === member.wrestlerId &&
                  selected.side === member.side,
              ),
            ),
        )
      : undefined;

  const errorMessage = getBookingFeudResultError(segment, result, feuds);

  const isComplete = result !== undefined && errorMessage === null;

  const selectableFeuds =
    result?.action === "increase" ? increasableFeuds : compatibleFeuds;

  function handleActionChange(value: string) {
    if (value === "none") {
      onResultChange({ action: "none" });
      return;
    }

    if (value === "create") {
      const candidate = newCandidates[0];

      if (candidate) {
        onResultChange({
          action: "create",
          kind: candidate.kind,
          members: candidate.members,
        });
      }

      return;
    }

    if (value === "increase") {
      const feud = increasableFeuds[0];

      if (feud) {
        onResultChange({
          action: "increase",
          feudId: feud.id,
        });
      }

      return;
    }

    if (value === "resolve") {
      const feud = compatibleFeuds[0];

      if (feud) {
        onResultChange({
          action: "resolve",
          feudId: feud.id,
          winningSide: null,
        });
      }
    }
  }

  return (
    <section className="feud-results">
      <header className="feud-results__header">
        <div>
          <h2>Rivalry outcome</h2>
          <p>Record what happened to the rivalry during this segment.</p>
        </div>

        <span
          className={
            isComplete
              ? "feud-results__status feud-results__status--complete"
              : "feud-results__status"
          }
        >
          {isComplete ? "Complete" : "Pending"}
        </span>
      </header>

      <fieldset className="feud-results__fields" disabled={disabled}>
        <legend className="feud-results__legend">
          Rivalry result for segment {segment.position}
        </legend>

        <div className="feud-results__field">
          <label htmlFor={`${fieldId}-action`}>Rivalry action</label>

          <select
            id={`${fieldId}-action`}
            value={result?.action ?? ""}
            onChange={(event) => handleActionChange(event.target.value)}
          >
            <option value="" disabled>
              Select an outcome
            </option>

            <option value="none">No rivalry change</option>

            <option value="create" disabled={newCandidates.length === 0}>
              Create a rivalry
            </option>

            <option value="increase" disabled={increasableFeuds.length === 0}>
              Increase rivalry level
            </option>

            <option value="resolve" disabled={compatibleFeuds.length === 0}>
              End a rivalry
            </option>
          </select>
        </div>

        {result?.action === "create" && (
          <div className="feud-results__field">
            <label htmlFor={`${fieldId}-participants`}>
              Rivalry participants
            </label>

            <select
              id={`${fieldId}-participants`}
              value={selectedCandidate?.key ?? ""}
              onChange={(event) => {
                const candidate = newCandidates.find(
                  (option) => option.key === event.target.value,
                );

                if (candidate) {
                  onResultChange({
                    action: "create",
                    kind: candidate.kind,
                    members: candidate.members,
                  });
                }
              }}
            >
              <option value="" disabled>
                Select participants
              </option>

              {newCandidates.map((candidate) => (
                <option key={candidate.key} value={candidate.key}>
                  {candidate.label}
                </option>
              ))}
            </select>

            <p className="feud-results__hint">
              The new rivalry will start at level 1 when the show closes.
            </p>
          </div>
        )}

        {(result?.action === "increase" || result?.action === "resolve") && (
          <div className="feud-results__field">
            <label htmlFor={`${fieldId}-rivalry`}>Active rivalry</label>

            <select
              id={`${fieldId}-rivalry`}
              value={
                selectableFeuds.some((feud) => feud.id === result.feudId)
                  ? result.feudId
                  : ""
              }
              onChange={(event) => {
                const feud = selectableFeuds.find(
                  (option) => option.id === event.target.value,
                );

                if (!feud) {
                  return;
                }

                if (result.action === "increase") {
                  onResultChange({
                    action: "increase",
                    feudId: feud.id,
                  });
                } else {
                  onResultChange({
                    action: "resolve",
                    feudId: feud.id,
                    winningSide: null,
                  });
                }
              }}
            >
              <option value="" disabled>
                Select a rivalry
              </option>

              {selectableFeuds.map((feud) => (
                <option key={feud.id} value={feud.id}>
                  {getFeudLabel(feud)} — Level {feud.level}
                </option>
              ))}
            </select>

            {result.action === "increase" && selectedFeud && (
              <p className="feud-results__hint">
                Level {selectedFeud.level} →{" "}
                {Math.min(selectedFeud.level + 1, 4)} when the show closes.
              </p>
            )}
          </div>
        )}

        {result?.action === "resolve" && selectedFeud && (
          <div className="feud-results__field">
            <label htmlFor={`${fieldId}-winner`}>Rivalry winner</label>

            <select
              id={`${fieldId}-winner`}
              value={result.winningSide ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  onResultChange({
                    ...result,
                    winningSide: null,
                  });

                  return;
                }

                if (value === "1" || value === "2") {
                  onResultChange({
                    ...result,
                    winningSide: value === "1" ? 1 : 2,
                  });
                }
              }}
            >
              <option value="">No winner assigned</option>

              <option value="1">{getFeudSideLabel(selectedFeud, 1)}</option>

              <option value="2">{getFeudSideLabel(selectedFeud, 2)}</option>
            </select>

            <p className="feud-results__hint">
              The rivalry winner can differ from the winner of this match.
            </p>
          </div>
        )}
      </fieldset>

      {result && errorMessage && (
        <p className="feud-results__error" role="alert">
          {errorMessage}
        </p>
      )}

      {!result && (
        <p className="feud-results__hint">
          Choose an outcome, including no change, before continuing.
        </p>
      )}

      {result?.action === "none" && (
        <p className="feud-results__hint">
          This segment will not create, advance or end a rivalry.
        </p>
      )}
    </section>
  );
}
