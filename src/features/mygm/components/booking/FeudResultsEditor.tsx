import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";

import {
  getBookingFeudActionKey,
  getBookingFeudCandidates,
  getBookingFeudResultError,
  getBookingFeudResultsError,
  getCompatibleBookingFeuds,
  supportsBookingFeudResults,
} from "../../rules/bookingFeudResultsRules";

import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingActiveFeud,
  BookingFeudActionDraft,
  BookingFeudSide,
} from "../../types/bookingResults.types";

import "./FeudResultsEditor.scss";

interface FeudResultsEditorProps {
  segment: BookingSegmentSummary;
  feuds: BookingActiveFeud[];
  result: BookingFeudActionDraft[] | undefined;
  disabled?: boolean;
  onResultChange: (result: BookingFeudActionDraft[]) => void;
}

interface FeudActionEditorProps {
  segment: BookingSegmentSummary;
  feuds: BookingActiveFeud[];
  action: BookingFeudActionDraft;
  index: number;
  usedKeys: Set<string>;
  onChange: (action: BookingFeudActionDraft) => void;
  onRemove: () => void;
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

function FeudActionEditor({
  segment,
  feuds,
  action,
  index,
  usedKeys,
  onChange,
  onRemove,
}: FeudActionEditorProps) {
  const fieldId = useId();

  if (action.action === "none") {
    return null;
  }

  const candidates = getBookingFeudCandidates(segment).filter(
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

  const selectableFeuds =
    action.action === "increase"
      ? compatibleFeuds.filter((feud) => feud.level < 4)
      : compatibleFeuds;

  const selectedFeud =
    action.action === "increase" || action.action === "resolve"
      ? compatibleFeuds.find((feud) => feud.id === action.feudId)
      : undefined;

  const selectedCandidate =
    action.action === "create"
      ? candidates.find(
          (candidate) =>
            candidate.key === getBookingFeudActionKey(action, feuds),
        )
      : undefined;

  const error = getBookingFeudResultError(segment, action, feuds);

  const label =
    action.action === "create"
      ? "Start a rivalry"
      : action.action === "increase"
        ? "Increase rivalry level"
        : "End a rivalry";

  return (
    <section className="feud-results__entry">
      <header className="feud-results__entry-header">
        <div>
          <p>Action {index + 1}</p>
          <h3>{label}</h3>
        </div>

        <button
          className="feud-results__remove"
          type="button"
          aria-label={`Remove rivalry action ${index + 1}: ${label}`}
          onClick={onRemove}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </header>

      {action.action === "create" ? (
        <div className="feud-results__field">
          <label htmlFor={`${fieldId}-participants`}>
            Rivalry participants
          </label>

          <select
            id={`${fieldId}-participants`}
            value={selectedCandidate?.key ?? ""}
            onChange={(event) => {
              const candidate = candidates.find(
                (item) => item.key === event.target.value,
              );

              if (!candidate || usedKeys.has(candidate.key)) return;

              onChange({
                id: action.id,
                action: "create",
                kind: candidate.kind,
                members: candidate.members,
              });
            }}
          >
            <option value="">Select participants</option>

            {candidates.map((candidate) => (
              <option
                key={candidate.key}
                value={candidate.key}
                disabled={usedKeys.has(candidate.key)}
              >
                {candidate.label}
                {usedKeys.has(candidate.key)
                  ? " — Already selected in this segment"
                  : ""}
              </option>
            ))}
          </select>

          <p className="feud-results__hint">
            This rivalry will start at level 1 when the show closes.
          </p>
        </div>
      ) : (
        <div className="feud-results__field">
          <label htmlFor={`${fieldId}-rivalry`}>Active rivalry</label>

          <select
            id={`${fieldId}-rivalry`}
            value={
              selectableFeuds.some((feud) => feud.id === action.feudId)
                ? action.feudId
                : ""
            }
            onChange={(event) => {
              const feud = selectableFeuds.find(
                (item) => item.id === event.target.value,
              );

              if (!feud) return;

              const key = getBookingFeudActionKey(
                { action: "increase", feudId: feud.id },
                feuds,
              );

              if (key && usedKeys.has(key)) return;

              onChange(
                action.action === "increase"
                  ? {
                      id: action.id,
                      action: "increase",
                      feudId: feud.id,
                    }
                  : {
                      id: action.id,
                      action: "resolve",
                      feudId: feud.id,
                      winningSide: null,
                    },
              );
            }}
          >
            <option value="">Select a rivalry</option>

            {selectableFeuds.map((feud) => {
              const key = getBookingFeudActionKey(
                { action: "increase", feudId: feud.id },
                feuds,
              );

              const alreadySelected = key !== null && usedKeys.has(key);

              return (
                <option
                  key={feud.id}
                  value={feud.id}
                  disabled={alreadySelected}
                >
                  {getFeudLabel(feud)} — Level {feud.level}
                  {alreadySelected ? " — Already selected in this segment" : ""}
                </option>
              );
            })}
          </select>

          {action.action === "increase" && selectedFeud && (
            <p className="feud-results__hint">
              Level {selectedFeud.level} → {Math.min(selectedFeud.level + 1, 4)}{" "}
              when the show closes.
            </p>
          )}
        </div>
      )}

      {action.action === "resolve" && selectedFeud && (
        <div className="feud-results__field">
          <label htmlFor={`${fieldId}-winner`}>Rivalry winner</label>

          <select
            id={`${fieldId}-winner`}
            value={action.winningSide ?? ""}
            onChange={(event) => {
              const value = event.target.value;

              if (value !== "" && value !== "1" && value !== "2") return;

              onChange({
                ...action,
                winningSide: value === "" ? null : value === "1" ? 1 : 2,
              });
            }}
          >
            <option value="">No winner assigned</option>
            <option value="1">{getFeudSideLabel(selectedFeud, 1)}</option>
            <option value="2">{getFeudSideLabel(selectedFeud, 2)}</option>
          </select>

          <p className="feud-results__hint">
            The rivalry winner can differ from the match winner.
          </p>
        </div>
      )}

      {error && <p className="feud-results__entry-hint">{error}</p>}
    </section>
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

  const actions = result ?? [];

  const noChange = actions.length === 1 && actions[0].action === "none";

  const customChanges = result !== undefined && !noChange;

  const error = getBookingFeudResultsError(segment, result, feuds);
  const isComplete = error === null;

  const usedKeys = new Set(
    actions
      .map((action) => getBookingFeudActionKey(action, feuds))
      .filter((key): key is string => key !== null),
  );

  const availableCandidates = getBookingFeudCandidates(segment).filter(
    (candidate) =>
      !usedKeys.has(candidate.key) &&
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

  const availableFeuds = compatibleFeuds.filter((feud) => {
    const key = getBookingFeudActionKey(
      { action: "increase", feudId: feud.id },
      feuds,
    );

    return key !== null && !usedKeys.has(key);
  });

  const canIncrease = availableFeuds.some((feud) => feud.level < 4);

  function addAction(kind: "create" | "increase" | "resolve") {
    if (disabled) return;

    const id = crypto.randomUUID();
    let next: BookingFeudActionDraft;

    if (kind === "create") {
      const candidate = availableCandidates[0];
      if (!candidate) return;

      next = {
        id,
        action: "create",
        kind: candidate.kind,
        members: [],
      };
    } else if (kind === "increase") {
      if (!canIncrease) return;

      next = { id, action: "increase", feudId: "" };
    } else {
      if (availableFeuds.length === 0) return;

      next = {
        id,
        action: "resolve",
        feudId: "",
        winningSide: null,
      };
    }

    onResultChange([
      ...actions.filter((action) => action.action !== "none"),
      next,
    ]);
  }

  return (
    <section className="feud-results" aria-labelledby={`${fieldId}-title`}>
      <header className="feud-results__header">
        <div>
          <h2 id={`${fieldId}-title`}>Rivalry outcomes</h2>
          <p>Record every rivalry change that happened in this segment.</p>
        </div>

        <span
          className={`feud-results__status${
            isComplete ? " feud-results__status--complete" : ""
          }`}
        >
          {isComplete ? "Complete" : "Pending"}
        </span>
      </header>

      <fieldset className="feud-results__fields" disabled={disabled}>
        <legend className="feud-results__legend">
          Rivalry outcomes for segment {segment.position}
        </legend>

        <div className="feud-results__modes">
          <label className="feud-results__mode">
            <input
              type="radio"
              name={`${fieldId}-mode`}
              checked={noChange}
              onChange={() =>
                onResultChange([{ id: crypto.randomUUID(), action: "none" }])
              }
            />
            <span>
              <strong>No rivalry change</strong>
              <span>This segment does not change any rivalries.</span>
            </span>
          </label>

          <label className="feud-results__mode">
            <input
              type="radio"
              name={`${fieldId}-mode`}
              checked={customChanges}
              onChange={() => onResultChange([])}
            />
            <span>
              <strong>Record rivalry changes</strong>
              <span>
                Add one or more changes and choose their participants.
              </span>
            </span>
          </label>
        </div>

        {customChanges && (
          <>
            <div className="feud-results__entries">
              {actions.map((action, index) => {
                const siblingKeys = new Set(
                  actions
                    .filter((item) => item.id !== action.id)
                    .map((item) => getBookingFeudActionKey(item, feuds))
                    .filter((key): key is string => key !== null),
                );

                return (
                  <FeudActionEditor
                    key={action.id}
                    segment={segment}
                    feuds={feuds}
                    action={action}
                    index={index}
                    usedKeys={siblingKeys}
                    onChange={(updated) =>
                      onResultChange(
                        actions.map((item) =>
                          item.id === action.id ? updated : item,
                        ),
                      )
                    }
                    onRemove={() =>
                      onResultChange(
                        actions.filter((item) => item.id !== action.id),
                      )
                    }
                  />
                );
              })}
            </div>

            <div className="feud-results__add-actions">
              <button
                type="button"
                disabled={availableCandidates.length === 0}
                onClick={() => addAction("create")}
              >
                <Plus size={15} aria-hidden="true" />
                Start rivalry
              </button>

              <button
                type="button"
                disabled={!canIncrease}
                onClick={() => addAction("increase")}
              >
                <Plus size={15} aria-hidden="true" />
                Increase level
              </button>

              <button
                type="button"
                disabled={availableFeuds.length === 0}
                onClick={() => addAction("resolve")}
              >
                <Plus size={15} aria-hidden="true" />
                End rivalry
              </button>
            </div>

            <p className="feud-results__hint">
              Only compatible options are available. Each rivalry can receive
              one action in this segment.
            </p>

            {error && <p className="feud-results__validation">{error}</p>}
          </>
        )}

        {result === undefined && (
          <p className="feud-results__hint">
            Choose whether this segment changed any rivalries.
          </p>
        )}
      </fieldset>
    </section>
  );
}
