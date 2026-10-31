import { useEffect, useId, useRef, useState } from "react";
import { Check, Search, UserPlus, UserRound, X } from "lucide-react";

import type {
  BookingPromoRole,
  BookingPromoWrestler,
} from "../../types/booking.types";

interface PromoSlot {
  role: BookingPromoRole;
  label: string;
}

interface PromoParticipantPickerProps {
  slots: PromoSlot[];
  participantIds: string[];
  wrestlers: BookingPromoWrestler[];
  disabled: boolean;
  getUnavailableReason: (
    wrestler: BookingPromoWrestler,
    index: number,
  ) => string;
  onChange: (index: number, wrestlerId: string) => void;
}

function Portrait({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(src)}
    />
  ) : (
    <UserRound size={32} strokeWidth={1.25} aria-hidden="true" />
  );
}

export default function PromoParticipantPicker({
  slots,
  participantIds,
  wrestlers,
  disabled,
  getUnavailableReason,
  onChange,
}: PromoParticipantPickerProps) {
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

  const activeSlot = activeIndex === null ? null : slots[activeIndex];

  const currentId =
    activeIndex === null ? "" : (participantIds[activeIndex] ?? "");

  const normalizedSearch = search.trim().toLocaleLowerCase();

  const visibleWrestlers = wrestlers.filter((wrestler) =>
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

  function chooseWrestler(wrestler: BookingPromoWrestler) {
    if (
      disabled ||
      activeIndex === null ||
      getUnavailableReason(wrestler, activeIndex)
    ) {
      return;
    }

    onChange(activeIndex, wrestler.id);
    closePicker();
  }

  return (
    <div className="promo-editor__picker">
      <div className="promo-editor__slots">
        {slots.map((slot, index) => {
          const selectedId = participantIds[index] ?? "";
          const selected = wrestlers.find(
            (wrestler) => wrestler.id === selectedId,
          );

          return (
            <div
              className={`promo-editor__slot${
                activeIndex === index ? " promo-editor__slot--active" : ""
              }`}
              key={`${slot.role}-${index}`}
            >
              <button
                ref={(node) => {
                  slotRefs.current[index] = node;
                }}
                className="promo-editor__slot-button"
                type="button"
                disabled={disabled}
                aria-expanded={activeIndex === index}
                aria-controls={panelId}
                aria-label={`Choose ${slot.label}${
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
                <span className="promo-editor__slot-image" aria-hidden="true">
                  {selected ? (
                    <Portrait src={selected.image_url} />
                  ) : (
                    <UserPlus size={28} strokeWidth={1.25} />
                  )}
                </span>

                <span className="promo-editor__slot-copy">
                  <span>{slot.label}</span>
                  <strong>{selected?.name ?? "Choose wrestler"}</strong>
                </span>
              </button>

              {selectedId && (
                <button
                  className="promo-editor__clear-slot"
                  type="button"
                  disabled={disabled}
                  aria-label={`Remove ${
                    selected?.name ?? "wrestler"
                  } from ${slot.label}`}
                  onClick={() => onChange(index, "")}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <section
        className="promo-editor__roster-picker"
        id={panelId}
        hidden={!activeSlot}
        aria-label="Choose a promo participant"
      >
        {activeSlot && activeIndex !== null && (
          <>
            <header className="promo-editor__picker-header">
              <div>
                <h4>{activeSlot.label}</h4>
                <p>Choose a wrestler for this position.</p>
              </div>

              <button
                className="promo-editor__picker-close"
                type="button"
                disabled={disabled}
                aria-label="Close wrestler selection"
                onClick={closePicker}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <label className="promo-editor__search" htmlFor={searchId}>
              <span className="promo-editor__sr-only">Search wrestlers</span>

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
              <p className="promo-editor__picker-empty" role="status">
                No wrestlers match this search.
              </p>
            ) : (
              <ul className="promo-editor__roster-options">
                {visibleWrestlers.map((wrestler) => {
                  const reason = getUnavailableReason(wrestler, activeIndex);
                  const selected = wrestler.id === currentId;

                  return (
                    <li key={wrestler.id}>
                      <button
                        className="promo-editor__roster-option"
                        type="button"
                        disabled={disabled || reason !== ""}
                        aria-pressed={selected}
                        onClick={() => chooseWrestler(wrestler)}
                      >
                        <span
                          className="promo-editor__option-image"
                          aria-hidden="true"
                        >
                          <Portrait src={wrestler.image_url} />
                        </span>

                        <span className="promo-editor__option-copy">
                          <strong>{wrestler.name}</strong>
                          <span>
                            {reason ||
                              (selected ? "Selected here" : "Available")}
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
