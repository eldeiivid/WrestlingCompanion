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

const shortLabels: Record<BookingResultsStepId, string> = {
  segments: "Segments",
  show: "Show",
  review: "Review",
};

const lockedMessages: Record<BookingResultsStepId, string> = {
  segments: "Segment results are not available yet.",
  show: "Complete all segment results to unlock Show results.",
  review: "Complete the segment and show results to unlock the review.",
};

export default function BookingResultsStepper({
  steps,
  currentStep,
  disabled = false,
  onStepChange,
}: BookingResultsStepperProps) {
  const firstLockedStep = steps.find((step) => !step.isAvailable);

  return (
    <nav className="booking-results-stepper" aria-label="Show results steps">
      <ol
        className="booking-results-stepper__list"
        style={{
          gridTemplateColumns: `repeat(${Math.max(
            1,
            steps.length,
          )}, minmax(0, 1fr))`,
        }}
      >
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isLocked = !step.isAvailable;

          const stateLabel = isCurrent
            ? "Current step"
            : step.isComplete
              ? "Complete"
              : isLocked
                ? "Locked"
                : "Available";

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
                disabled={disabled || isLocked}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${index + 1}. ${step.label}. ${stateLabel}${
                  isLocked ? `. ${lockedMessages[step.id]}` : ""
                }`}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className="booking-results-stepper__number"
                  aria-hidden="true"
                >
                  {step.isComplete && !isCurrent ? (
                    <Check size={16} />
                  ) : (
                    index + 1
                  )}
                </span>

                <span
                  className="booking-results-stepper__copy"
                  aria-hidden="true"
                >
                  <span className="booking-results-stepper__label booking-results-stepper__label--short">
                    {shortLabels[step.id]}
                  </span>

                  <span className="booking-results-stepper__label booking-results-stepper__label--full">
                    {step.label}
                  </span>

                  <span className="booking-results-stepper__state">
                    {stateLabel}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {!disabled && firstLockedStep && (
        <p className="booking-results-stepper__hint">
          {lockedMessages[firstLockedStep.id]}
        </p>
      )}
    </nav>
  );
}
