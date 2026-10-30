import { useId, useState } from "react";
import { Link, Navigate, useOutletContext } from "react-router-dom";

import SeasonDraftStepper from "../../components/season-draft/SeasonDraftStepper";
import SeasonRetentionStep from "../../components/season-draft/SeasonRetentionStep";
import SeasonDraftStep from "../../components/season-draft/SeasonDraftStep";
import SeasonBalancesStep from "../../components/season-draft/SeasonBalancesStep";
import SeasonDraftReviewStep from "../../components/season-draft/SeasonDraftReviewStep";

import { useSeasonTransition } from "../../hooks/season-draft/useSeasonTransition";

import type {
  SeasonDraftFlowStep,
  SeasonDraftStepId,
} from "../../types/season-draft/seasonDraftFlow.types";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./SeasonDraftScreen.scss";

interface SeasonDraftScreenContentProps {
  careerId: string;
  refreshCareer: () => void;
}

function SeasonDraftScreenContent({
  careerId,
  refreshCareer,
}: SeasonDraftScreenContentProps) {
  const headingId = useId();

  const [currentStep, setCurrentStep] =
    useState<SeasonDraftStepId>("retention");

  const [isCompleted, setIsCompleted] = useState(false);

  const { data, isLoading, isReady, errorMessage, retry } =
    useSeasonTransition(careerId);

  const dashboardPath = `/mygm/${careerId}`;

  const hasBalances =
    Boolean(data?.finances_enabled) || Boolean(data?.fans_enabled);

  const activeStep =
    currentStep === "balances" && data && !hasBalances ? "review" : currentStep;

  const stepDefinitions: {
    id: SeasonDraftStepId;
    label: string;
  }[] = [
    {
      id: "retention",
      label: "Retain wrestlers",
    },
    {
      id: "draft",
      label: "Draft roster",
    },
    ...(hasBalances
      ? [
          {
            id: "balances" as const,
            label: "Starting balances",
          },
        ]
      : []),
    {
      id: "review",
      label: "Review & confirm",
    },
  ];

  const currentStepIndex = stepDefinitions.findIndex(
    (step) => step.id === activeStep,
  );

  const steps: SeasonDraftFlowStep[] = stepDefinitions.map((step, index) => ({
    ...step,
    isComplete: index < currentStepIndex,
  }));

  function handleSavedStep(nextStep: SeasonDraftStepId) {
    // Reload saved selections before mounting the next step.
    setCurrentStep(nextStep);
    retry();
  }

  function handleConfirmed() {
    setIsCompleted(true);
    refreshCareer();
  }

  if (isCompleted) {
    return <Navigate to={dashboardPath} replace />;
  }

  if (isReady && !isLoading && !errorMessage && !data) {
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <section className="season-draft-screen" aria-labelledby={headingId}>
      <header className="season-draft-screen__header">
        <Link className="season-draft-screen__back-link" to="/mygm">
          ← Back to careers
        </Link>

        <p className="season-draft-screen__eyebrow">Season transition</p>

        <h1 id={headingId}>
          {data
            ? `Prepare season ${data.transition.to_season}`
            : "Prepare your next season"}
        </h1>

        <p className="season-draft-screen__description">
          Choose who stays, draft your roster and review the changes before
          starting your next season.
        </p>
      </header>

      <div className="season-draft-screen__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="season-draft-screen__state">
            <p role="status">Loading season draft…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="season-draft-screen__state">
            <h2>The season draft could not be loaded</h2>

            <p role="alert">{errorMessage}</p>

            <button
              className="season-draft-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && isReady && data && (
          <>
            <SeasonDraftStepper steps={steps} currentStep={activeStep} />

            <p className="season-draft-screen__notice">
              Saved selections can be resumed later. Your new roster and
              starting balances are applied when you confirm the draft.
            </p>

            {activeStep === "retention" && (
              <SeasonRetentionStep
                key={`${data.transition.id}:retention`}
                data={data}
                onContinue={() => handleSavedStep("draft")}
              />
            )}

            {activeStep === "draft" && (
              <SeasonDraftStep
                key={`${data.transition.id}:draft`}
                data={data}
                onBack={() => handleSavedStep("retention")}
                onContinue={() =>
                  handleSavedStep(hasBalances ? "balances" : "review")
                }
              />
            )}

            {activeStep === "balances" && (
              <SeasonBalancesStep
                key={`${data.transition.id}:balances`}
                data={data}
                onBack={() => handleSavedStep("draft")}
                onContinue={() => handleSavedStep("review")}
              />
            )}

            {activeStep === "review" && (
              <SeasonDraftReviewStep
                key={`${data.transition.id}:review`}
                careerId={careerId}
                transitionId={data.transition.id}
                onBack={() =>
                  handleSavedStep(hasBalances ? "balances" : "draft")
                }
                onEditRetentions={() => handleSavedStep("retention")}
                onEditDraft={() => handleSavedStep("draft")}
                onEditBalances={() =>
                  handleSavedStep(hasBalances ? "balances" : "review")
                }
                onConfirmed={handleConfirmed}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function SeasonDraftScreen() {
  const { career, refreshCareer } = useOutletContext<MyGmOutletContext>();

  return (
    <SeasonDraftScreenContent
      key={career.id}
      careerId={career.id}
      refreshCareer={refreshCareer}
    />
  );
}
