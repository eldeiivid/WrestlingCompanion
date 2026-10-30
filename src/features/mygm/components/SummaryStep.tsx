import { useChampionshipCatalog } from "../hooks/useChampionshipCatalog";

import type { CareerConfigurationDraft } from "../types/careerDraft.types";
import type { CareerSetupCatalogs } from "../types/careerSetup.types";
import type {
  ChampionshipSlot,
  ChampionshipsDraft,
} from "../types/championships.types";
import type { RosterWrestler } from "../types/roster.types";

import "./SummaryStep.scss";

interface SummaryStepProps {
  configuration: CareerConfigurationDraft;
  catalogs: CareerSetupCatalogs;
  selectedWrestlers: RosterWrestler[];
  championships: ChampionshipsDraft;
  onEdit: (step: 1 | 2 | 3) => void;
  onBack: () => void;
  isCreating: boolean;
  creationError: string;
  onCreate: () => void;
}

const slotLabels: Record<ChampionshipSlot, string> = {
  worldMale: "Men's World",
  worldFemale: "Women's World",
  midcardMale: "Men's Midcard",
  midcardFemale: "Women's Midcard",
  tagMale: "Men's Tag Team",
  tagFemale: "Women's Tag Team",
};

const numberFormatter = new Intl.NumberFormat("en-US");

export default function SummaryStep({
  configuration,
  catalogs,
  selectedWrestlers,
  championships,
  isCreating,
  creationError,
  onCreate,
  onEdit,
  onBack,
}: SummaryStepProps) {
  const { titles, isLoading, errorMessage, retry } = useChampionshipCatalog();

  const brand = catalogs.brands.find(
    (brand) => brand.id === configuration.brandId,
  );

  const manager = catalogs.managers.find(
    (manager) => manager.id === configuration.managerId,
  );

  const difficulty = catalogs.difficulties.find(
    (difficulty) => difficulty.id === configuration.difficultyId,
  );

  const championshipSlots = Object.keys(slotLabels) as ChampionshipSlot[];

  return (
    <section className="new-career__panel summary-step">
      <h2>Ready to start your career?</h2>

      <p className="summary-step__description">
        Review your setup before creating your career.
      </p>

      <div className="summary-step__grid">
        <section className="summary-section">
          <header className="summary-section__header">
            <h3>Configuration</h3>
            <button
              type="button"
              onClick={() => onEdit(1)}
              disabled={isCreating}
            >
              Edit
            </button>
          </header>

          <dl className="summary-section__details">
            <div>
              <dt>Career name</dt>
              <dd>{configuration.name.trim()}</dd>
            </div>

            <div>
              <dt>Brand</dt>
              <dd>{brand?.name ?? "Unavailable brand"}</dd>
            </div>

            <div>
              <dt>General Manager</dt>
              <dd>{manager?.name ?? "Unavailable manager"}</dd>
            </div>

            <div>
              <dt>Difficulty</dt>
              <dd>{difficulty?.name ?? "Unavailable difficulty"}</dd>
            </div>

            <div>
              <dt>Starting week</dt>
              <dd>{configuration.startWeek}</dd>
            </div>

            <div>
              <dt>Finances</dt>
              <dd>{configuration.financesEnabled ? "Enabled" : "Disabled"}</dd>
            </div>

            {configuration.financesEnabled && (
              <div>
                <dt>Initial money</dt>
                <dd>
                  ${numberFormatter.format(Number(configuration.initialMoney))}
                </dd>
              </div>
            )}

            <div>
              <dt>Fans</dt>
              <dd>{configuration.fansEnabled ? "Enabled" : "Disabled"}</dd>
            </div>

            {configuration.fansEnabled && (
              <div>
                <dt>Initial fans</dt>
                <dd>
                  {numberFormatter.format(Number(configuration.initialFans))}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="summary-section">
          <header className="summary-section__header">
            <h3>Starting roster</h3>
            <button
              type="button"
              onClick={() => onEdit(2)}
              disabled={isCreating}
            >
              Edit
            </button>
          </header>

          <p className="summary-section__count">
            {selectedWrestlers.length} wrestlers selected
          </p>

          <ul className="summary-section__roster">
            {selectedWrestlers.map((wrestler) => (
              <li key={wrestler.id}>
                <span>{wrestler.name}</span>
                <span>
                  {wrestler.default_role === "face" ? "Face" : "Heel"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="summary-section summary-section--wide">
          <header className="summary-section__header">
            <h3>Championships</h3>
            <button
              type="button"
              onClick={() => onEdit(3)}
              disabled={isCreating}
            >
              Edit
            </button>
          </header>

          {isLoading ? (
            <p role="status">Loading championship details…</p>
          ) : errorMessage ? (
            <div>
              <p role="alert">{errorMessage}</p>

              <button
                className="new-career__button"
                type="button"
                onClick={retry}
              >
                Try again
              </button>
            </div>
          ) : (
            <ul className="summary-section__titles">
              {championshipSlots.map((slot) => {
                const selection = championships.selections[slot];

                const title = titles.find(
                  (title) => title.id === selection.titleId,
                );

                const holders = selection.championIds.map(
                  (id) =>
                    selectedWrestlers.find((wrestler) => wrestler.id === id)
                      ?.name ?? "Unavailable wrestler",
                );

                return (
                  <li key={slot}>
                    <div>
                      <p className="summary-section__slot">
                        {slotLabels[slot]}
                      </p>

                      <strong>
                        {selection.titleId
                          ? (title?.name ?? "Unavailable championship")
                          : "No title selected"}
                      </strong>
                    </div>

                    {selection.titleId && (
                      <span className="summary-section__holders">
                        {holders.length > 0 ? holders.join(" & ") : "Vacant"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="summary-section__mitb">
            <strong>Money in the Bank</strong>
            <p>
              {championships.mitbEnabled
                ? "Enabled for men and women · No initial holders"
                : "Disabled"}
            </p>
          </div>
        </section>
      </div>

      {creationError && (
        <p className="new-career__error" role="alert">
          {creationError}
        </p>
      )}

      <footer className="new-career__actions">
        <button
          className="new-career__button"
          type="button"
          onClick={onBack}
          disabled={isCreating}
        >
          Back
        </button>

        <button
          className="new-career__button new-career__button--primary"
          type="button"
          onClick={onCreate}
          disabled={isCreating || isLoading || Boolean(errorMessage)}
          aria-busy={isCreating}
        >
          {isCreating ? "Creating career…" : "Create career"}
        </button>
      </footer>
    </section>
  );
}
