import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Trophy } from "lucide-react";
import { useBookingMatchOptions } from "../../hooks/booking/useBookingMatchOptions";
import { getMatchFeudSuggestions } from "../../rules/booking/matchParticipantRules";
import type {
  MatchFeudSuggestion,
  MatchGenderFilter,
} from "../../rules/booking/matchParticipantRules";
import {
  getEligibleInterferenceAttackers,
  getEligibleMatchTitles,
  getSuggestedInterference,
  getSuggestedInterferenceTargetId,
  getSuggestedMatchTitleId,
} from "../../rules/booking/matchRules";
import { addMatch, updateMatch } from "../../services/booking/bookingService";
import type {
  AddBookingMatchInput,
  BookingEditableMatch,
  BookingMatchInterferenceInput,
  BookingMatchOptions,
  BookingMatchTitleOption,
} from "../../types/booking/booking.types";
import "./MatchEditor.scss";
import MatchParticipantPicker, {
  MatchEditorImage,
} from "./MatchParticipantPicker";

interface MatchEditorProps {
  careerId: string;
  eventId: string;
  segmentId?: string;
  financesEnabled: boolean;
  budgetAvailable: string;
  currentCardCost: string;
  onCancel: () => void;
  onSaved: () => void;
  onSavingChange?: (isSaving: boolean) => void;
}

interface MatchEditorFormProps extends MatchEditorProps {
  options: BookingMatchOptions;
  initialSegment: BookingEditableMatch | null;
}

const emptyInterference: BookingMatchInterferenceInput = {
  wrestler_id: "",
  target_wrestler_id: "",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(value: string | bigint) {
  return currencyFormatter.format(BigInt(value));
}

function getInitialParticipantIds(
  options: BookingMatchOptions,
  segment: BookingEditableMatch | null,
): string[] {
  if (!segment) return [];

  const format = options.formats.find((item) => item.id === segment.format_id);

  if (!format) return [];

  return format.team_sizes.flatMap((size, teamIndex) => {
    const members = segment.participants.filter(
      (participant) => participant.side === teamIndex + 1,
    );

    return Array.from(
      { length: size },
      (_, memberIndex) => members[memberIndex]?.wrestler_id ?? "",
    );
  });
}

function getInitialGenderFilter(
  options: BookingMatchOptions,
  segment: BookingEditableMatch | null,
): MatchGenderFilter {
  const ids = getInitialParticipantIds(options, segment);

  const selected = options.wrestlers.filter((wrestler) =>
    ids.includes(wrestler.id),
  );

  if (selected.length === 0) return "all";

  if (selected.every((wrestler) => wrestler.gender === "male")) {
    return "male";
  }

  if (selected.every((wrestler) => wrestler.gender === "female")) {
    return "female";
  }

  return "all";
}

function resolveTitleSelection(
  eligibleTitles: BookingMatchTitleOption[],
  currentTitleId: string,
): string {
  if (eligibleTitles.some((title) => title.id === currentTitleId)) {
    return currentTitleId;
  }

  return getSuggestedMatchTitleId(eligibleTitles) ?? "";
}

export default function MatchEditor(props: MatchEditorProps) {
  const { data, segment, isLoading, errorMessage, retry } =
    useBookingMatchOptions(props.careerId, props.eventId, props.segmentId);

  const canRenderForm = data !== null && (!props.segmentId || segment !== null);

  return (
    <section className="match-editor">
      <p className="match-editor__description">
        {props.segmentId
          ? "Update the match configuration."
          : "Choose the format, stipulation and participants."}
      </p>

      {isLoading && (
        <p role="status">
          {props.segmentId ? "Loading match…" : "Loading match options…"}
        </p>
      )}

      {errorMessage && (
        <div className="match-editor__error" role="alert">
          <p>{errorMessage}</p>

          <button
            className="match-editor__button"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}

      {canRenderForm && data && (
        <MatchEditorForm
          key={`${props.careerId}:${props.eventId}:${props.segmentId ?? "new"}`}
          {...props}
          options={data}
          initialSegment={segment}
        />
      )}

      {!canRenderForm && (
        <button
          className="match-editor__button"
          type="button"
          onClick={props.onCancel}
        >
          Cancel
        </button>
      )}
    </section>
  );
}

function MatchEditorForm({
  careerId,
  eventId,
  financesEnabled,
  budgetAvailable,
  currentCardCost,
  onCancel,
  onSaved,
  onSavingChange,
  options,
  initialSegment,
}: MatchEditorFormProps) {
  const isEditing = initialSegment !== null;
  const participantsTitleId = useId();
  const saveReadinessId = useId();
  const stipulationOptionsId = useId();
  const stipulationToggleRef = useRef<HTMLButtonElement>(null);

  const [segmentId] = useState(() => initialSegment?.id ?? crypto.randomUUID());

  const [formatId, setFormatId] = useState(initialSegment?.format_id ?? "");

  const [stipulationId, setStipulationId] = useState(
    initialSegment?.stipulation_id ?? "",
  );
  const [stipulationsExpanded, setStipulationsExpanded] = useState(false);

  const [participantIds, setParticipantIds] = useState<string[]>(() =>
    getInitialParticipantIds(options, initialSegment),
  );

  const [genderFilter, setGenderFilter] = useState<MatchGenderFilter>(() =>
    getInitialGenderFilter(options, initialSegment),
  );

  const [rivalrySuggestions, setRivalrySuggestions] = useState<
    MatchFeudSuggestion[]
  >([]);

  const [rivalryNotice, setRivalryNotice] = useState("");

  const [titleMatchEnabled, setTitleMatchEnabled] = useState(
    Boolean(initialSegment?.title_id),
  );

  const [titleId, setTitleId] = useState(initialSegment?.title_id ?? "");

  const [interferenceEnabled, setInterferenceEnabled] = useState(
    Boolean(initialSegment?.interference),
  );

  const [attackerId, setAttackerId] = useState(
    initialSegment?.interference?.wrestler_id ?? "",
  );

  const [targetId, setTargetId] = useState(
    initialSegment?.interference?.target_wrestler_id ?? "",
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const savingRef = useRef(false);

  const selectedFormat = options.formats.find(
    (format) => format.id === formatId,
  );

  const availableStipulations = options.stipulations.filter((stipulation) =>
    stipulation.format_ids.includes(formatId),
  );

  const selectedStipulation = availableStipulations.find(
    (stipulation) => stipulation.id === stipulationId,
  );

  const participantSlots =
    selectedFormat?.team_sizes.flatMap((size, teamIndex) =>
      Array.from({ length: size }, (_, memberIndex) => ({
        side: teamIndex + 1,
        member: memberIndex + 1,
      })),
    ) ?? [];

  function hasValidParticipantSelection(ids: string[]) {
    return (
      participantSlots.length > 0 &&
      ids.length === participantSlots.length &&
      new Set(ids).size === participantSlots.length &&
      ids.every((id) =>
        options.wrestlers.some(
          (wrestler) => wrestler.id === id && wrestler.is_available,
        ),
      )
    );
  }

  const hasValidParticipants = hasValidParticipantSelection(participantIds);

  const eligibleTitles = getEligibleMatchTitles({
    format: selectedFormat,
    participantIds,
    wrestlers: options.wrestlers,
    titles: options.titles,
  });

  const selectedTitle = eligibleTitles.find((title) => title.id === titleId);

  const hasValidTitle = !titleMatchEnabled || selectedTitle !== undefined;

  const eligibleAttackers = getEligibleInterferenceAttackers({
    participantIds,
    wrestlers: options.wrestlers,
  });

  const hasValidInterference =
    !interferenceEnabled ||
    (hasValidParticipants &&
      eligibleAttackers.some((wrestler) => wrestler.id === attackerId) &&
      participantIds.includes(targetId) &&
      attackerId !== targetId);

  const stipulationCost =
    financesEnabled && selectedStipulation
      ? BigInt(selectedStipulation.cost)
      : 0n;

  const interferenceCost =
    financesEnabled && interferenceEnabled
      ? BigInt(options.interference_cost)
      : 0n;

  const matchCost = stipulationCost + interferenceCost;

  const previousCost = initialSegment ? BigInt(initialSegment.cost) : 0n;

  const projectedCost = BigInt(currentCardCost) - previousCost + matchCost;

  const exceedsBudget =
    financesEnabled && projectedCost > BigInt(budgetAvailable);

  const canSave =
    Boolean(selectedFormat) &&
    Boolean(selectedStipulation) &&
    hasValidParticipants &&
    hasValidTitle &&
    hasValidInterference &&
    !exceedsBudget;

  const saveRequirements = [
    !selectedFormat && "Choose a match format.",
    !selectedStipulation && "Choose a stipulation.",
    !hasValidParticipants &&
      "Fill every participant slot with an available wrestler.",
    !hasValidTitle && "Choose a compatible championship or turn off Title match.",
    !hasValidInterference &&
      "Choose an available attacker and target or turn off Interference.",
    exceedsBudget && "Reduce the card cost to fit the available budget.",
  ].filter((requirement): requirement is string => Boolean(requirement));

  const selectedAttacker = eligibleAttackers.find(
    (item) => item.id === attackerId,
  );
  const selectedTarget = options.wrestlers.find((item) => item.id === targetId);

  function applyInterferenceSelection(
    selection: BookingMatchInterferenceInput,
  ) {
    setAttackerId(selection.wrestler_id);
    setTargetId(selection.target_wrestler_id);
  }

  function resolveInterferenceSelection(
    nextParticipantIds: string[],
  ): BookingMatchInterferenceInput {
    if (!hasValidParticipantSelection(nextParticipantIds)) {
      return emptyInterference;
    }

    const nextAttackers = getEligibleInterferenceAttackers({
      participantIds: nextParticipantIds,
      wrestlers: options.wrestlers,
    });

    const canKeepAttacker = nextAttackers.some(
      (wrestler) => wrestler.id === attackerId,
    );

    if (canKeepAttacker) {
      return {
        wrestler_id: attackerId,
        target_wrestler_id: nextParticipantIds.includes(targetId)
          ? targetId
          : (getSuggestedInterferenceTargetId({
              attackerId,
              participantIds: nextParticipantIds,
              feuds: options.feuds,
            }) ?? ""),
      };
    }

    return (
      getSuggestedInterference({
        participantIds: nextParticipantIds,
        wrestlers: options.wrestlers,
        feuds: options.feuds,
      }) ?? emptyInterference
    );
  }

  function applyParticipantSelection(nextParticipantIds: string[]) {
    setParticipantIds(nextParticipantIds);

    if (titleMatchEnabled) {
      const nextEligibleTitles = getEligibleMatchTitles({
        format: selectedFormat,
        participantIds: nextParticipantIds,
        wrestlers: options.wrestlers,
        titles: options.titles,
      });

      setTitleId(resolveTitleSelection(nextEligibleTitles, titleId));
    }

    if (interferenceEnabled) {
      applyInterferenceSelection(
        resolveInterferenceSelection(nextParticipantIds),
      );
    }

    setSaveError("");
  }

  function applyRivalrySuggestion(suggestion: MatchFeudSuggestion) {
    applyParticipantSelection(suggestion.participantIds);
    setRivalrySuggestions([]);

    const addedNames = suggestion.addedWrestlerIds
      .map(
        (id) =>
          options.wrestlers.find((wrestler) => wrestler.id === id)?.name ??
          "Unknown wrestler",
      )
      .join(", ");

    setRivalryNotice(
      `Added ${addedNames} from an active rivalry. You can change these selections.`,
    );
  }

  function handleFormatChange(nextFormatId: string) {
    const nextFormat = options.formats.find(
      (format) => format.id === nextFormatId,
    );

    const participantCount =
      nextFormat?.team_sizes.reduce((total, size) => total + size, 0) ?? 0;

    setFormatId(nextFormatId);
    setStipulationId("");
    setStipulationsExpanded(false);
    setParticipantIds(Array<string>(participantCount).fill(""));
    setTitleId("");
    setRivalrySuggestions([]);
    setRivalryNotice("");
    applyInterferenceSelection(emptyInterference);
    setSaveError("");
  }

  function handleGenderFilterChange(value: string) {
    if (value !== "all" && value !== "male" && value !== "female") {
      return;
    }

    setGenderFilter(value);
    setRivalrySuggestions([]);
    setRivalryNotice("");
  }

  function handleParticipantChange(index: number, wrestlerId: string) {
    if (index < 0 || index >= participantSlots.length) {
      return;
    }

    const wrestler = options.wrestlers.find((item) => item.id === wrestlerId);

    if (
      wrestlerId &&
      (!wrestler?.is_available ||
        participantIds.some(
          (id, currentIndex) => id === wrestlerId && currentIndex !== index,
        ))
    ) {
      return;
    }

    const nextParticipantIds = participantSlots.map((_, currentIndex) =>
      currentIndex === index
        ? wrestlerId
        : (participantIds[currentIndex] ?? ""),
    );

    let nextGenderFilter = genderFilter;

    if (
      wrestler &&
      !participantIds.some(Boolean) &&
      (wrestler.gender === "male" || wrestler.gender === "female")
    ) {
      nextGenderFilter = wrestler.gender;
      setGenderFilter(nextGenderFilter);
    }

    setRivalryNotice("");
    setRivalrySuggestions([]);

    if (!wrestlerId) {
      applyParticipantSelection(nextParticipantIds);
      return;
    }

    const suggestions = getMatchFeudSuggestions({
      format: selectedFormat,
      participantIds: nextParticipantIds,
      changedIndex: index,
      genderFilter: nextGenderFilter,
      wrestlers: options.wrestlers,
      feuds: options.feuds,
    });

    if (suggestions.length === 1) {
      applyRivalrySuggestion(suggestions[0]);
      return;
    }

    applyParticipantSelection(nextParticipantIds);

    if (suggestions.length > 1) {
      setRivalrySuggestions(suggestions);
    }
  }

  function handleTitleMatchChange(enabled: boolean) {
    setTitleMatchEnabled(enabled);

    setTitleId(enabled ? resolveTitleSelection(eligibleTitles, titleId) : "");

    setSaveError("");
  }

  function handleInterferenceChange(enabled: boolean) {
    setInterferenceEnabled(enabled);

    applyInterferenceSelection(
      enabled
        ? resolveInterferenceSelection(participantIds)
        : emptyInterference,
    );

    setSaveError("");
  }

  function handleAttackerChange(nextAttackerId: string) {
    setAttackerId(nextAttackerId);

    if (!nextAttackerId) {
      setTargetId("");
    } else {
      const suggestedTargetId = getSuggestedInterferenceTargetId({
        attackerId: nextAttackerId,
        participantIds,
        feuds: options.feuds,
      });

      setTargetId(
        suggestedTargetId ??
          (participantIds.includes(targetId) ? targetId : ""),
      );
    }

    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    onSavingChange?.(true);
    setSaveError("");

    try {
      const input: AddBookingMatchInput = {
        careerId,
        eventId,
        segmentId,
        formatId,
        stipulationId,
        titleId: titleMatchEnabled ? titleId : null,
        interference: interferenceEnabled
          ? {
              wrestler_id: attackerId,
              target_wrestler_id: targetId,
            }
          : null,
        participants: participantSlots.map((slot, index) => ({
          wrestler_id: participantIds[index] ?? "",
          side: slot.side,
        })),
      };

      if (isEditing) {
        await updateMatch(input);
      } else {
        await addMatch(input);
      }

      onSaved();
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P0001" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to save the match. Please try again.";

      setSaveError(message);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="match-editor__fields" disabled={isSaving}>
        <legend className="match-editor__legend">Match configuration</legend>

        <section className="match-editor__setup" aria-label="Match setup">
          <div className="match-editor__section-heading">
            <h3>Match setup</h3>
            <span className="match-editor__section-note">Format & stipulation</span>
          </div>
          <label className="match-editor__field">
            <span>Match format</span>

            <select
              value={formatId}
              required
              onChange={(event) => handleFormatChange(event.target.value)}
            >
              <option value="">Select a format</option>

              {options.formats.map((format) => (
                <option key={format.id} value={format.id}>
                  {format.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset
            className="match-editor__stipulations"
            disabled={!formatId}
            onKeyDown={(event) => {
              if (event.key !== "Escape" || !stipulationsExpanded) return;
              event.preventDefault();
              event.stopPropagation();
              setStipulationsExpanded(false);
              stipulationToggleRef.current?.focus();
            }}
          >
            <legend>Stipulation</legend>

            {!formatId ? (
              <p className="match-editor__hint">
                Choose a format to see its available stipulations.
              </p>
            ) : availableStipulations.length === 0 ? (
              <p className="match-editor__hint">
                No stipulations are available for this format.
              </p>
            ) : (
              <>
                <button
                  ref={stipulationToggleRef}
                  className="match-editor__stipulation match-editor__stipulation-toggle"
                  type="button"
                  aria-expanded={stipulationsExpanded}
                  aria-controls={stipulationOptionsId}
                  onClick={() => setStipulationsExpanded((expanded) => !expanded)}
                >
                  <span className="match-editor__stipulation-copy">
                    <strong>{selectedStipulation?.name ?? "Choose a stipulation"}</strong>
                    {selectedStipulation && financesEnabled && (
                      <span>{formatMoney(selectedStipulation.cost)}</span>
                    )}
                  </span>
                  <ChevronDown size={18} aria-hidden="true" />
                </button>

                <div
                  className="match-editor__stipulation-grid"
                  id={stipulationOptionsId}
                  hidden={!stipulationsExpanded}
                >
                  {stipulationsExpanded && availableStipulations.map((stipulation) => (
                    <button
                      className="match-editor__stipulation"
                      key={stipulation.id}
                      type="button"
                      aria-pressed={stipulationId === stipulation.id}
                      onClick={() => {
                        setStipulationId(stipulation.id);
                        setStipulationsExpanded(false);
                        setSaveError("");
                        stipulationToggleRef.current?.focus();
                      }}
                    >
                      <span className="match-editor__stipulation-image" aria-hidden="true">
                        <MatchEditorImage src={stipulation.image_url} />
                      </span>
                      <span className="match-editor__stipulation-copy">
                        <strong>{stipulation.name}</strong>
                        {financesEnabled && <span>{formatMoney(stipulation.cost)}</span>}
                      </span>
                      {stipulationId === stipulation.id && <Check size={18} aria-hidden="true" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </fieldset>
        </section>

        {selectedFormat && (
          <section
            className="match-editor__participants"
            aria-labelledby={participantsTitleId}
          >
            <div className="match-editor__section-heading">
              <h3 id={participantsTitleId}>Participants</h3>
              <span className="match-editor__selection-count" role="status">
                {participantIds.filter(Boolean).length} / {participantSlots.length}{" "}
                selected
              </span>
            </div>

            <p className="match-editor__hint">
              Wrestlers booked in other matches or interferences are
              unavailable.
            </p>

            <div className="match-editor__participant-toolbar">
              <label className="match-editor__field">
                <span>Gender filter</span>

                <select
                  value={genderFilter}
                  onChange={(event) =>
                    handleGenderFilterChange(event.target.value)
                  }
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </label>

              <p className="match-editor__hint">
                The first selection sets the filter automatically. Choose All to
                include every gender. Existing selections are preserved.
              </p>
            </div>

            {rivalrySuggestions.length > 1 && (
              <div className="match-editor__rivalry-assistance">
                <label className="match-editor__field">
                  <span>Rivalry assistance</span>

                  <select
                    value=""
                    onChange={(event) => {
                      const suggestion = rivalrySuggestions.find(
                        (item) => item.feudId === event.target.value,
                      );

                      if (suggestion) {
                        applyRivalrySuggestion(suggestion);
                      }
                    }}
                  >
                    <option value="">Keep participants as selected</option>

                    {rivalrySuggestions.map((suggestion) => (
                      <option key={suggestion.feudId} value={suggestion.feudId}>
                        {suggestion.label}
                      </option>
                    ))}
                  </select>
                </label>

                <p className="match-editor__hint">
                  Several active rivalries fit this format. Choose one to fill
                  the empty slots, or continue selecting participants manually.
                </p>
              </div>
            )}

            {rivalryNotice && (
              <p className="match-editor__rivalry-notice" role="status">
                {rivalryNotice}
              </p>
            )}

            <MatchParticipantPicker
              key={selectedFormat.id}
              slots={participantSlots}
              participantIds={participantIds}
              wrestlers={options.wrestlers}
              genderFilter={genderFilter}
              disabled={isSaving}
              onChange={handleParticipantChange}
            />
          </section>
        )}

        <section className="match-editor__championship" aria-label="Championship">
          <label className="match-editor__title-toggle">
            <input
              type="checkbox"
              checked={titleMatchEnabled}
              onChange={(event) => handleTitleMatchChange(event.target.checked)}
            />

            <span className="match-editor__toggle-copy">
              <strong>Title match</strong>
              <small>Put a compatible championship on the line.</small>
            </span>
          </label>

          {titleMatchEnabled && (
            <>
              {options.titles.length === 0 ? (
                <p className="match-editor__hint">
                  No championships are available for this brand.
                </p>
              ) : !hasValidParticipants ? (
                <p className="match-editor__hint">
                  Select all participants to see compatible championships.
                </p>
              ) : eligibleTitles.length === 0 ? (
                <p className="match-editor__hint">
                  No championships are compatible with this format and its
                  participants.
                </p>
              ) : (
                <>
                  <label className="match-editor__field">
                    <span>Championship</span>

                    <select
                      value={titleId}
                      required
                      onChange={(event) => {
                        setTitleId(event.target.value);
                        setSaveError("");
                      }}
                    >
                      <option value="">Select a championship</option>

                      {eligibleTitles.map((title) => (
                        <option key={title.id} value={title.id}>
                          {title.name}
                          {title.is_vacant ? " — Vacant" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                </>
              )}

              {selectedTitle && (
                <div className="match-editor__title-preview">
                  <div className="match-editor__title-image" aria-hidden="true">
                    {selectedTitle.image_url ? (
                      <MatchEditorImage src={selectedTitle.image_url} />
                    ) : (
                      <Trophy size={32} strokeWidth={1.25} />
                    )}
                  </div>

                  <div>
                    <strong>{selectedTitle.name}</strong>

                    <p className="match-editor__title-status">
                      {selectedTitle.is_vacant
                        ? "This championship is vacant."
                        : selectedTitle.holders.length > 0
                          ? `Current champions: ${selectedTitle.holders
                              .map((holder) => holder.name)
                              .join(" & ")}`
                          : "Holder unavailable"}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="match-editor__interference" aria-label="Interference">
          <label className="match-editor__interference-toggle">
            <input
              type="checkbox"
              checked={interferenceEnabled}
              onChange={(event) =>
                handleInterferenceChange(event.target.checked)
              }
            />

            <span className="match-editor__toggle-copy">
              <strong>Interference</strong>
              <small>Send another wrestler to attack a participant.</small>
            </span>

            {financesEnabled && (
              <span className="match-editor__option-cost">
                {formatMoney(options.interference_cost)}
              </span>
            )}
          </label>

          {interferenceEnabled && (
            <>
              {!hasValidParticipants ? (
                <p className="match-editor__hint">
                  Select all participants before configuring the interference.
                </p>
              ) : eligibleAttackers.length === 0 ? (
                <p className="match-editor__hint">
                  No attackers are available for this match. Turn off
                  Interference or adjust the card.
                </p>
              ) : (
                <>
                  <p className="match-editor__hint">
                    The attacker cannot compete in a match, perform a promo or
                    interfere elsewhere on this show.
                  </p>

                  <div className="match-editor__configuration">
                    <label className="match-editor__field">
                      <span>Attacker</span>

                      <select
                        value={attackerId}
                        required
                        onChange={(event) =>
                          handleAttackerChange(event.target.value)
                        }
                      >
                        <option value="">Select an attacker</option>

                        {eligibleAttackers.map((wrestler) => (
                          <option key={wrestler.id} value={wrestler.id}>
                            {wrestler.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="match-editor__field">
                      <span>Target</span>

                      <select
                        value={targetId}
                        required
                        onChange={(event) => {
                          setTargetId(event.target.value);
                          setSaveError("");
                        }}
                      >
                        <option value="">Select a target</option>

                        {participantIds.map((id) => {
                          const wrestler = options.wrestlers.find(
                            (item) => item.id === id,
                          );

                          if (!wrestler) return null;

                          return (
                            <option key={id} value={id}>
                              {wrestler.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  </div>

                  {hasValidInterference && selectedAttacker && selectedTarget && (
                    <div className="match-editor__interference-preview">
                      <span>{selectedAttacker.name}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                      <span className="match-editor__sr-only">attacks</span>
                      <strong>{selectedTarget.name}</strong>
                    </div>
                  )}

                  {attackerId &&
                    !eligibleAttackers.some(
                      (wrestler) => wrestler.id === attackerId,
                    ) && (
                      <p className="match-editor__error">
                        The selected attacker is no longer available. Choose
                        another attacker.
                      </p>
                    )}
                </>
              )}
            </>
          )}
        </section>

        {financesEnabled && selectedStipulation && (
          <div className="match-editor__cost" aria-live="polite">
            <h3>Cost summary</h3>
            <p>
              Stipulation
              <strong>{formatMoney(stipulationCost)}</strong>
            </p>

            {interferenceEnabled && (
              <p>
                Interference
                <strong>{formatMoney(interferenceCost)}</strong>
              </p>
            )}

            <p className="match-editor__cost-total">
              Match total
              <strong>{formatMoney(matchCost)}</strong>
            </p>

            <p>
              {isEditing
                ? "Card total after changes"
                : "Card total after adding"}
              <strong>{formatMoney(projectedCost)}</strong>
            </p>

            <p>
              Available budget
              <strong>{formatMoney(budgetAvailable)}</strong>
            </p>
            <p
              className={exceedsBudget
                ? "match-editor__budget-error"
                : "match-editor__budget-remaining"}
            >
              {exceedsBudget ? "Over budget" : "Budget after this card"}
              <strong>
                {formatMoney(exceedsBudget
                  ? projectedCost - BigInt(budgetAvailable)
                  : BigInt(budgetAvailable) - projectedCost)}
              </strong>
            </p>

            {exceedsBudget && (
              <p className="match-editor__budget-error">
                This match exceeds the available budget. Choose a cheaper
                stipulation or turn off Interference.
              </p>
            )}
          </div>
        )}

        {saveError && (
          <p className="match-editor__error" role="alert">
            {saveError}
          </p>
        )}

        <div
          className={`match-editor__readiness${canSave ? " match-editor__readiness--ready" : ""}`}
          id={saveReadinessId}
        >
          <p>
            {canSave ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <CircleAlert size={16} aria-hidden="true" />
            )}
            {isSaving ? "Saving your match…" : canSave ? "Ready to save" : "Before you save"}
          </p>
          {!canSave && (
            <ul>
              {saveRequirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="match-editor__actions">
          <button
            className="match-editor__button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="match-editor__button match-editor__button--primary"
            type="submit"
            disabled={!canSave}
            aria-describedby={saveReadinessId}
          >
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Save match"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
