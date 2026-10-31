import { Check } from "lucide-react";

import "./CareerSetupStepper.scss";

interface CareerSetupStepperProps {
  steps: readonly string[];
  currentStep: number;
}

export default function CareerSetupStepper({
  steps,
  currentStep,
}: CareerSetupStepperProps) {
  return (
    <nav className="career-setup-stepper" aria-label="Career creation progress">
      <ol>
        {steps.map((step, index) => {
          const number = index + 1;
          const isCurrent = number === currentStep;
          const isComplete = number < currentStep;

          return (
            <li
              key={step}
              className={[
                "career-setup-stepper__step",
                isCurrent ? "is-current" : "",
                isComplete ? "is-complete" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="career-setup-stepper__number" aria-hidden="true">
                {isComplete ? <Check size={16} /> : number}
              </span>

              <span className="career-setup-stepper__label">{step}</span>

              {isComplete && (
                <span className="career-setup-stepper__sr-only">Completed</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
