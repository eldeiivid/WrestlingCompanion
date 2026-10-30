import { useId } from "react";
import { getShowFinalBalance } from "../../rules/showResultsRules";
import type { BookingShowResultDraft } from "../../types/bookingResults.types";
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

function formatBalance(value: string | null, money = false): string {
  if (value === null || !/^-?\d+$/.test(value)) {
    return "Pending";
  }

  const amount = BigInt(value);

  return money
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)
    : new Intl.NumberFormat("en-US").format(amount);
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

  const finalMoney = getShowFinalBalance(currentMoney, result.moneyChange);

  const finalFans = getShowFinalBalance(currentFans, result.fansChange);

  function handleChange(field: "moneyChange" | "fansChange", value: string) {
    if (!/^-?\d*$/.test(value)) {
      return;
    }

    onResultChange({ [field]: value });
  }

  return (
    <section className="show-results">
      <header className="show-results__header">
        <h2>Show results</h2>

        <p>
          Enter the net money and fans gained or lost during the show. Use a
          negative number for a loss, or 0 for no change.
        </p>
      </header>

      <fieldset className="show-results__fields" disabled={disabled}>
        <legend className="show-results__legend">Overall show results</legend>

        <div className="show-results__field">
          <span id={`${fieldId}-rating-label`}>Show rating</span>

          <output aria-labelledby={`${fieldId}-rating-label`}>
            {showRating === null
              ? "Complete all match ratings to calculate the show rating."
              : `${showRating.toFixed(2)} / 5 stars`}
          </output>

          <p>
            Calculated automatically from match ratings. Promos are excluded.
          </p>
        </div>

        {financesEnabled && (
          <div className="show-results__field">
            <label htmlFor={`${fieldId}-money`}>Net money gained or lost</label>

            <p>Current balance: {formatBalance(currentMoney, true)}</p>

            <input
              id={`${fieldId}-money`}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Example: 50000 or -20000"
              value={result.moneyChange}
              aria-describedby={`${fieldId}-money-help`}
              aria-invalid={result.moneyChange !== "" && finalMoney === null}
              onChange={(event) =>
                handleChange("moneyChange", event.target.value)
              }
            />

            <p id={`${fieldId}-money-help`}>
              Include all show income and expenses, including promos. Costs will
              not be deducted again.
            </p>

            <output className="show-results__calculated" aria-live="polite">
              New balance: {formatBalance(finalMoney, true)}
            </output>
          </div>
        )}

        {fansEnabled && (
          <div className="show-results__field">
            <label htmlFor={`${fieldId}-fans`}>Fans gained or lost</label>

            <p>Current fans: {formatBalance(currentFans)}</p>

            <input
              id={`${fieldId}-fans`}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="Example: 1500 or -500"
              value={result.fansChange}
              aria-describedby={`${fieldId}-fans-help`}
              aria-invalid={result.fansChange !== "" && finalFans === null}
              onChange={(event) =>
                handleChange("fansChange", event.target.value)
              }
            />

            <p id={`${fieldId}-fans-help`}>
              Include all fans gained or lost during the show. Charity and
              Invasion are already included in this amount.
            </p>

            <output className="show-results__calculated" aria-live="polite">
              New fan total: {formatBalance(finalFans)}
            </output>
          </div>
        )}
      </fieldset>
    </section>
  );
}
