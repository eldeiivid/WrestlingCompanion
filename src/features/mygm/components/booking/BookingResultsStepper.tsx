import { Check } from "lucide-react";
import type {
  BookingResultsStep,
  BookingResultsStepId,
} from "../../types/bookingResults.types";
import "./BookingResultsStepper.scss";

interface BookingResultsStepperProps {
  steps: BookingResultsStep[];
  currentStep: BookingResultsStepId;
  disabled?: boolean;
  onStepChange: (stepId: BookingResultsStepId) => void;
}

export default function BookingResultsStepper({
  steps,
  currentStep,
  disabled = false,
  onStepChange,
}: BookingResultsStepperProps) {
  return (
    <nav className="booking-results-stepper" aria-label="Show results steps">
      <ol className="booking-results-stepper__list">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;

          const className = [
            "booking-results-stepper__step",
            isCurrent ? "booking-results-stepper__step--current" : "",
            step.isComplete ? "booking-results-stepper__step--complete" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li className="booking-results-stepper__item" key={step.id}>
              <button
                className={className}
                type="button"
                disabled={disabled || !step.isAvailable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${index + 1}. ${step.label}${
                  step.isComplete ? ", complete" : ""
                }`}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className="booking-results-stepper__number"
                  aria-hidden="true"
                >
                  {step.isComplete && !isCurrent ? (
                    <Check size={18} />
                  ) : (
                    index + 1
                  )}
                </span>

                <span className="booking-results-stepper__label">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
