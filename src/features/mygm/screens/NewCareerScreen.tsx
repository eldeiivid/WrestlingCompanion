import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { useCareerSetupCatalogs } from "../hooks/useCareerSetupCatalogs";
import type { CareerConfigurationDraft } from "../types/careerDraft.types";

import RosterStep from "../components/RosterStep";
import type { RosterWrestler } from "../types/roster.types";

import ChampionshipsStep from "../components/ChampionshipsStep";
import type { ChampionshipsDraft } from "../types/championships.types";

import SummaryStep from "../components/SummaryStep";

import { useCreateMyGmCareer } from "../hooks/useCreateMyGmCareer";

import "./NewCareerScreen.scss";

const steps = ["Configuration", "Roster", "Championships", "Summary"];

function isNonNegativeInteger(value: string): boolean {
  return (
    /^\d+$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= 0
  );
}

export default function NewCareerScreen() {
  const { catalogs, isLoading, errorMessage, retry } = useCareerSetupCatalogs();

  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] = useState("");

  const [selectedWrestlers, setSelectedWrestlers] = useState<RosterWrestler[]>(
    [],
  );

  const navigate = useNavigate();

  const [creationId] = useState(() => crypto.randomUUID());

  const { createCareer, isCreating, creationError } = useCreateMyGmCareer();

  const [championships, setChampionships] = useState<ChampionshipsDraft>({
    selections: {
      worldMale: { titleId: "", championIds: [] },
      worldFemale: { titleId: "", championIds: [] },
      midcardMale: { titleId: "", championIds: [] },
      midcardFemale: { titleId: "", championIds: [] },
      tagMale: { titleId: "", championIds: [] },
      tagFemale: { titleId: "", championIds: [] },
    },
    mitbEnabled: false,
  });

  const [configuration, setConfiguration] = useState<CareerConfigurationDraft>({
    name: "",
    brandId: "",
    managerId: "",
    difficultyId: "",
    financesEnabled: false,
    initialMoney: "0",
    fansEnabled: false,
    initialFans: "0",
    startWeek: "1",
  });

  function updateField<K extends keyof CareerConfigurationDraft>(
    field: K,
    value: CareerConfigurationDraft[K],
  ) {
    setConfiguration((previous) => ({
      ...previous,
      [field]: value,
    }));

    setValidationError("");
  }

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!catalogs) return;

    if (!configuration.name.trim()) {
      setValidationError("Please enter a career name.");
      return;
    }

    const hasValidSelections =
      catalogs.brands.some((brand) => brand.id === configuration.brandId) &&
      catalogs.managers.some(
        (manager) => manager.id === configuration.managerId,
      ) &&
      catalogs.difficulties.some(
        (difficulty) => difficulty.id === configuration.difficultyId,
      );

    if (!hasValidSelections) {
      setValidationError("Please select a brand, manager, and difficulty.");
      return;
    }

    if (
      configuration.financesEnabled &&
      !isNonNegativeInteger(configuration.initialMoney)
    ) {
      setValidationError("Initial money must be a non-negative whole number.");
      return;
    }

    if (
      configuration.fansEnabled &&
      !isNonNegativeInteger(configuration.initialFans)
    ) {
      setValidationError("Initial fans must be a non-negative whole number.");
      return;
    }

    const week = Number(configuration.startWeek);

    if (
      !/^\d+$/.test(configuration.startWeek) ||
      !Number.isInteger(week) ||
      week < 1 ||
      week > 50
    ) {
      setValidationError("Starting week must be between 1 and 50.");
      return;
    }

    setValidationError("");
    setCurrentStep(2);
  }

  async function handleCreateCareer() {
    const gameId = await createCareer({
      requestId: creationId,
      configuration,
      wrestlerIds: selectedWrestlers.map((wrestler) => wrestler.id),
      championships,
    });

    if (gameId) {
      navigate(`/mygm/${gameId}`, { replace: true });
    }
  }

  return (
    <main className="new-career">
      <Link
        className="new-career__back"
        to="/mygm"
        aria-disabled={isCreating}
        onClick={(event) => {
          if (isCreating) event.preventDefault();
        }}
      >
        <ArrowLeft size={18} aria-hidden="true" />
        Back to careers
      </Link>

      <header className="new-career__header">
        <h1>New career</h1>
        <p>Match your setup to your WWE 2K26 save.</p>
      </header>

      <ol className="new-career__steps" aria-label="Career creation progress">
        {steps.map((step, index) => {
          const number = index + 1;

          return (
            <li
              key={step}
              className={
                number === currentStep ? "new-career__step--active" : ""
              }
              aria-current={number === currentStep ? "step" : undefined}
            >
              <span>{number}</span>
              {step}
            </li>
          );
        })}
      </ol>

      {isLoading ? (
        <p role="status">Loading setup options…</p>
      ) : errorMessage ? (
        <section className="new-career__panel">
          <p role="alert">{errorMessage}</p>
          <button className="new-career__button" type="button" onClick={retry}>
            Try again
          </button>
        </section>
      ) : catalogs ? (
        currentStep === 1 ? (
          <form className="new-career__panel" onSubmit={handleNext}>
            <h2>Configuration</h2>

            <div className="new-career__grid">
              <div className="new-career__field new-career__field--wide">
                <label htmlFor="career-name">Career name</label>
                <input
                  id="career-name"
                  type="text"
                  placeholder="RAW: A new era"
                  value={configuration.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="new-career__field">
                <label htmlFor="career-brand">Brand</label>
                <select
                  id="career-brand"
                  value={configuration.brandId}
                  onChange={(event) =>
                    updateField("brandId", event.target.value)
                  }
                  required
                >
                  <option value="">Select a brand</option>
                  {catalogs.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="new-career__field">
                <label htmlFor="career-manager">General Manager</label>
                <select
                  id="career-manager"
                  value={configuration.managerId}
                  onChange={(event) =>
                    updateField("managerId", event.target.value)
                  }
                  required
                >
                  <option value="">Select a manager</option>
                  {catalogs.managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="new-career__field">
                <label htmlFor="career-difficulty">Difficulty</label>
                <select
                  id="career-difficulty"
                  value={configuration.difficultyId}
                  onChange={(event) =>
                    updateField("difficultyId", event.target.value)
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

              <div className="new-career__field">
                <label htmlFor="career-week">Starting week</label>
                <input
                  id="career-week"
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  value={configuration.startWeek}
                  onChange={(event) =>
                    updateField("startWeek", event.target.value)
                  }
                  required
                />
              </div>

              <div className="new-career__tracking">
                <label className="new-career__toggle">
                  <input
                    type="checkbox"
                    checked={configuration.financesEnabled}
                    onChange={(event) =>
                      updateField("financesEnabled", event.target.checked)
                    }
                  />
                  Track finances
                </label>

                <p>Record income, expenses, and your available budget.</p>

                {configuration.financesEnabled && (
                  <div className="new-career__field">
                    <label htmlFor="career-money">Initial money</label>
                    <input
                      id="career-money"
                      type="number"
                      min={0}
                      step={1}
                      value={configuration.initialMoney}
                      onChange={(event) =>
                        updateField("initialMoney", event.target.value)
                      }
                      required
                    />
                  </div>
                )}
              </div>

              <div className="new-career__tracking">
                <label className="new-career__toggle">
                  <input
                    type="checkbox"
                    checked={configuration.fansEnabled}
                    onChange={(event) =>
                      updateField("fansEnabled", event.target.checked)
                    }
                  />
                  Track fans
                </label>

                <p>Record your audience gains and losses each week.</p>

                {configuration.fansEnabled && (
                  <div className="new-career__field">
                    <label htmlFor="career-fans">Initial fans</label>
                    <input
                      id="career-fans"
                      type="number"
                      min={0}
                      step={1}
                      value={configuration.initialFans}
                      onChange={(event) =>
                        updateField("initialFans", event.target.value)
                      }
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {validationError && (
              <p className="new-career__error" role="alert">
                {validationError}
              </p>
            )}

            <footer className="new-career__actions">
              <Link className="new-career__button" to="/mygm">
                Cancel
              </Link>

              <button
                className="new-career__button new-career__button--primary"
                type="submit"
              >
                Next
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </footer>
          </form>
        ) : currentStep === 2 ? (
          <RosterStep
            selectedWrestlers={selectedWrestlers}
            onSelectionChange={setSelectedWrestlers}
            onBack={() => setCurrentStep(1)}
            onNext={() => {
              if (selectedWrestlers.length > 0) {
                setCurrentStep(3);
              }
            }}
          />
        ) : currentStep === 3 ? (
          <ChampionshipsStep
            draft={championships}
            selectedWrestlers={selectedWrestlers}
            onChange={setChampionships}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        ) : (
          <SummaryStep
            configuration={configuration}
            catalogs={catalogs}
            selectedWrestlers={selectedWrestlers}
            championships={championships}
            isCreating={isCreating}
            creationError={creationError}
            onCreate={() => void handleCreateCareer()}
            onEdit={(step) => {
              if (!isCreating) setCurrentStep(step);
            }}
            onBack={() => {
              if (!isCreating) setCurrentStep(3);
            }}
          />
        )
      ) : null}
    </main>
  );
}
