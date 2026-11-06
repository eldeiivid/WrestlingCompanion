import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { CalendarPlus, Check, CircleAlert, LoaderCircle, X } from "lucide-react";

import { useExtendContract } from "../../hooks/market/useExtendContract";

import type { ExtendContractResult } from "../../types/market/marketContracts.types";

import "./ExtendContractModal.scss";

interface ExtendContractModalProps {
  careerId: string;
  membershipId: string;
  wrestlerName: string;
  currentTick: number;
  contractEndTick: number;
  financesEnabled: boolean;
  budgetAvailable: string;
  onClose: () => void;
  onExtended: (result: ExtendContractResult) => void;
}

const maxBigInt = 9223372036854775807n;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

function isOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = dialog.getBoundingClientRect();

  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

export default function ExtendContractModal({
  careerId,
  membershipId,
  wrestlerName,
  currentTick,
  contractEndTick,
  financesEnabled,
  budgetAvailable,
  onClose,
  onExtended,
}: ExtendContractModalProps) {
  const headingId = useId();
  const descriptionId = useId();
  const readinessId = useId();
  const weeksErrorId = useId();
  const costErrorId = useId();
  const budgetErrorId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const backdropPointerRef = useRef(false);

  const requestRef = useRef<{
    signature: string;
    id: string;
  } | null>(null);

  const [weeks, setWeeks] = useState("");
  const [cost, setCost] = useState("");

  const { isExtending, errorMessage, extend, clearError } = useExtendContract();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    mountedRef.current = true;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const scrollContainer = dialog.closest<HTMLElement>(
      ".mygm-layout__content",
    );

    const previousBodyOverflow = document.body.style.overflow;
    const previousContentOverflow = scrollContainer?.style.overflowY;

    document.body.style.overflow = "hidden";

    if (scrollContainer) {
      scrollContainer.style.overflowY = "hidden";
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      mountedRef.current = false;

      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflow = previousBodyOverflow;

      if (scrollContainer) {
        scrollContainer.style.overflowY = previousContentOverflow ?? "";
      }

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  const addedWeeks = /^\d+$/.test(weeks) ? Number(weeks) : NaN;

  const hasActiveContract = contractEndTick >= currentTick;

  const hasValidWeeks =
    Number.isSafeInteger(addedWeeks) &&
    addedWeeks >= 1 &&
    addedWeeks <= 2147483646 - contractEndTick;

  const newEndTick = hasValidWeeks ? contractEndTick + addedWeeks : null;

  const hasValidCost = /^\d+$/.test(cost) && BigInt(cost) <= maxBigInt;

  const exceedsBudget =
    financesEnabled && hasValidCost && BigInt(cost) > BigInt(budgetAvailable);

  const remainingWeeks = Math.max(0, contractEndTick - currentTick + 1);

  const canSubmit =
    hasActiveContract &&
    hasValidWeeks &&
    (!financesEnabled || (hasValidCost && !exceedsBudget));

  function requestClose() {
    if (submittingRef.current || isExtending) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      const extensionCost = financesEnabled ? BigInt(cost).toString() : null;

      const signature = JSON.stringify({
        careerId,
        membershipId,
        addedWeeks,
        cost: extensionCost,
      });

      if (requestRef.current?.signature !== signature) {
        requestRef.current = {
          signature,
          id: crypto.randomUUID(),
        };
      }

      const result = await extend({
        careerId,
        membershipId,
        requestId: requestRef.current.id,
        addedWeeks,
        cost: extensionCost,
      });

      if (result && mountedRef.current) {
        onExtended(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="extend-contract-modal"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={(event) => {
        backdropPointerRef.current =
          event.target === event.currentTarget &&
          isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
      }}
      onClick={(event) => {
        const clickedBackdrop =
          backdropPointerRef.current &&
          event.target === event.currentTarget &&
          isOutsideDialog(event.currentTarget, event.clientX, event.clientY);

        backdropPointerRef.current = false;

        if (clickedBackdrop) {
          requestClose();
        }
      }}
    >
      <header className="extend-contract-modal__header">
        <div>
          <h2 id={headingId}>Extend contract</h2>
          <p>{wrestlerName}</p>
        </div>

        <button
          className="extend-contract-modal__close"
          type="button"
          aria-label="Close extension form"
          disabled={isExtending}
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form
        className="extend-contract-modal__form"
        onSubmit={handleSubmit}
        aria-busy={isExtending}
      >
        <p id={descriptionId} className="extend-contract-modal__description">
          Add weeks to the current contract using the extension details shown in
          your game.
        </p>

        <div className="extend-contract-modal__summary">
          <h3>Current contract</h3>
          <p>
            Current last contracted week:
            <strong>{formatPeriod(contractEndTick)}</strong>
          </p>

          <p>
            Remaining contract:
            <strong>
              {remainingWeeks} {remainingWeeks === 1 ? "week" : "weeks"},
              including this week
            </strong>
          </p>
        </div>

        <fieldset
          className="extend-contract-modal__fields"
          disabled={isExtending}
        >
          <legend className="extend-contract-modal__legend">
            Extension details
          </legend>

          <label className="extend-contract-modal__field">
            <span>Additional weeks</span>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={10}
              value={weeks}
              required
              autoFocus
              placeholder="Enter the weeks to add"
              aria-invalid={weeks !== "" && !hasValidWeeks}
              aria-describedby={weeks !== "" && !hasValidWeeks ? weeksErrorId : undefined}
              onChange={(event) => {
                setWeeks(event.target.value);
                clearError();
              }}
            />
          </label>

          {financesEnabled && (
            <label className="extend-contract-modal__field">
              <span>Extension cost</span>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={19}
                value={cost}
                required
                placeholder="Enter the cost from your game"
                aria-invalid={cost !== "" && (!hasValidCost || exceedsBudget)}
                aria-describedby={cost !== "" && !hasValidCost
                  ? costErrorId : exceedsBudget ? budgetErrorId : undefined}
                onChange={(event) => {
                  setCost(event.target.value);
                  clearError();
                }}
              />

              <span className="extend-contract-modal__hint">
                Available budget:{" "}
                {currencyFormatter.format(BigInt(budgetAvailable))}
              </span>
            </label>
          )}
        </fieldset>

        {!hasActiveContract && (
          <p className="extend-contract-modal__error" role="alert">
            This contract has expired and cannot be extended.
          </p>
        )}

        {weeks !== "" && !hasValidWeeks && (
          <p className="extend-contract-modal__error" role="alert" id={weeksErrorId}>
            Enter a valid extension of at least one week within the supported
            calendar.
          </p>
        )}

        {financesEnabled && cost !== "" && !hasValidCost && (
          <p className="extend-contract-modal__error" role="alert" id={costErrorId}>
            Enter a whole extension cost between 0 and{" "}
            9,223,372,036,854,775,807.
          </p>
        )}

        {exceedsBudget && (
          <p className="extend-contract-modal__error" role="alert" id={budgetErrorId}>
            The extension cost exceeds the available budget.
          </p>
        )}

        {newEndTick !== null && (
          <div className="extend-contract-modal__summary" aria-live="polite">
            <h3>After extension</h3>
            <p>
              New last contracted week:
              <strong>{formatPeriod(newEndTick)}</strong>
            </p>
            <p>
              Additional time
              <strong>{addedWeeks} {addedWeeks === 1 ? "week" : "weeks"}</strong>
            </p>
            {financesEnabled && hasValidCost && (
              <>
                <p>
                  Extension cost
                  <strong>{currencyFormatter.format(BigInt(cost))}</strong>
                </p>
                <p className={exceedsBudget ? "extend-contract-modal__over-budget" : undefined}>
                  {exceedsBudget ? "Over budget" : "Budget after extension"}
                  <strong>{currencyFormatter.format(exceedsBudget
                    ? BigInt(cost) - BigInt(budgetAvailable)
                    : BigInt(budgetAvailable) - BigInt(cost))}</strong>
                </p>
              </>
            )}
          </div>
        )}

        {errorMessage && (
          <p className="extend-contract-modal__error" role="alert">
            {errorMessage}
          </p>
        )}

        <p className={`extend-contract-modal__readiness${canSubmit ? " extend-contract-modal__readiness--ready" : ""}`} id={readinessId}>
          {canSubmit ? <Check size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
          {isExtending ? "Extending this contract…"
            : !hasActiveContract ? "This contract has expired and cannot be extended."
              : !hasValidWeeks ? "Enter the additional weeks to continue."
                : financesEnabled && !hasValidCost ? "Enter the extension cost. Use 0 if it is free."
                  : exceedsBudget ? "Reduce the extension cost to fit your available budget."
                    : "Extension details are ready to confirm."}
        </p>

        <footer className="extend-contract-modal__actions">
          <button
            className="extend-contract-modal__button"
            type="button"
            disabled={isExtending}
            onClick={requestClose}
          >
            Cancel
          </button>

          <button
            className="extend-contract-modal__button extend-contract-modal__button--primary"
            type="submit"
            disabled={!canSubmit || isExtending}
            aria-describedby={readinessId}
          >
            {isExtending ? <LoaderCircle className="extend-contract-modal__spinner" size={17} aria-hidden="true" />
              : <CalendarPlus size={17} aria-hidden="true" />}
            {isExtending ? "Extending…" : "Extend contract"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
