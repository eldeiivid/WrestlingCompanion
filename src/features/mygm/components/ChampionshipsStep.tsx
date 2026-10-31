import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  ChevronDown,
  SlidersHorizontal,
  Trophy,
  UserRound,
} from "lucide-react";

import { useChampionshipCatalog } from "../hooks/useChampionshipCatalog";
import type {
  CatalogChampionship,
  ChampionshipSlot,
  ChampionshipsDraft,
} from "../types/championships.types";
import type { RosterWrestler } from "../types/roster.types";

import "./ChampionshipsStep.scss";

interface SlotDefinition {
  key: ChampionshipSlot;
  label: string;
  gender: "male" | "female";
  division: "singles" | "tag_team";
  category: "world" | "midcard" | "tag_team";
  holders: 1 | 2;
}

const slots: SlotDefinition[] = [
  {
    key: "worldMale",
    label: "Men's World Championship",
    gender: "male",
    division: "singles",
    category: "world",
    holders: 1,
  },
  {
    key: "worldFemale",
    label: "Women's World Championship",
    gender: "female",
    division: "singles",
    category: "world",
    holders: 1,
  },
  {
    key: "midcardMale",
    label: "Men's Midcard Championship",
    gender: "male",
    division: "singles",
    category: "midcard",
    holders: 1,
  },
  {
    key: "midcardFemale",
    label: "Women's Midcard Championship",
    gender: "female",
    division: "singles",
    category: "midcard",
    holders: 1,
  },
  {
    key: "tagMale",
    label: "Men's Tag Team Championship",
    gender: "male",
    division: "tag_team",
    category: "tag_team",
    holders: 2,
  },
  {
    key: "tagFemale",
    label: "Women's Tag Team Championship",
    gender: "female",
    division: "tag_team",
    category: "tag_team",
    holders: 2,
  },
];

function matchesSlot(
  title: CatalogChampionship,
  slot: SlotDefinition,
): boolean {
  return (
    title.gender === slot.gender &&
    title.division === slot.division &&
    title.category === slot.category
  );
}

function Artwork({
  src,
  kind,
}: {
  src: string | null;
  kind: "title" | "person";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
    );
  }

  return kind === "title" ? (
    <Trophy size={30} aria-hidden="true" />
  ) : (
    <UserRound size={22} aria-hidden="true" />
  );
}

interface ChampionshipsStepProps {
  draft: ChampionshipsDraft;
  selectedWrestlers: RosterWrestler[];
  onChange: (draft: ChampionshipsDraft) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ChampionshipsStep({
  draft,
  selectedWrestlers,
  onChange,
  onBack,
  onNext,
}: ChampionshipsStepProps) {
  const { titles, isLoading, errorMessage, retry } = useChampionshipCatalog();

  const [gender, setGender] = useState("");
  const [division, setDivision] = useState("");
  const [category, setCategory] = useState("");
  const [openSlot, setOpenSlot] = useState<ChampionshipSlot | null>(null);
  const [validationError, setValidationError] = useState("");

  const hasBothMitb = ["male", "female"].every((value) =>
    titles.some(
      (title) =>
        title.category === "mitb" &&
        title.division === "singles" &&
        title.gender === value,
    ),
  );

  const visibleSlots = slots.filter(
    (slot) =>
      (!gender || slot.gender === gender) &&
      (!division || slot.division === division) &&
      (!category || slot.category === category),
  );

  const selectedCount = Object.values(draft.selections).filter(
    (selection) => selection.titleId,
  ).length;

  const activeFilterCount = [gender, division, category].filter(Boolean).length;

  function selectTitle(slot: ChampionshipSlot, titleId: string) {
    onChange({
      ...draft,
      selections: {
        ...draft.selections,
        [slot]: {
          titleId,
          championIds: [],
        },
      },
    });

    setValidationError("");
  }

  function selectChampion(
    slot: ChampionshipSlot,
    index: number,
    wrestlerId: string,
  ) {
    const selection = draft.selections[slot];
    let championIds: string[];

    if (index === 0) {
      const second = selection.championIds[1];

      championIds = wrestlerId
        ? second && second !== wrestlerId
          ? [wrestlerId, second]
          : [wrestlerId]
        : [];
    } else {
      const first = selection.championIds[0];

      championIds = first ? (wrestlerId ? [first, wrestlerId] : [first]) : [];
    }

    onChange({
      ...draft,
      selections: {
        ...draft.selections,
        [slot]: {
          ...selection,
          championIds,
        },
      },
    });

    setValidationError("");
  }

  function showSlotError(slot: ChampionshipSlot, message: string) {
    setGender("");
    setDivision("");
    setCategory("");
    setOpenSlot(slot);
    setValidationError(message);
  }

  function handleNext() {
    if (isLoading || errorMessage) return;

    const selectedTitles = new Set<string>();

    for (const slot of slots) {
      const selection = draft.selections[slot.key];

      if (!selection.titleId) {
        if (selection.championIds.length > 0) {
          showSlotError(
            slot.key,
            "Please select a title before assigning champions.",
          );
          return;
        }

        continue;
      }

      const title = titles.find((item) => item.id === selection.titleId);

      if (!title || !matchesSlot(title, slot)) {
        showSlotError(slot.key, `Please review ${slot.label}.`);
        return;
      }

      if (selectedTitles.has(selection.titleId)) {
        showSlotError(slot.key, "A championship can only be selected once.");
        return;
      }

      selectedTitles.add(selection.titleId);

      const holders = selection.championIds;

      if (holders.length !== 0 && holders.length !== slot.holders) {
        showSlotError(
          slot.key,
          `Assign ${slot.holders} champion${
            slot.holders === 2 ? "s" : ""
          } to ${slot.label}, or leave it vacant.`,
        );
        return;
      }

      const validHolders = holders.every((id) =>
        selectedWrestlers.some(
          (wrestler) => wrestler.id === id && wrestler.gender === slot.gender,
        ),
      );

      if (!validHolders || new Set(holders).size !== holders.length) {
        showSlotError(
          slot.key,
          `Please select eligible, distinct roster members for ${slot.label}.`,
        );
        return;
      }
    }

    if (draft.mitbEnabled && !hasBothMitb) {
      setValidationError(
        "Both men's and women's Money in the Bank entries must be available.",
      );
      return;
    }

    setValidationError("");
    onNext();
  }

  function renderChampionSelect(slot: SlotDefinition, index: number) {
    const selection = draft.selections[slot.key];
    const selectedId = selection.championIds[index] ?? "";
    const otherId = selection.championIds[index === 0 ? 1 : 0];

    const eligibleWrestlers = selectedWrestlers.filter(
      (wrestler) => wrestler.gender === slot.gender && wrestler.id !== otherId,
    );

    const selectedIsAvailable = eligibleWrestlers.some(
      (wrestler) => wrestler.id === selectedId,
    );

    const inputId = `${slot.key}-champion-${index}`;

    return (
      <div className="championships-step__field" key={inputId}>
        <label htmlFor={inputId}>
          {slot.holders === 1 ? "Initial champion" : `Champion ${index + 1}`}
        </label>

        <select
          id={inputId}
          value={selectedId}
          disabled={
            !selection.titleId || (index === 1 && !selection.championIds[0])
          }
          onChange={(event) =>
            selectChampion(slot.key, index, event.target.value)
          }
        >
          <option value="">
            {index === 0 ? "Vacant" : "Select second champion"}
          </option>

          {selectedId && !selectedIsAvailable && (
            <option value={selectedId} disabled>
              Unavailable wrestler
            </option>
          )}

          {eligibleWrestlers.map((wrestler) => (
            <option key={wrestler.id} value={wrestler.id}>
              {wrestler.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <section
      className="championships-step"
      aria-labelledby="championships-step-title"
    >
      <header className="championships-step__heading">
        <h2 id="championships-step-title">Put the gold in place.</h2>

        <p>
          Choose up to six championships. Assign your initial champions or leave
          the titles vacant.
        </p>
      </header>

      {isLoading ? (
        <p className="championships-step__message" role="status">
          Loading championships…
        </p>
      ) : errorMessage ? (
        <div className="championships-step__state">
          <p role="alert">{errorMessage}</p>

          <button
            className="championships-step__button"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <details className="championships-step__filters">
            <summary>
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filter slots
              {activeFilterCount > 0 && <span>({activeFilterCount})</span>}
            </summary>

            <div className="championships-step__filter-grid">
              <div className="championships-step__field">
                <label htmlFor="title-gender">Gender</label>

                <select
                  id="title-gender"
                  value={gender}
                  onChange={(event) => setGender(event.target.value)}
                >
                  <option value="">All genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="championships-step__field">
                <label htmlFor="title-division">Division</label>

                <select
                  id="title-division"
                  value={division}
                  onChange={(event) => setDivision(event.target.value)}
                >
                  <option value="">All divisions</option>
                  <option value="singles">Singles</option>
                  <option value="tag_team">Tag Team</option>
                </select>
              </div>

              <div className="championships-step__field">
                <label htmlFor="title-category">Category</label>

                <select
                  id="title-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">All categories</option>
                  <option value="world">World</option>
                  <option value="midcard">Midcard</option>
                  <option value="tag_team">Tag Team</option>
                </select>
              </div>
            </div>
          </details>

          <div className="championships-step__grid">
            {visibleSlots.map((slot) => {
              const selection = draft.selections[slot.key];

              const selectedTitle = titles.find(
                (title) => title.id === selection.titleId,
              );

              const availableTitles = titles.filter((title) =>
                matchesSlot(title, slot),
              );

              const holders = selection.championIds
                .map((id) =>
                  selectedWrestlers.find((wrestler) => wrestler.id === id),
                )
                .filter(
                  (wrestler): wrestler is RosterWrestler =>
                    wrestler !== undefined,
                );

              const validChampions =
                selection.championIds.length === slot.holders &&
                new Set(selection.championIds).size === slot.holders &&
                holders.length === slot.holders &&
                holders.every((wrestler) => wrestler.gender === slot.gender);

              const validTitle =
                selectedTitle !== undefined && matchesSlot(selectedTitle, slot);

              const status = !selection.titleId
                ? "Not selected"
                : !validTitle
                  ? "Review title"
                  : selection.championIds.length === 0
                    ? "Vacant"
                    : validChampions
                      ? "Champions assigned"
                      : "Review champions";

              return (
                <details
                  className={[
                    "championship-choice",
                    selection.titleId ? "has-title" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={slot.key}
                  open={openSlot === slot.key}
                >
                  <summary
                    onClick={(event) => {
                      event.preventDefault();

                      setOpenSlot((previous) =>
                        previous === slot.key ? null : slot.key,
                      );
                    }}
                  >
                    <span
                      className="championship-choice__art"
                      aria-hidden="true"
                    >
                      <Artwork
                        src={selectedTitle?.image_url ?? null}
                        kind="title"
                      />
                    </span>

                    <span className="championship-choice__summary">
                      <strong>{slot.label}</strong>

                      <span className="championship-choice__title-name">
                        {selectedTitle?.name || "Choose a championship"}
                      </span>

                      <span className="championship-choice__status">
                        {status}
                      </span>
                    </span>

                    <ChevronDown
                      className="championship-choice__chevron"
                      size={18}
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="championship-choice__content">
                    <div className="championships-step__field">
                      <label htmlFor={`${slot.key}-title`}>Championship</label>

                      <select
                        id={`${slot.key}-title`}
                        value={selection.titleId}
                        onChange={(event) =>
                          selectTitle(slot.key, event.target.value)
                        }
                      >
                        <option value="">No title selected</option>

                        {selection.titleId &&
                          !availableTitles.some(
                            (title) => title.id === selection.titleId,
                          ) && (
                            <option value={selection.titleId} disabled>
                              Unavailable championship
                            </option>
                          )}

                        {availableTitles.map((title) => (
                          <option key={title.id} value={title.id}>
                            {title.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selection.titleId && (
                      <>
                        <div className="championship-choice__champion-fields">
                          {renderChampionSelect(slot, 0)}

                          {slot.holders === 2 && renderChampionSelect(slot, 1)}
                        </div>

                        {holders.length > 0 && (
                          <ul
                            className="championship-choice__holders"
                            aria-label="Selected champions"
                          >
                            {holders.map((holder) => (
                              <li key={holder.id}>
                                <span
                                  className="championship-choice__holder-image"
                                  aria-hidden="true"
                                >
                                  <Artwork
                                    src={holder.image_url}
                                    kind="person"
                                  />
                                </span>

                                <span>{holder.name}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {selection.championIds.length === 0 && (
                          <p className="championship-choice__hint">
                            This title will start vacant.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </details>
              );
            })}
          </div>

          {visibleSlots.length === 0 && (
            <p className="championships-step__message">
              No championship slots match your filters.
            </p>
          )}

          <section className="championships-step__mitb">
            <div className="championships-step__mitb-heading">
              <Briefcase size={22} aria-hidden="true" />

              <label htmlFor="setup-mitb">Money in the Bank</label>

              <input
                id="setup-mitb"
                type="checkbox"
                checked={draft.mitbEnabled}
                disabled={!hasBothMitb && !draft.mitbEnabled}
                aria-describedby="setup-mitb-description"
                onChange={(event) => {
                  onChange({
                    ...draft,
                    mitbEnabled: event.target.checked,
                  });

                  setValidationError("");
                }}
              />
            </div>

            <p id="setup-mitb-description">
              Enable both men's and women's briefcases. They will start without
              holders.
            </p>

            {!hasBothMitb && <p>Money in the Bank is currently unavailable.</p>}
          </section>
        </>
      )}

      {validationError && (
        <p className="championships-step__error" role="alert">
          {validationError}
        </p>
      )}

      <footer className="championships-step__actions">
        <p role="status">
          <Trophy size={17} aria-hidden="true" />
          {selectedCount} of 6 titles selected
        </p>

        <div>
          <button
            className="championships-step__button"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Back
          </button>

          <button
            className="championships-step__button championships-step__button--primary"
            type="button"
            disabled={isLoading || Boolean(errorMessage)}
            onClick={handleNext}
          >
            Review
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </section>
  );
}
