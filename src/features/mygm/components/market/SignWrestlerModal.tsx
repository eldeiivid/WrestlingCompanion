import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

import { useSignWrestler } from "../../hooks/market/useSignWrestler";

import type {
  SigningWrestlerReference,
  SignWrestlerResult,
} from "../../types/market/marketContracts.types";

import "./SignWrestlerModal.scss";

interface SignWrestlerModalProps {
  careerId: string;
  wrestler: SigningWrestlerReference;
  wrestlerName: string;
  currentTick: number;
  financesEnabled: boolean;
  budgetAvailable: string;
  onClose: () => void;
  onSigned: (result: SignWrestlerResult) => void;
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

export default function SignWrestlerModal({
  careerId,
  wrestler,
  wrestlerName,
  currentTick,
  financesEnabled,
  budgetAvailable,
  onClose,
  onSigned,
}: SignWrestlerModalProps) {
  const headingId = useId();
  const descriptionId = useId();

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

  const { isSigning, errorMessage, sign, clearError } = useSignWrestler();

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

  const contractWeeks = /^\d+$/.test(weeks) ? Number(weeks) : NaN;

  const hasValidWeeks =
    Number.isSafeInteger(contractWeeks) &&
    contractWeeks >= 1 &&
    contractWeeks <= 2147483646 - currentTick + 1;

  const endTick = hasValidWeeks ? currentTick + contractWeeks - 1 : null;

  const hasValidCost = /^\d+$/.test(cost) && BigInt(cost) <= maxBigInt;

  const exceedsBudget =
    financesEnabled && hasValidCost && BigInt(cost) > BigInt(budgetAvailable);

  const canSubmit =
    hasValidWeeks && (!financesEnabled || (hasValidCost && !exceedsBudget));

  function requestClose() {
    if (submittingRef.current || isSigning) {
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
      const signingCost = financesEnabled ? BigInt(cost).toString() : null;

      const signature = JSON.stringify({
        careerId,
        wrestler,
        contractWeeks,
        cost: signingCost,
      });

      if (requestRef.current?.signature !== signature) {
        requestRef.current = {
          signature,
          id: crypto.randomUUID(),
        };
      }

      const result = await sign({
        careerId,
        requestId: requestRef.current.id,
        wrestler,
        contractWeeks,
        cost: signingCost,
      });

      if (result && mountedRef.current) {
        onSigned(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sign-wrestler-modal"
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
      <header className="sign-wrestler-modal__header">
        <div>
          <h2 id={headingId}>Sign wrestler</h2>
          <p>{wrestlerName}</p>
        </div>

        <button
          className="sign-wrestler-modal__close"
          type="button"
          aria-label="Close signing form"
          disabled={isSigning}
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form
        className="sign-wrestler-modal__form"
        onSubmit={handleSubmit}
        aria-busy={isSigning}
      >
        <p id={descriptionId} className="sign-wrestler-modal__description">
          Enter the contract details shown in your game.
        </p>

        <fieldset className="sign-wrestler-modal__fields" disabled={isSigning}>
          <legend className="sign-wrestler-modal__legend">
            Contract details
          </legend>

          <label className="sign-wrestler-modal__field">
            <span>Contract length (weeks)</span>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={10}
              value={weeks}
              required
              autoFocus
              placeholder="Enter the number of weeks"
              onChange={(event) => {
                setWeeks(event.target.value);
                clearError();
              }}
            />
          </label>

          {financesEnabled && (
            <label className="sign-wrestler-modal__field">
              <span>Signing cost</span>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={19}
                value={cost}
                required
                placeholder="Enter the cost from your game"
                onChange={(event) => {
                  setCost(event.target.value);
                  clearError();
                }}
              />

              <span className="sign-wrestler-modal__hint">
                Available budget:{" "}
                {currencyFormatter.format(BigInt(budgetAvailable))}
              </span>
            </label>
          )}
        </fieldset>

        {weeks !== "" && !hasValidWeeks && (
          <p className="sign-wrestler-modal__error" role="alert">
            Enter a valid contract length of at least one week.
          </p>
        )}

        {financesEnabled && cost !== "" && !hasValidCost && (
          <p className="sign-wrestler-modal__error" role="alert">
            Enter a whole signing cost between 0 and 9,223,372,036,854,775,807.
          </p>
        )}

        {exceedsBudget && (
          <p className="sign-wrestler-modal__error" role="alert">
            The signing cost exceeds the available budget.
          </p>
        )}

        {endTick !== null && (
          <div className="sign-wrestler-modal__summary">
            <p>
              Starts: <strong>{formatPeriod(currentTick)}</strong>
            </p>

            <p>
              Last contracted week: <strong>{formatPeriod(endTick)}</strong>
            </p>
          </div>
        )}

        {errorMessage && (
          <p className="sign-wrestler-modal__error" role="alert">
            {errorMessage}
          </p>
        )}

        <footer className="sign-wrestler-modal__actions">
          <button
            className="sign-wrestler-modal__button"
            type="button"
            disabled={isSigning}
            onClick={requestClose}
          >
            Cancel
          </button>

          <button
            className="sign-wrestler-modal__button sign-wrestler-modal__button--primary"
            type="submit"
            disabled={!canSubmit || isSigning}
          >
            {isSigning ? "Signing…" : "Sign wrestler"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
