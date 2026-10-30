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

export default function SeasonDraftStepper({
  steps,
  currentStep,
}: SeasonDraftStepperProps) {
  return (
    <nav className="season-draft-stepper" aria-label="Season draft progress">
      <ol className="season-draft-stepper__list">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;

          const className = [
            "season-draft-stepper__step",
            isCurrent ? "is-current" : "",
            step.isComplete ? "is-complete" : "",
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
                {step.isComplete && !isCurrent ? (
                  <Check size={18} />
                ) : (
                  index + 1
                )}
              </span>

              <span className="season-draft-stepper__label">{step.label}</span>

              {step.isComplete && !isCurrent && (
                <span className="season-draft-stepper__sr-only">Completed</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
