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

function isOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number,
): boolean {
  const bounds = dialog.getBoundingClientRect();

  return (
    clientX < bounds.left ||
    clientX > bounds.right ||
    clientY < bounds.top ||
    clientY > bounds.bottom
  );
}

export default function BookingEditorModal({
  title,
  children,
  isBusy = false,
  onRequestClose,
}: BookingEditorModalProps) {
  const titleId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerRef = useRef(false);
  const animationRef = useRef<Animation | null>(null);
  const closingRef = useRef(false);
  const mountedRef = useRef(false);
  const onRequestCloseRef = useRef(onRequestClose);

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    mountedRef.current = true;
    closingRef.current = false;
    dialog.removeAttribute("data-closing");

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
      animationRef.current = dialog.animate(
        [
          { opacity: 0, transform: "translateY(20px)" },
          { opacity: 1, transform: "translateY(0)" },
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
    const dialog = dialogRef.current;

    if (!dialog || isBusy || closingRef.current) {
      return;
    }

    closingRef.current = true;
    backdropPointerRef.current = false;
    animationRef.current?.cancel();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onRequestCloseRef.current();
      return;
    }

    dialog.setAttribute("data-closing", "true");

    const animation = dialog.animate(
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(12px)" },
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
        if (mountedRef.current) {
          onRequestCloseRef.current();
        }
      },
      () => {
        // Cancellation is expected when the component unmounts.
      },
    );
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
