import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

import { useTerminateContract } from "../../hooks/market/useTerminateContract";

import type { TerminateContractResult } from "../../types/market/marketContracts.types";

import "./TerminateContractModal.scss";

interface TerminateContractModalProps {
  careerId: string;
  membershipId: string;
  wrestlerName: string;
  hasChampionships: boolean;
  hasActiveRivalries: boolean;
  onClose: () => void;
  onTerminated: (result: TerminateContractResult) => void;
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

export default function TerminateContractModal({
  careerId,
  membershipId,
  wrestlerName,
  hasChampionships,
  hasActiveRivalries,
  onClose,
  onTerminated,
}: TerminateContractModalProps) {
  const headingId = useId();
  const descriptionId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const backdropPointerRef = useRef(false);

  const [requestId] = useState(() => crypto.randomUUID());

  const { isTerminating, errorMessage, terminate } = useTerminateContract();

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

  function requestClose() {
    if (submittingRef.current || isTerminating) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;

    try {
      const result = await terminate({
        careerId,
        membershipId,
        requestId,
      });

      if (result && mountedRef.current) {
        onTerminated(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="terminate-contract-modal"
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
      <header className="terminate-contract-modal__header">
        <div>
          <h2 id={headingId}>Terminate contract</h2>
          <p>{wrestlerName}</p>
        </div>

        <button
          className="terminate-contract-modal__close"
          type="button"
          aria-label="Close termination form"
          disabled={isTerminating}
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form
        className="terminate-contract-modal__form"
        onSubmit={handleSubmit}
        aria-busy={isTerminating}
      >
        <p id={descriptionId} className="terminate-contract-modal__description">
          End {wrestlerName}&apos;s current contract and release them from your
          roster.
        </p>

        <ul className="terminate-contract-modal__consequences">
          <li>The wrestler will become available in Market.</li>
          <li>Career statistics and history will be preserved.</li>
          <li>There is no termination cost or refund.</li>

          {hasChampionships && (
            <li>
              All currently held championships will become vacant, including the
              entire championship for shared titles.
            </li>
          )}

          {hasActiveRivalries && (
            <li>Active rivalries will become inactive.</li>
          )}
        </ul>

        <p className="terminate-contract-modal__notice">
          Wrestlers booked in pending shows must be removed from their matches,
          promos and interferences before their contract can end.
        </p>

        {errorMessage && (
          <p className="terminate-contract-modal__error" role="alert">
            {errorMessage}
          </p>
        )}

        <footer className="terminate-contract-modal__actions">
          <button
            className="terminate-contract-modal__button"
            type="button"
            disabled={isTerminating}
            autoFocus
            onClick={requestClose}
          >
            Keep contract
          </button>

          <button
            className="terminate-contract-modal__button terminate-contract-modal__button--danger"
            type="submit"
            disabled={isTerminating}
          >
            {isTerminating ? "Terminating…" : "Terminate contract"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
