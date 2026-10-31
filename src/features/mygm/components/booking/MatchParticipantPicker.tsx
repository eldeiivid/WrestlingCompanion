import { useEffect, useId, useRef, useState } from "react";
import { Check, Search, UserPlus, UserRound, X } from "lucide-react";

import type { BookingMatchWrestler } from "../../types/booking.types";
import type { MatchGenderFilter } from "../../rules/matchParticipantRules";

interface ParticipantSlot {
  side: number;
  member: number;
}

interface MatchParticipantPickerProps {
  slots: ParticipantSlot[];
  participantIds: string[];
  wrestlers: BookingMatchWrestler[];
  genderFilter: MatchGenderFilter;
  disabled: boolean;
  onChange: (index: number, wrestlerId: string) => void;
}

export function MatchEditorImage({
  src,
  fallback,
}: {
  src: string | null;
  fallback?: "wrestler";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  return fallback === "wrestler" ? (
    <UserRound size={32} strokeWidth={1.25} aria-hidden="true" />
  ) : null;
}

export default function MatchParticipantPicker({
  slots,
  participantIds,
  wrestlers,
  genderFilter,
  disabled,
  onChange,
}: MatchParticipantPickerProps) {
  const panelId = useId();
  const searchId = useId();

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (activeIndex !== null) {
      searchRef.current?.focus({ preventScroll: true });
    }
  }, [activeIndex]);

  const sides = [...new Set(slots.map((slot) => slot.side))];
  const activeSlot = activeIndex === null ? null : slots[activeIndex];
  const currentId =
    activeIndex === null ? "" : (participantIds[activeIndex] ?? "");

  const normalizedSearch = search.trim().toLocaleLowerCase();

  const visibleWrestlers = wrestlers.filter(
    (wrestler) =>
      (wrestler.id === currentId ||
        genderFilter === "all" ||
        wrestler.gender === genderFilter) &&
      wrestler.name.toLocaleLowerCase().includes(normalizedSearch),
  );

  function closePicker() {
    const previousIndex = activeIndex;

    setActiveIndex(null);
    setSearch("");

    if (previousIndex !== null) {
      slotRefs.current[previousIndex]?.focus({ preventScroll: true });
    }
  }

  function chooseWrestler(wrestlerId: string) {
    if (disabled || activeIndex === null) return;

    onChange(activeIndex, wrestlerId);
    closePicker();
  }

  return (
    <div className="match-editor__picker">
      <div className="match-editor__teams">
        {sides.map((side) => (
          <section className="match-editor__team" key={side}>
            <h5>Team {side}</h5>

            <div className="match-editor__slots">
              {slots.map((slot, index) => {
                if (slot.side !== side) return null;

                const selectedId = participantIds[index] ?? "";
                const selected = wrestlers.find(
                  (wrestler) => wrestler.id === selectedId,
                );

                return (
                  <div
                    className={`match-editor__slot${
                      activeIndex === index ? " match-editor__slot--active" : ""
                    }`}
                    key={`${slot.side}-${slot.member}`}
                  >
                    <button
                      ref={(node) => {
                        slotRefs.current[index] = node;
                      }}
                      className="match-editor__slot-button"
                      type="button"
                      disabled={disabled}
                      aria-expanded={activeIndex === index}
                      aria-controls={panelId}
                      aria-label={`Choose team ${side}, wrestler ${slot.member}${
                        selected ? `: ${selected.name}` : ""
                      }`}
                      onClick={() => {
                        if (activeIndex === index) {
                          closePicker();
                        } else {
                          setSearch("");
                          setActiveIndex(index);
                        }
                      }}
                    >
                      <span
                        className="match-editor__slot-image"
                        aria-hidden="true"
                      >
                        {selected ? (
                          <MatchEditorImage
                            src={selected.image_url}
                            fallback="wrestler"
                          />
                        ) : (
                          <UserPlus size={28} strokeWidth={1.25} />
                        )}
                      </span>

                      <span className="match-editor__slot-copy">
                        <span>Wrestler {slot.member}</span>
                        <strong>{selected?.name ?? "Choose wrestler"}</strong>
                      </span>
                    </button>

                    {selectedId && (
                      <button
                        className="match-editor__clear-slot"
                        type="button"
                        disabled={disabled}
                        aria-label={`Remove ${
                          selected?.name ?? "wrestler"
                        } from team ${side}, slot ${slot.member}`}
                        onClick={() => {
                          onChange(index, "");
                        }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section
        className="match-editor__roster-picker"
        id={panelId}
        hidden={!activeSlot}
        aria-label="Choose a match participant"
      >
        {activeSlot && (
          <>
            <header className="match-editor__picker-header">
              <div>
                <h5>
                  Team {activeSlot.side} · Wrestler {activeSlot.member}
                </h5>
                <p>Choose a wrestler for this position.</p>
              </div>

              <button
                className="match-editor__picker-close"
                type="button"
                disabled={disabled}
                aria-label="Close wrestler selection"
                onClick={closePicker}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <label className="match-editor__search" htmlFor={searchId}>
              <span className="match-editor__sr-only">Search wrestlers</span>
              <Search size={17} aria-hidden="true" />

              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={search}
                maxLength={200}
                disabled={disabled}
                placeholder="Search by name"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {visibleWrestlers.length === 0 ? (
              <p className="match-editor__picker-empty" role="status">
                No wrestlers match this search and gender filter.
              </p>
            ) : (
              <ul className="match-editor__roster-options">
                {visibleWrestlers.map((wrestler) => {
                  const selectedElsewhere = participantIds.some(
                    (id, index) => id === wrestler.id && index !== activeIndex,
                  );

                  const unavailable =
                    !wrestler.is_available || selectedElsewhere;

                  const selected = wrestler.id === currentId;

                  return (
                    <li key={wrestler.id}>
                      <button
                        className="match-editor__roster-option"
                        type="button"
                        disabled={disabled || unavailable}
                        aria-pressed={selected}
                        onClick={() => chooseWrestler(wrestler.id)}
                      >
                        <span
                          className="match-editor__option-image"
                          aria-hidden="true"
                        >
                          <MatchEditorImage
                            src={wrestler.image_url}
                            fallback="wrestler"
                          />
                        </span>

                        <span className="match-editor__option-copy">
                          <strong>{wrestler.name}</strong>
                          <span>
                            {!wrestler.is_available
                              ? "Already booked"
                              : selectedElsewhere
                                ? "Selected in another position"
                                : selected
                                  ? "Selected here"
                                  : wrestler.gender === "male"
                                    ? "Male"
                                    : "Female"}
                          </span>
                        </span>

                        {selected && <Check size={16} aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
