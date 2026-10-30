import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useSaveSeasonBalances } from "../../hooks/season-draft/useSaveSeasonBalances";

import type {
  SaveSeasonBalancesResult,
  SeasonTransitionData,
} from "../../types/season-draft/seasonDraft.types";

import "./SeasonBalancesStep.scss";

interface SeasonBalancesStepProps {
  data: SeasonTransitionData;
  onBack: () => void;
  onContinue: (result: SaveSeasonBalancesResult) => void;
}

function isValidBalance(value: string): boolean {
  return /^\d{1,19}$/.test(value) && BigInt(value) <= 9223372036854775807n;
}

export default function SeasonBalancesStep({
  data,
  onBack,
  onContinue,
}: SeasonBalancesStepProps) {
  const headingId = useId();
  const moneyHintId = useId();
  const fansHintId = useId();

  const [money, setMoney] = useState(data.starting_money ?? "");
  const [fans, setFans] = useState(data.starting_fans ?? "");

  const [savedMoney, setSavedMoney] = useState(data.starting_money);
  const [savedFans, setSavedFans] = useState(data.starting_fans);

  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  const { isSaving, errorMessage, save, clearError } = useSaveSeasonBalances();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isMoneyValid = !data.finances_enabled || isValidBalance(money);

  const isFansValid = !data.fans_enabled || isValidBalance(fans);

  const normalizedMoney =
    data.finances_enabled && isValidBalance(money)
      ? BigInt(money).toString()
      : null;

  const normalizedFans =
    data.fans_enabled && isValidBalance(fans) ? BigInt(fans).toString() : null;

  const hasChanges =
    normalizedMoney !== savedMoney || normalizedFans !== savedFans;

  const canSave = isMoneyValid && isFansValid && !isSaving;

  async function handleSave(continueAfterSave: boolean) {
    if (!canSave || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSuccessMessage("");

    try {
      const result = await save({
        careerId: data.career_id,
        transitionId: data.transition.id,
        startingMoney: normalizedMoney,
        startingFans: normalizedFans,
      });

      if (!result || !mountedRef.current) {
        return;
      }

      setMoney(result.starting_money ?? "");
      setFans(result.starting_fans ?? "");
      setSavedMoney(result.starting_money);
      setSavedFans(result.starting_fans);
      setSuccessMessage("Starting balances saved.");

      if (continueAfterSave) {
        onContinue(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleSave(true);
  }

  function handleBack() {
    if (isSaving || submittingRef.current) {
      return;
    }

    onBack();
  }

  return (
    <section className="season-balances-step" aria-labelledby={headingId}>
      <header className="season-balances-step__header">
        <h2 id={headingId}>Starting balances</h2>

        <p>
          Enter the totals shown in your game after completing the draft for
          Season {data.transition.to_season}.
        </p>
      </header>

      <p className="season-balances-step__hint">
        These totals will become your starting balances when you confirm the new
        season.
      </p>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset className="season-balances-step__fields" disabled={isSaving}>
          <legend className="season-balances-step__legend">
            New season totals
          </legend>

          <div className="season-balances-step__inputs">
            {data.finances_enabled && (
              <div className="season-balances-step__input-group">
                <label className="season-balances-step__field">
                  <span>Starting money total</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    maxLength={19}
                    required
                    value={money}
                    placeholder="Enter your total money"
                    aria-describedby={moneyHintId}
                    aria-invalid={money !== "" && !isMoneyValid}
                    onChange={(event) => {
                      setMoney(event.target.value);
                      setSuccessMessage("");
                      clearError();
                    }}
                  />
                </label>

                <p
                  id={moneyHintId}
                  className="season-balances-step__field-hint"
                >
                  Enter the complete balance using whole numbers, without
                  currency symbols or separators.
                </p>

                {money !== "" && !isMoneyValid && (
                  <p className="season-balances-step__error">
                    Enter a money total between 0 and 9,223,372,036,854,775,807.
                  </p>
                )}
              </div>
            )}

            {data.fans_enabled && (
              <div className="season-balances-step__input-group">
                <label className="season-balances-step__field">
                  <span>Starting fan total</span>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    maxLength={19}
                    required
                    value={fans}
                    placeholder="Enter your total fans"
                    aria-describedby={fansHintId}
                    aria-invalid={fans !== "" && !isFansValid}
                    onChange={(event) => {
                      setFans(event.target.value);
                      setSuccessMessage("");
                      clearError();
                    }}
                  />
                </label>

                <p id={fansHintId} className="season-balances-step__field-hint">
                  Enter the complete fan total using whole numbers without
                  separators.
                </p>

                {fans !== "" && !isFansValid && (
                  <p className="season-balances-step__error">
                    Enter a fan total between 0 and 9,223,372,036,854,775,807.
                  </p>
                )}
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="season-balances-step__error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="season-balances-step__success" role="status">
              {successMessage}
            </p>
          )}

          <footer className="season-balances-step__actions">
            <button
              className="season-balances-step__button"
              type="button"
              disabled={isSaving}
              onClick={handleBack}
            >
              Back to draft
            </button>

            <button
              className="season-balances-step__button"
              type="button"
              disabled={!canSave || !hasChanges}
              onClick={() => void handleSave(false)}
            >
              Save balances
            </button>

            <button
              className="season-balances-step__button season-balances-step__button--primary"
              type="submit"
              disabled={!canSave}
            >
              {isSaving ? "Saving…" : "Save and continue"}
            </button>
          </footer>
        </fieldset>
      </form>
    </section>
  );
}
