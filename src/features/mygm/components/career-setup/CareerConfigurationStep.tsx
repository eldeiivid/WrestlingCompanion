import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Gamepad2, UserRound } from "lucide-react";

import type { CareerConfigurationDraft } from "../../types/careerDraft.types";
import type { CareerSetupCatalogs } from "../../types/careerSetup.types";

import "./CareerConfigurationStep.scss";

interface CareerConfigurationStepProps {
  catalogs: CareerSetupCatalogs;
  configuration: CareerConfigurationDraft;
  validationError: string;
  onFieldChange: <K extends keyof CareerConfigurationDraft>(
    field: K,
    value: CareerConfigurationDraft[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

interface OptionImageProps {
  src: string | null;
  fallback: ReactNode;
}

function OptionImage({ src, fallback }: OptionImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
  ) : (
    fallback
  );
}

export default function CareerConfigurationStep({
  catalogs,
  configuration,
  validationError,
  onFieldChange,
  onSubmit,
}: CareerConfigurationStepProps) {
  const [showAllManagers, setShowAllManagers] = useState(false);

  const firstManagers = catalogs.managers.slice(0, 4);

  const selectedManager = catalogs.managers.find(
    (manager) => manager.id === configuration.managerId,
  );

  // Keep the selected manager visible when collapsing the list.
  const collapsedManagers =
    selectedManager &&
    !firstManagers.some((manager) => manager.id === selectedManager.id)
      ? [...firstManagers.slice(0, 3), selectedManager]
      : firstManagers;

  const visibleManagers = showAllManagers
    ? catalogs.managers
    : collapsedManagers;

  return (
    <form
      className="career-configuration"
      onSubmit={onSubmit}
      aria-describedby={
        validationError ? "career-configuration-error" : undefined
      }
    >
      <header className="career-configuration__heading">
        <h2>Make this career yours.</h2>
        <p>Match these details to your WWE 2K26 save.</p>
      </header>

      <div className="career-configuration__field">
        <label htmlFor="career-name">Career name</label>

        <input
          id="career-name"
          name="careerName"
          type="text"
          placeholder="RAW: A new era"
          value={configuration.name}
          onChange={(event) => onFieldChange("name", event.target.value)}
          maxLength={80}
          required
        />
      </div>

      <fieldset className="career-configuration__section">
        <legend>Your brand</legend>

        <p className="career-configuration__hint">
          Choose the brand you will lead.
        </p>

        <div className="career-configuration__brands">
          {catalogs.brands.map((brand) => (
            <label
              className="career-configuration__choice career-configuration__choice--brand"
              key={brand.id}
            >
              <input
                className="career-configuration__choice-input"
                type="radio"
                name="careerBrand"
                value={brand.id}
                checked={configuration.brandId === brand.id}
                onChange={() => onFieldChange("brandId", brand.id)}
                required
              />

              <span className="career-configuration__choice-content">
                <span
                  className="career-configuration__brand-image"
                  aria-hidden="true"
                >
                  <OptionImage
                    src={brand.logo_url}
                    fallback={<Gamepad2 size={32} />}
                  />
                </span>

                <span className="career-configuration__choice-name">
                  {brand.name}
                </span>

                {configuration.brandId === brand.id && (
                  <span
                    className="career-configuration__check"
                    aria-hidden="true"
                  >
                    <Check size={13} />
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="career-configuration__section">
        <legend>Your General Manager</legend>

        <p className="career-configuration__hint">
          Who will guide your brand through the season?
        </p>

        <div
          className="career-configuration__managers"
          id="career-manager-options"
        >
          {visibleManagers.map((manager) => (
            <label
              className="career-configuration__choice career-configuration__choice--manager"
              key={manager.id}
            >
              <input
                className="career-configuration__choice-input"
                type="radio"
                name="careerManager"
                value={manager.id}
                checked={configuration.managerId === manager.id}
                onChange={() => onFieldChange("managerId", manager.id)}
                required
              />

              <span className="career-configuration__choice-content">
                <span
                  className="career-configuration__manager-image"
                  aria-hidden="true"
                >
                  <OptionImage
                    src={manager.image_url}
                    fallback={<UserRound size={42} />}
                  />
                </span>

                <span className="career-configuration__choice-name">
                  {manager.name}
                </span>

                {configuration.managerId === manager.id && (
                  <span
                    className="career-configuration__check"
                    aria-hidden="true"
                  >
                    <Check size={13} />
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
        {catalogs.managers.length > 4 && (
          <button
            className="career-configuration__show-managers"
            type="button"
            aria-expanded={showAllManagers}
            aria-controls="career-manager-options"
            onClick={() => setShowAllManagers((previous) => !previous)}
          >
            {showAllManagers
              ? "Show fewer"
              : `Show all ${catalogs.managers.length} GMs`}
          </button>
        )}
      </fieldset>

      <section
        className="career-configuration__section"
        aria-labelledby="career-rules-title"
      >
        <h3 id="career-rules-title">Season setup</h3>

        <p className="career-configuration__hint">
          Use the difficulty and week from your game.
        </p>

        <div className="career-configuration__grid">
          <div className="career-configuration__field">
            <label htmlFor="career-difficulty">Difficulty</label>

            <select
              id="career-difficulty"
              value={configuration.difficultyId}
              onChange={(event) =>
                onFieldChange("difficultyId", event.target.value)
              }
              required
            >
              <option value="">Select a difficulty</option>

              {catalogs.difficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="career-configuration__field">
            <label htmlFor="career-week">Starting week</label>

            <input
              id="career-week"
              type="number"
              min={1}
              max={50}
              step={1}
              value={configuration.startWeek}
              onChange={(event) =>
                onFieldChange("startWeek", event.target.value)
              }
              required
            />
          </div>
        </div>
      </section>

      <section
        className="career-configuration__section"
        aria-labelledby="career-tracking-title"
      >
        <h3 id="career-tracking-title">What would you like to track?</h3>

        <p className="career-configuration__hint">
          Enable the totals you want to record during your career.
        </p>

        <div className="career-configuration__grid">
          <div className="career-configuration__tracking">
            <label className="career-configuration__toggle">
              <span>Finances</span>

              <input
                type="checkbox"
                checked={configuration.financesEnabled}
                onChange={(event) =>
                  onFieldChange("financesEnabled", event.target.checked)
                }
                aria-describedby="career-finances-hint"
              />
            </label>

            <p id="career-finances-hint">
              Keep track of your income, expenses and budget.
            </p>

            {configuration.financesEnabled && (
              <div className="career-configuration__field">
                <label htmlFor="career-money">Starting budget</label>

                <input
                  id="career-money"
                  type="number"
                  min={0}
                  step={1}
                  value={configuration.initialMoney}
                  onChange={(event) =>
                    onFieldChange("initialMoney", event.target.value)
                  }
                  required
                />
              </div>
            )}
          </div>

          <div className="career-configuration__tracking">
            <label className="career-configuration__toggle">
              <span>Fans</span>

              <input
                type="checkbox"
                checked={configuration.fansEnabled}
                onChange={(event) =>
                  onFieldChange("fansEnabled", event.target.checked)
                }
                aria-describedby="career-fans-hint"
              />
            </label>

            <p id="career-fans-hint">
              Follow your audience gains and losses each week.
            </p>

            {configuration.fansEnabled && (
              <div className="career-configuration__field">
                <label htmlFor="career-fans">Starting fans</label>

                <input
                  id="career-fans"
                  type="number"
                  min={0}
                  step={1}
                  value={configuration.initialFans}
                  onChange={(event) =>
                    onFieldChange("initialFans", event.target.value)
                  }
                  required
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {validationError && (
        <p
          className="career-configuration__error"
          id="career-configuration-error"
          role="alert"
        >
          {validationError}
        </p>
      )}

      <footer className="career-configuration__actions">
        <Link className="career-configuration__button" to="/mygm">
          Cancel
        </Link>

        <button
          className="career-configuration__button career-configuration__button--primary"
          type="submit"
        >
          Choose your roster
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </footer>
    </form>
  );
}
