import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Trash2, X } from "lucide-react";

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
  const animationRef = useRef<Animation | null>(null);
  const submittingRef = useRef(false);
  const closingRef = useRef(false);
  const mountedRef = useRef(false);
  const backdropPointerRef = useRef(false);
  const callbacksRef = useRef({ onClose, onDeleted });

  const [confirmationName, setConfirmationName] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const { isDeleting, errorMessage, deleteCareer, clearError } =
    useDeleteCareer();

  const isConfirmed = careerName.length > 0 && confirmationName === careerName;

  const isBusy = isDeleting || isClosing;

  useEffect(() => {
    callbacksRef.current = { onClose, onDeleted };
  }, [onClose, onDeleted]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    mountedRef.current = true;
    closingRef.current = false;

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

    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const isMobile = window.matchMedia("(max-width: 575px)").matches;

      animationRef.current = dialog.animate(
        [
          {
            opacity: 0,
            transform: isMobile
              ? "translateY(40px)"
              : "translateY(16px) scale(0.98)",
          },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        ],
        {
          duration: 240,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    }

    return () => {
      mountedRef.current = false;
      animationRef.current?.cancel();
      animationRef.current = null;

      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflow = previousBodyOverflow;

      if (scrollContainer) {
        scrollContainer.style.overflowY = previousContentOverflow ?? "";
      }

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  function requestClose() {
    if (
      submittingRef.current ||
      isDeleting ||
      closingRef.current ||
      !mountedRef.current
    ) {
      return;
    }

    closingRef.current = true;
    setIsClosing(true);

    const dialog = dialogRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!dialog || reduceMotion) {
      callbacksRef.current.onClose();
      return;
    }

    const currentStyle = window.getComputedStyle(dialog);
    const initialOpacity = currentStyle.opacity;
    const initialTransform = currentStyle.transform;

    animationRef.current?.cancel();

    const isMobile = window.matchMedia("(max-width: 575px)").matches;

    const animation = dialog.animate(
      [
        {
          opacity: initialOpacity,
          transform: initialTransform,
        },
        {
          opacity: 0,
          transform: isMobile
            ? "translateY(32px)"
            : "translateY(12px) scale(0.98)",
        },
      ],
      {
        duration: 160,
        easing: "ease-in",
        fill: "forwards",
      },
    );

    animationRef.current = animation;

    void animation.finished.then(
      () => {
        if (mountedRef.current && animationRef.current === animation) {
          callbacksRef.current.onClose();
        }
      },
      () => {
        // Unmounting cancels the animation.
      },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !isConfirmed ||
      submittingRef.current ||
      isDeleting ||
      closingRef.current
    ) {
      return;
    }

    submittingRef.current = true;

    try {
      const result = await deleteCareer({
        careerId,
        confirmationName,
      });

      if (result && mountedRef.current) {
        callbacksRef.current.onDeleted(result);
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="delete-career-modal"
      data-closing={isClosing ? "true" : undefined}
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
      onPointerCancel={() => {
        backdropPointerRef.current = false;
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
        <div className="delete-career-modal__heading">
          <span className="delete-career-modal__icon" aria-hidden="true">
            <Trash2 size={20} strokeWidth={1.75} />
          </span>

          <h2 id={headingId}>Delete career</h2>
        </div>

        <button
          className="delete-career-modal__close"
          type="button"
          aria-label="Close deletion form"
          disabled={isBusy}
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
        <div className="delete-career-modal__content">
          <p id={descriptionId} className="delete-career-modal__warning">
            This permanently deletes the career and its roster, contracts,
            shows, results, championship history, rivalries and news. This
            action cannot be undone.
          </p>

          <div className="delete-career-modal__confirmation">
            <p>Career to delete</p>

            <strong className="delete-career-modal__name">{careerName}</strong>
          </div>

          <label className="delete-career-modal__field">
            <span>Type the career name to confirm</span>

            <input
              type="text"
              value={confirmationName}
              required
              disabled={isBusy}
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
            Enter the name exactly as shown, including capitalization and
            spaces.
          </p>

          {errorMessage && (
            <p className="delete-career-modal__error" role="alert">
              {errorMessage}
            </p>
          )}

          <p className="delete-career-modal__status" role="status">
            {isDeleting ? "Deleting career. Please wait…" : ""}
          </p>
        </div>

        <footer className="delete-career-modal__actions">
          <button
            className="delete-career-modal__button"
            type="button"
            disabled={isBusy}
            autoFocus
            onClick={requestClose}
          >
            Cancel
          </button>

          <button
            className="delete-career-modal__button delete-career-modal__button--danger"
            type="submit"
            disabled={!isConfirmed || isBusy}
          >
            {isDeleting ? "Deleting…" : "Delete career permanently"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
