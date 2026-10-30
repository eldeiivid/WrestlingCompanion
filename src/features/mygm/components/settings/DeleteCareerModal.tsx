import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";

import { useDeleteCareer } from "../../hooks/settings/useDeleteCareer";

import type { DeleteCareerResult } from "../../types/settings/careerSettings.types";

import "./DeleteCareerModal.scss";

interface DeleteCareerModalProps {
  careerId: string;
  careerName: string;
  onClose: () => void;
  onDeleted: (result: DeleteCareerResult) => void;
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

export default function DeleteCareerModal({
  careerId,
  careerName,
  onClose,
  onDeleted,
}: DeleteCareerModalProps) {
  const headingId = useId();
  const descriptionId = useId();
  const hintId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const backdropPointerRef = useRef(false);

  const [confirmationName, setConfirmationName] = useState("");

  const { isDeleting, errorMessage, deleteCareer, clearError } =
    useDeleteCareer();

  const isConfirmed = careerName.length > 0 && confirmationName === careerName;

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
    if (submittingRef.current || isDeleting) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isConfirmed || submittingRef.current || isDeleting) {
      return;
    }

    submittingRef.current = true;

    try {
      const result = await deleteCareer({
        careerId,
        confirmationName,
      });

      if (result && mountedRef.current) {
        onDeleted(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="delete-career-modal"
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
      <header className="delete-career-modal__header">
        <h2 id={headingId}>Delete career</h2>

        <button
          className="delete-career-modal__close"
          type="button"
          aria-label="Close deletion form"
          disabled={isDeleting}
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form
        className="delete-career-modal__form"
        onSubmit={handleSubmit}
        aria-busy={isDeleting}
      >
        <p id={descriptionId} className="delete-career-modal__warning">
          This permanently deletes the career and its roster, contracts, shows,
          results, championship history, rivalries and news. This action cannot
          be undone.
        </p>

        <div className="delete-career-modal__confirmation">
          <p>Career to delete:</p>

          <strong className="delete-career-modal__name">{careerName}</strong>
        </div>

        <label className="delete-career-modal__field">
          <span>Type the career name to confirm</span>

          <input
            type="text"
            value={confirmationName}
            required
            disabled={isDeleting}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={hintId}
            onChange={(event) => {
              setConfirmationName(event.target.value);
              clearError();
            }}
          />
        </label>

        <p id={hintId} className="delete-career-modal__hint">
          Enter the name exactly as shown, including capitalization and spaces.
        </p>

        {errorMessage && (
          <p className="delete-career-modal__error" role="alert">
            {errorMessage}
          </p>
        )}

        <footer className="delete-career-modal__actions">
          <button
            className="delete-career-modal__button"
            type="button"
            disabled={isDeleting}
            autoFocus
            onClick={requestClose}
          >
            Cancel
          </button>

          <button
            className="delete-career-modal__button delete-career-modal__button--danger"
            type="submit"
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete career permanently"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
