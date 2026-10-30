import { useState } from "react";
import { Trophy } from "lucide-react";

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

  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [division, setDivision] = useState("");
  const [category, setCategory] = useState("");
  const [validationError, setValidationError] = useState("");

  const hasBothMitb = ["male", "female"].every((gender) =>
    titles.some(
      (title) =>
        title.category === "mitb" &&
        title.division === "singles" &&
        title.gender === gender,
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

  function handleNext() {
    if (isLoading || errorMessage) return;

    const selectedTitles = new Set<string>();

    for (const slot of slots) {
      const selection = draft.selections[slot.key];

      if (!selection.titleId) {
        if (selection.championIds.length > 0) {
          setValidationError(
            "Please select a title before assigning champions.",
          );
          return;
        }

        continue;
      }

      const title = titles.find((title) => title.id === selection.titleId);

      if (!title || !matchesSlot(title, slot)) {
        setValidationError(`Please review ${slot.label}.`);
        return;
      }

      if (selectedTitles.has(selection.titleId)) {
        setValidationError("A championship can only be selected once.");
        return;
      }

      selectedTitles.add(selection.titleId);

      const holders = selection.championIds;

      if (holders.length !== 0 && holders.length !== slot.holders) {
        setValidationError(
          `Assign ${slot.holders} champion${slot.holders === 2 ? "s" : ""} to ${slot.label}, or leave it vacant.`,
        );
        return;
      }

      const validHolders = holders.every((id) =>
        selectedWrestlers.some(
          (wrestler) => wrestler.id === id && wrestler.gender === slot.gender,
        ),
      );

      if (!validHolders || new Set(holders).size !== holders.length) {
        setValidationError(
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
      <div className="new-career__field" key={inputId}>
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
    <section className="new-career__panel championships-step">
      <h2>Choose your championships</h2>
      <p className="championships-step__description">
        Select up to six titles. Assign champions from your roster or leave
        titles vacant.
      </p>

      {isLoading ? (
        <p role="status">Loading championships…</p>
      ) : errorMessage ? (
        <div>
          <p role="alert">{errorMessage}</p>
          <button className="new-career__button" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="championships-step__filters">
            <div className="new-career__field">
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

            <div className="new-career__field">
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

            <div className="new-career__field">
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

          <p className="championships-step__count" role="status">
            {selectedCount} of 6 titles selected
          </p>

          <div className="championships-step__grid">
            {visibleSlots.map((slot) => {
              const selection = draft.selections[slot.key];
              const selectedTitle = titles.find(
                (title) => title.id === selection.titleId,
              );

              const availableTitles = titles.filter(
                (title) =>
                  matchesSlot(title, slot) &&
                  (title.id === selection.titleId ||
                    title.name
                      .toLowerCase()
                      .includes(search.trim().toLowerCase())),
              );

              return (
                <article className="championship-slot" key={slot.key}>
                  <header className="championship-slot__header">
                    {selectedTitle?.image_url ? (
                      <img src={selectedTitle.image_url} alt="" />
                    ) : (
                      <Trophy size={28} aria-hidden="true" />
                    )}
                    <h3>{slot.label}</h3>
                  </header>

                  <div className="new-career__field">
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

                  {renderChampionSelect(slot, 0)}
                  {slot.holders === 2 && renderChampionSelect(slot, 1)}
                </article>
              );
            })}
          </div>

          {visibleSlots.length === 0 && (
            <p>No championship slots match your filters.</p>
          )}

          <section className="championships-step__mitb">
            <label className="new-career__toggle">
              <input
                type="checkbox"
                checked={draft.mitbEnabled}
                disabled={!hasBothMitb && !draft.mitbEnabled}
                onChange={(event) => {
                  onChange({ ...draft, mitbEnabled: event.target.checked });
                  setValidationError("");
                }}
              />
              Enable Money in the Bank
            </label>

            <p>
              Activates both men's and women's briefcases. No initial holders.
            </p>

            {!hasBothMitb && <p>Money in the Bank is currently unavailable.</p>}
          </section>
        </>
      )}

      {validationError && (
        <p className="new-career__error" role="alert">
          {validationError}
        </p>
      )}

      <footer className="new-career__actions">
        <button className="new-career__button" type="button" onClick={onBack}>
          Back
        </button>

        <button
          className="new-career__button new-career__button--primary"
          type="button"
          disabled={isLoading || Boolean(errorMessage)}
          onClick={handleNext}
        >
          Next
        </button>
      </footer>
    </section>
  );
}
