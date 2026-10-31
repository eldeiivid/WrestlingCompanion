import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useCareerSetupCatalogs } from "../hooks/useCareerSetupCatalogs";
import type { CareerConfigurationDraft } from "../types/careerDraft.types";

import RosterStep from "../components/RosterStep";
import type { RosterWrestler } from "../types/roster.types";

import ChampionshipsStep from "../components/ChampionshipsStep";
import type { ChampionshipsDraft } from "../types/championships.types";

import SummaryStep from "../components/SummaryStep";

import { useCreateMyGmCareer } from "../hooks/useCreateMyGmCareer";

import CareerConfigurationStep from "../components/career-setup/CareerConfigurationStep";
import CareerSetupStepper from "../components/career-setup/CareerSetupStepper";

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
        <p className="new-career__eyebrow">MyGM · New career</p>
        <h1>Create your next chapter.</h1>
        <p>Build a starting setup that matches your game.</p>
      </header>

      <CareerSetupStepper steps={steps} currentStep={currentStep} />

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
          <CareerConfigurationStep
            catalogs={catalogs}
            configuration={configuration}
            validationError={validationError}
            onFieldChange={updateField}
            onSubmit={handleNext}
          />
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
