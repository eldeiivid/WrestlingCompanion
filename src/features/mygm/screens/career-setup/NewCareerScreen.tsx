import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Gamepad2, Trophy, UserRound, UsersRound } from "lucide-react";

import { useCareerSetupCatalogs } from "../../hooks/career-setup/useCareerSetupCatalogs";
import type { CareerConfigurationDraft } from "../../types/career-setup/careerDraft.types";

import RosterStep from "../../components/career-setup/RosterStep";
import type { RosterWrestler } from "../../types/career-setup/roster.types";

import ChampionshipsStep from "../../components/career-setup/ChampionshipsStep";
import type { ChampionshipsDraft } from "../../types/career-setup/championships.types";

import SummaryStep from "../../components/career-setup/SummaryStep";

import { useCreateMyGmCareer } from "../../hooks/career-setup/useCreateMyGmCareer";

import CareerConfigurationStep from "../../components/career-setup/CareerConfigurationStep";
import CareerSetupStepper from "../../components/career-setup/CareerSetupStepper";
import CareerSetupArtwork from "../../components/career-setup/CareerSetupArtwork";
import { careerSetupTheme } from "../../components/career-setup/careerSetupTheme";

import "./NewCareerScreen.scss";
import "../../components/career-setup/CareerSetupTheme.scss";

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
  const stageRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef(currentStep);

  useEffect(() => {
    if (previousStep.current === currentStep) return;
    previousStep.current = currentStep;
    const heading = stageRef.current?.querySelector("h2");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    stageRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [currentStep]);

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
    const careerSlug = await createCareer({
      requestId: creationId,
      configuration,
      wrestlerIds: selectedWrestlers.map((wrestler) => wrestler.id),
      championships,
    });

    if (careerSlug) {
      navigate(myGmCareerPath(careerSlug), { replace: true });
    }
  }

  const brand = catalogs?.brands.find(item => item.id === configuration.brandId);
  const manager = catalogs?.managers.find(item => item.id === configuration.managerId);
  const selectedTitleCount = Object.values(championships.selections).filter(item => item.titleId).length;

  return (
    <main className="new-career" style={careerSetupTheme(brand)}>
      <div className="new-career__topbar">
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
      <span className="new-career__edition">MyGM · Career setup</span>
      </div>

      <header className={`new-career__header${manager ? " has-manager" : ""}`}>
        <div className="new-career__hero-copy">
          <p className="new-career__eyebrow">Your debut as General Manager</p>
          <h1>{configuration.name.trim() || "Your brand starts here."}</h1>
          <p>Choose your brand. Build your roster. Make it your era.</p>
          <div className="new-career__identity">
            <span>{brand?.name || "Choose your show"}</span>
            {manager && <span><UserRound size={14} aria-hidden="true" /> {manager.name}</span>}
          </div>
        </div>
        <div className="new-career__hero-art" aria-hidden="true">
          <span className="new-career__hero-logo"><CareerSetupArtwork src={brand?.logo_url ?? null} fallback={<Gamepad2 size={48} strokeWidth={1.2} />} /></span>
          {manager && <span className="new-career__hero-manager"><CareerSetupArtwork src={manager.image_url} fallback={<UserRound size={72} strokeWidth={1} />} /></span>}
        </div>
      </header>

      <dl className="new-career__snapshot">
        <div><UsersRound size={18} aria-hidden="true" /><dt>Roster</dt><dd>{selectedWrestlers.length} selected</dd></div>
        <div><Trophy size={18} aria-hidden="true" /><dt>Championships</dt><dd>{selectedTitleCount} / 6 titles</dd></div>
        <div><CalendarDays size={18} aria-hidden="true" /><dt>Starting point</dt><dd>Week {configuration.startWeek || "—"}</dd></div>
      </dl>

      <CareerSetupStepper steps={steps} currentStep={currentStep} />

      <div className="new-career__stage" ref={stageRef}>
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
      </div>
    </main>
  );
}
import { myGmCareerPath } from "../../routes/mygmPaths";
