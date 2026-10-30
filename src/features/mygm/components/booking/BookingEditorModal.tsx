import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./BookingEditorModal.scss";

interface BookingEditorModalProps {
  title: string;
  children: ReactNode;
  isBusy?: boolean;
  onRequestClose: () => void;
}

export default function BookingEditorModal({
  title,
  children,
  isBusy = false,
  onRequestClose,
}: BookingEditorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    if (!dialog) return;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  function isOutsideDialog(
    dialog: HTMLDialogElement,
    clientX: number,
    clientY: number,
  ) {
    const bounds = dialog.getBoundingClientRect();

    return (
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    );
  }

  function requestClose() {
    if (!isBusy) {
      onRequestClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="booking-editor-modal"
      aria-labelledby={titleId}
      aria-busy={isBusy}
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
        const shouldClose =
          backdropPointerRef.current &&
          event.target === event.currentTarget &&
          isOutsideDialog(event.currentTarget, event.clientX, event.clientY);

        backdropPointerRef.current = false;

        if (shouldClose) {
          requestClose();
        }
      }}
    >
      <div className="booking-editor-modal__surface">
        <header className="booking-editor-modal__header">
          <h2 id={titleId}>{title}</h2>

          <button
            className="booking-editor-modal__close"
            type="button"
            aria-label="Close editor"
            disabled={isBusy}
            autoFocus
            onClick={requestClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="booking-editor-modal__body">{children}</div>
      </div>
    </dialog>
  );
}
