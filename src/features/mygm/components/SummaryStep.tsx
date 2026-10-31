import { useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  ChevronDown,
  Gamepad2,
  LoaderCircle,
  Pencil,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

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

type SummaryTheme = CSSProperties & {
  "--review-tint": string;
};

const slotLabels: Record<ChampionshipSlot, string> = {
  worldMale: "Men's World",
  worldFemale: "Women's World",
  midcardMale: "Men's Midcard",
  midcardFemale: "Women's Midcard",
  tagMale: "Men's Tag Team",
  tagFemale: "Women's Tag Team",
};

const numberFormatter = new Intl.NumberFormat("en-US");

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function SummaryArtwork({
  src,
  kind,
}: {
  src: string | null;
  kind: "brand" | "person" | "title";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
    );
  }

  if (kind === "brand") {
    return <Gamepad2 size={36} aria-hidden="true" />;
  }

  if (kind === "title") {
    return <Trophy size={30} aria-hidden="true" />;
  }

  return <UserRound size={30} aria-hidden="true" />;
}

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
    (item) => item.id === configuration.brandId,
  );

  const manager = catalogs.managers.find(
    (item) => item.id === configuration.managerId,
  );

  const difficulty = catalogs.difficulties.find(
    (item) => item.id === configuration.difficultyId,
  );

  const championshipSlots = Object.keys(slotLabels) as ChampionshipSlot[];

  const selectedSlots = championshipSlots.filter(
    (slot) => championships.selections[slot].titleId,
  );

  const brandColor =
    brand?.primary_color && /^#[0-9a-f]{6}$/i.test(brand.primary_color)
      ? brand.primary_color
      : "#B095FF";

  const theme: SummaryTheme = {
    "--review-tint": `${brandColor}35`,
  };

  return (
    <section className="summary-step" aria-labelledby="career-summary-title">
      <header className="summary-step__heading">
        <h2 id="career-summary-title">Your next chapter is ready.</h2>

        <p>Take one last look at your setup before creating your career.</p>
      </header>

      <div
        className={[
          "summary-step__hero",
          manager?.image_url ? "has-manager" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={theme}
      >
        <div className="summary-step__hero-copy">
          <span className="summary-step__brand-logo" aria-hidden="true">
            <SummaryArtwork src={brand?.logo_url ?? null} kind="brand" />
          </span>

          <p className="summary-step__brand-name">
            {brand?.name ?? "Unavailable brand"}
          </p>

          <h3>{configuration.name.trim()}</h3>

          <p className="summary-step__manager">
            <span>General Manager</span>
            <strong>{manager?.name ?? "Unavailable manager"}</strong>
          </p>
        </div>

        {manager?.image_url && (
          <div className="summary-step__hero-portrait" aria-hidden="true">
            <SummaryArtwork src={manager.image_url} kind="person" />
          </div>
        )}
      </div>

      <section
        className="career-review"
        aria-labelledby="review-configuration-title"
      >
        <header className="career-review__header">
          <h3 id="review-configuration-title">Starting setup</h3>

          <button
            className="career-review__edit"
            type="button"
            onClick={() => onEdit(1)}
            disabled={isCreating}
            aria-label="Edit career configuration"
          >
            <Pencil size={15} aria-hidden="true" />
            Edit
          </button>
        </header>

        <dl className="career-review__configuration">
          <div>
            <dt>Difficulty</dt>
            <dd>{difficulty?.name ?? "Unavailable difficulty"}</dd>
          </div>

          <div>
            <dt>Starting week</dt>
            <dd>Week {configuration.startWeek} of 50</dd>
          </div>

          <div>
            <dt>Starting budget</dt>
            <dd>
              {configuration.financesEnabled
                ? moneyFormatter.format(Number(configuration.initialMoney))
                : "Not tracked"}
            </dd>
          </div>

          <div>
            <dt>Starting fans</dt>
            <dd>
              {configuration.fansEnabled
                ? numberFormatter.format(Number(configuration.initialFans))
                : "Not tracked"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="career-review" aria-labelledby="review-roster-title">
        <header className="career-review__header">
          <h3 id="review-roster-title">
            <UsersRound size={19} aria-hidden="true" />
            Starting roster
          </h3>

          <button
            className="career-review__edit"
            type="button"
            onClick={() => onEdit(2)}
            disabled={isCreating}
            aria-label="Edit starting roster"
          >
            <Pencil size={15} aria-hidden="true" />
            Edit
          </button>
        </header>

        <details className="career-review__details">
          <summary>
            <span>
              {selectedWrestlers.length}{" "}
              {selectedWrestlers.length === 1
                ? "wrestler selected"
                : "wrestlers selected"}
            </span>

            <ChevronDown size={18} aria-hidden="true" />
          </summary>

          <ul className="career-review__roster" aria-label="Starting roster">
            {selectedWrestlers.map((wrestler) => (
              <li key={wrestler.id}>
                <span
                  className="career-review__wrestler-image"
                  aria-hidden="true"
                >
                  <SummaryArtwork src={wrestler.image_url} kind="person" />
                </span>

                <div>
                  <strong>{wrestler.name}</strong>

                  <span>
                    {wrestler.default_role === "face" ? "Face" : "Heel"}
                    {" · "}
                    {wrestler.primary_class?.trim() || "Unclassified"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section
        className="career-review"
        aria-labelledby="review-championships-title"
      >
        <header className="career-review__header">
          <h3 id="review-championships-title">
            <Trophy size={19} aria-hidden="true" />
            Championships
          </h3>

          <button
            className="career-review__edit"
            type="button"
            onClick={() => onEdit(3)}
            disabled={isCreating}
            aria-label="Edit championships"
          >
            <Pencil size={15} aria-hidden="true" />
            Edit
          </button>
        </header>

        <div aria-busy={isLoading}>
          {isLoading ? (
            <p className="career-review__message" role="status">
              Loading championship details…
            </p>
          ) : errorMessage ? (
            <div className="career-review__load-error">
              <p role="alert">{errorMessage}</p>

              <button
                className="summary-step__button"
                type="button"
                onClick={retry}
                disabled={isCreating}
              >
                Try again
              </button>
            </div>
          ) : selectedSlots.length === 0 ? (
            <p className="career-review__message">No championships selected.</p>
          ) : (
            <details className="career-review__details">
              <summary>
                <span>{selectedSlots.length} of 6 titles selected</span>

                <ChevronDown size={18} aria-hidden="true" />
              </summary>

              <ul className="career-review__titles">
                {selectedSlots.map((slot) => {
                  const selection = championships.selections[slot];

                  const title = titles.find(
                    (item) => item.id === selection.titleId,
                  );

                  const holders = selection.championIds.map(
                    (id) =>
                      selectedWrestlers.find((wrestler) => wrestler.id === id)
                        ?.name ?? "Unavailable wrestler",
                  );

                  return (
                    <li key={slot}>
                      <span
                        className="career-review__title-image"
                        aria-hidden="true"
                      >
                        <SummaryArtwork
                          src={title?.image_url ?? null}
                          kind="title"
                        />
                      </span>

                      <div>
                        <span className="career-review__slot">
                          {slotLabels[slot]}
                        </span>

                        <strong>
                          {title?.name ?? "Unavailable championship"}
                        </strong>

                        <span className="career-review__holders">
                          {holders.length > 0 ? holders.join(" & ") : "Vacant"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </div>

        <div className="career-review__mitb">
          <Briefcase size={20} aria-hidden="true" />

          <div>
            <strong>Money in the Bank</strong>

            <p>
              {championships.mitbEnabled
                ? "Men's and women's briefcases · No initial holders"
                : "Not enabled"}
            </p>
          </div>
        </div>
      </section>

      {creationError && (
        <p className="summary-step__error" role="alert">
          {creationError}
        </p>
      )}

      <footer className="summary-step__actions">
        <button
          className="summary-step__button"
          type="button"
          onClick={onBack}
          disabled={isCreating}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back
        </button>

        <button
          className="summary-step__button summary-step__button--primary"
          type="button"
          onClick={onCreate}
          disabled={isCreating || isLoading || Boolean(errorMessage)}
          aria-busy={isCreating}
        >
          {isCreating ? (
            <>
              <LoaderCircle
                className="summary-step__spinner"
                size={18}
                aria-hidden="true"
              />
              Creating career…
            </>
          ) : (
            <>
              Create career
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </footer>
    </section>
  );
}
