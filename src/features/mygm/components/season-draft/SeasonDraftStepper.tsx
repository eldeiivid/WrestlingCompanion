import { Check } from "lucide-react";

import type {
  SeasonDraftFlowStep,
  SeasonDraftStepId,
} from "../../types/season-draft/seasonDraftFlow.types";

import "./SeasonDraftStepper.scss";

interface SeasonDraftStepperProps {
  steps: SeasonDraftFlowStep[];
  currentStep: SeasonDraftStepId;
}

const shortLabels: Record<SeasonDraftStepId, string> = {
  retention: "Retain",
  draft: "Draft",
  balances: "Balances",
  review: "Review",
};

export default function SeasonDraftStepper({
  steps,
  currentStep,
}: SeasonDraftStepperProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const activeStep = steps[currentIndex];

  return (
    <nav className="season-draft-stepper" aria-label="Season draft progress">
      <ol
        className="season-draft-stepper__list"
        style={{
          gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(0, 1fr))`,
        }}
        role="list"
      >
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isComplete = step.isComplete && !isCurrent;

          const className = [
            "season-draft-stepper__step",
            isCurrent ? "is-current" : "",
            isComplete ? "is-complete" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li
              className={className}
              key={step.id}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="season-draft-stepper__number" aria-hidden="true">
                {isComplete ? <Check size={16} /> : index + 1}
              </span>

              <span
                className="season-draft-stepper__short-label"
                aria-hidden="true"
              >
                {shortLabels[step.id]}
              </span>

              <span className="season-draft-stepper__label">{step.label}</span>

              {isComplete && (
                <span className="season-draft-stepper__sr-only">Completed</span>
              )}
            </li>
          );
        })}
      </ol>

      {activeStep && (
        <p className="season-draft-stepper__current">
          Step {currentIndex + 1} of {steps.length}
          <span aria-hidden="true"> · </span>
          <strong>{activeStep.label}</strong>
        </p>
      )}
    </nav>
  );
}
