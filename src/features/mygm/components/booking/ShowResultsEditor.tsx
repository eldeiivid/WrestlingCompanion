import { useId } from "react";
import { Check, CircleAlert, Star, Users, Wallet } from "lucide-react";

import { getShowFinalBalance } from "../../rules/booking/showResultsRules";
import type { BookingShowResultDraft } from "../../types/booking/bookingResults.types";

import "./ShowResultsEditor.scss";

interface ShowResultsEditorProps {
  showRating: number | null;
  result: BookingShowResultDraft;
  currentMoney: string;
  currentFans: string;
  financesEnabled: boolean;
  fansEnabled: boolean;
  disabled?: boolean;
  onResultChange: (changes: Partial<BookingShowResultDraft>) => void;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

function formatBalance(value: string | null, money = false): string {
  if (value === null || !/^-?\d+$/.test(value)) {
    return "Pending";
  }

  const amount = BigInt(value);

  return money ? moneyFormatter.format(amount) : numberFormatter.format(amount);
}

export default function ShowResultsEditor({
  showRating,
  result,
  currentMoney,
  currentFans,
  financesEnabled,
  fansEnabled,
  disabled = false,
  onResultChange,
}: ShowResultsEditorProps) {
  const fieldId = useId();
  const headingId = useId();

  const finalMoney = getShowFinalBalance(currentMoney, result.moneyChange);

  const finalFans = getShowFinalBalance(currentFans, result.fansChange);

  const invalidMoney = result.moneyChange !== "" && finalMoney === null;

  const invalidFans = result.fansChange !== "" && finalFans === null;

  const hasBalanceFields = financesEnabled || fansEnabled;
  const isComplete =
    showRating !== null &&
    (!financesEnabled || finalMoney !== null) &&
    (!fansEnabled || finalFans !== null);

  function handleChange(field: "moneyChange" | "fansChange", value: string) {
    if (disabled || !/^-?\d*$/.test(value)) {
      return;
    }

    onResultChange({ [field]: value });
  }

  return (
    <section className="show-results" aria-labelledby={headingId}>
      <header className="show-results__header">
        <h2 id={headingId}>Show results</h2>

        <p>
          {hasBalanceFields
            ? "Enter the overall changes shown by your game after the show."
            : "Review the calculated show rating before continuing."}
        </p>
      </header>

      <fieldset className="show-results__fields" disabled={disabled}>
        <legend className="show-results__legend">Overall show results</legend>

        <section
          className="show-results__rating"
          aria-labelledby={`${fieldId}-rating-label`}
        >
          <span className="show-results__rating-icon" aria-hidden="true">
            <Star size={24} strokeWidth={1.5} />
          </span>

          <div className="show-results__rating-copy">
            <h3 id={`${fieldId}-rating-label`}>Show rating</h3>
            <p>Average of match ratings. Promos are excluded.</p>
          </div>

          <output
            className="show-results__rating-value"
            aria-labelledby={`${fieldId}-rating-label`}
          >
            {showRating === null ? (
              <span className="show-results__rating-pending">
                Complete all match ratings to calculate this.
              </span>
            ) : (
              <>
                {showRating.toFixed(2)}
                <span> / 5</span>
              </>
            )}
          </output>
        </section>

        {hasBalanceFields && (
          <>
            <p className="show-results__instructions">
              Enter a positive number for a gain, a negative number for a loss,
              or <strong>0</strong> for no change.
            </p>

            <div className="show-results__balances">
              {financesEnabled && (
                <section
                  className="show-results__balance-card"
                  aria-labelledby={`${fieldId}-money-title`}
                >
                  <header className="show-results__balance-header">
                    <Wallet size={19} aria-hidden="true" />
                    <h3 id={`${fieldId}-money-title`}>Money</h3>
                  </header>

                  <p className="show-results__current">
                    <span>Current balance</span>
                    <strong>{formatBalance(currentMoney, true)}</strong>
                  </p>

                  <div className="show-results__field">
                    <div className="show-results__field-heading">
                    <label htmlFor={`${fieldId}-money`}>
                      Net money gained or lost
                    </label>
                    <button
                      className="show-results__zero"
                      type="button"
                      aria-label="Set money change to zero"
                      onClick={() => handleChange("moneyChange", "0")}
                    >
                      No change (0)
                    </button>
                    </div>

                    <input
                      id={`${fieldId}-money`}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="e.g. 50000 or -20000"
                      value={result.moneyChange}
                      aria-describedby={invalidMoney
                        ? `${fieldId}-money-help ${fieldId}-money-error`
                        : `${fieldId}-money-help`}
                      aria-invalid={invalidMoney}
                      onChange={(event) =>
                        handleChange("moneyChange", event.target.value)
                      }
                    />

                    <p id={`${fieldId}-money-help`}>
                      Include all show income and expenses, including promos.
                      Costs will not be deducted again.
                    </p>
                    {invalidMoney && (
                      <p className="show-results__field-error" id={`${fieldId}-money-error`}>
                        Enter a whole number that keeps the final balance at zero or above and within the supported range.
                      </p>
                    )}
                  </div>

                  <output
                    className={`show-results__calculated${
                      invalidMoney ? " show-results__calculated--invalid" : ""
                    }`}
                    htmlFor={`${fieldId}-money`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span>New balance</span>
                    <strong>
                      {invalidMoney
                        ? "Check the amount"
                        : formatBalance(finalMoney, true)}
                    </strong>
                    {finalMoney !== null && (
                      <small className="show-results__delta">
                        Net change: {BigInt(result.moneyChange) > 0n ? "+" : ""}
                        {formatBalance(result.moneyChange, true)}
                      </small>
                    )}
                  </output>
                </section>
              )}

              {fansEnabled && (
                <section
                  className="show-results__balance-card"
                  aria-labelledby={`${fieldId}-fans-title`}
                >
                  <header className="show-results__balance-header">
                    <Users size={19} aria-hidden="true" />
                    <h3 id={`${fieldId}-fans-title`}>Fans</h3>
                  </header>

                  <p className="show-results__current">
                    <span>Current fans</span>
                    <strong>{formatBalance(currentFans)}</strong>
                  </p>

                  <div className="show-results__field">
                    <div className="show-results__field-heading">
                    <label htmlFor={`${fieldId}-fans`}>
                      Fans gained or lost
                    </label>
                    <button
                      className="show-results__zero"
                      type="button"
                      aria-label="Set fan change to zero"
                      onClick={() => handleChange("fansChange", "0")}
                    >
                      No change (0)
                    </button>
                    </div>

                    <input
                      id={`${fieldId}-fans`}
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="e.g. 1500 or -500"
                      value={result.fansChange}
                      aria-describedby={invalidFans
                        ? `${fieldId}-fans-help ${fieldId}-fans-error`
                        : `${fieldId}-fans-help`}
                      aria-invalid={invalidFans}
                      onChange={(event) =>
                        handleChange("fansChange", event.target.value)
                      }
                    />

                    <p id={`${fieldId}-fans-help`}>
                      Include the overall fan change, including Charity and
                      Invasion. Promo effects will not be added again.
                    </p>
                    {invalidFans && (
                      <p className="show-results__field-error" id={`${fieldId}-fans-error`}>
                        Enter a whole number that keeps the final fan total at zero or above and within the supported range.
                      </p>
                    )}
                  </div>

                  <output
                    className={`show-results__calculated${
                      invalidFans ? " show-results__calculated--invalid" : ""
                    }`}
                    htmlFor={`${fieldId}-fans`}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span>New fan total</span>
                    <strong>
                      {invalidFans
                        ? "Check the amount"
                        : formatBalance(finalFans)}
                    </strong>
                    {finalFans !== null && (
                      <small className="show-results__delta">
                        Net change: {BigInt(result.fansChange) > 0n ? "+" : ""}
                        {formatBalance(result.fansChange)}
                      </small>
                    )}
                  </output>
                </section>
              )}
            </div>
          </>
        )}
      </fieldset>
      <p
        className={`show-results__readiness${isComplete ? " show-results__readiness--complete" : ""}`}
        role="status"
      >
        {isComplete ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <CircleAlert size={16} aria-hidden="true" />
        )}
        {isComplete
          ? "Show results are ready to review. Changes apply when you close the show."
          : showRating === null
            ? "Complete the match ratings to calculate the show rating."
            : "Enter a valid change for each enabled total. Use 0 for no change."}
      </p>
    </section>
  );
}
