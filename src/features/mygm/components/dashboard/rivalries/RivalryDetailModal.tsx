import { useCallback, useEffect, useId, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { LoaderCircle, Swords, X } from "lucide-react";

import { useRivalryDetail } from "../../../hooks/rivalries/useRivalryDetail";

import type {
  RivalryDetail,
  RivalryKind,
  RivalryStatus,
} from "../../../types/rivalries/rivalries.types";

import RivalryLevel from "./RivalryLevel";
import RivalryParticipants from "./RivalryParticipants";
import RivalryRecentHistory from "./RivalryRecentHistory";

import "./RivalryDetailModal.scss";

interface RivalryDetailModalProps {
  careerId: string;
  feudId: string | null;
  onClose: () => void;
}

const kindLabels: Record<RivalryKind, string> = {
  singles: "Singles rivalry",
  tag_team: "Tag team rivalry",
  stable: "Stable rivalry",
};

const statusLabels: Record<RivalryStatus, string> = {
  active: "Active",
  resolved: "Resolved",
  stale: "Stale",
};

function getRivalryName(rivalry: RivalryDetail): string {
  const customName = rivalry.name?.trim();

  if (customName) return customName;

  const firstSide = rivalry.members
    .filter((member) => member.side === 1)
    .map((member) => member.name)
    .join(" & ");

  const secondSide = rivalry.members
    .filter((member) => member.side === 2)
    .map((member) => member.name)
    .join(" & ");

  return firstSide && secondSide
    ? `${firstSide} vs ${secondSide}`
    : "Rivalry details";
}

function formatTick(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

export default function RivalryDetailModal({
  careerId,
  feudId,
  onClose,
}: RivalryDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const isClosingRef = useRef(false);
  const startedOutsideRef = useRef(false);
  const onCloseRef = useRef(onClose);

  const headingId = useId();
  const factsId = useId();

  const isOpen = feudId !== null;

  const { data, isLoading, errorMessage, retry } = useRivalryDetail(
    careerId,
    feudId,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const finishClose = useCallback(() => {
    animationRef.current?.cancel();
    animationRef.current = null;
    isClosingRef.current = false;
    startedOutsideRef.current = false;

    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
    }

    dialog?.classList.remove("is-closing");

    onCloseRef.current();
  }, []);

  const requestClose = useCallback(() => {
    const dialog = dialogRef.current;

    if (!dialog?.open || isClosingRef.current) return;

    if (prefersReducedMotion() || typeof dialog.animate !== "function") {
      finishClose();
      return;
    }

    isClosingRef.current = true;

    const computed = window.getComputedStyle(dialog);

    const currentFrame = {
      opacity: computed.opacity,
      transform: computed.transform,
    };

    animationRef.current?.cancel();
    dialog.classList.add("is-closing");

    const isDesktop = window.matchMedia("(min-width: 576px)").matches;

    const animation = dialog.animate(
      [
        currentFrame,
        {
          opacity: 0,
          transform: isDesktop
            ? "translateY(16px) scale(0.985)"
            : "translateY(32px)",
        },
      ],
      {
        duration: 180,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "both",
      },
    );

    animationRef.current = animation;

    void animation.finished.then(
      () => {
        if (animationRef.current === animation) {
          finishClose();
        }
      },
      () => {
        // Cancellation is expected when the modal unmounts.
      },
    );
  }, [finishClose]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !isOpen) return;

    const previousFocus = document.activeElement;

    const careerScroller =
      dialog.closest<HTMLElement>(".mygm-layout__content") ??
      dialog
        .closest(".mygm-layout")
        ?.querySelector<HTMLElement>(".mygm-layout__content");

    const previousBodyOverflow = document.body.style.overflowY;
    const previousCareerOverflow = careerScroller?.style.overflowY;

    document.body.style.overflowY = "hidden";

    if (careerScroller) {
      careerScroller.style.overflowY = "hidden";
    }

    isClosingRef.current = false;
    startedOutsideRef.current = false;
    dialog.classList.remove("is-closing");

    if (!dialog.open) {
      dialog.showModal();
    }

    contentRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });

    if (!prefersReducedMotion() && typeof dialog.animate === "function") {
      const isDesktop = window.matchMedia("(min-width: 576px)").matches;

      const animation = dialog.animate(
        [
          {
            opacity: 0,
            transform: isDesktop
              ? "translateY(18px) scale(0.985)"
              : "translateY(48px)",
          },
          {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "both",
        },
      );

      animationRef.current = animation;

      void animation.finished.then(
        () => {
          if (animationRef.current === animation) {
            animationRef.current = null;
            animation.cancel();
          }
        },
        () => {
          // Closing may interrupt the opening animation.
        },
      );
    }

    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      isClosingRef.current = false;

      if (dialog.open) {
        dialog.close();
      }

      dialog.classList.remove("is-closing");

      document.body.style.overflowY = previousBodyOverflow;

      if (careerScroller) {
        careerScroller.style.overflowY = previousCareerOverflow ?? "";
      }

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        previousFocus.getClientRects().length > 0
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen, careerId, feudId]);

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    startedOutsideRef.current =
      event.target === event.currentTarget &&
      isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const shouldClose =
      startedOutsideRef.current &&
      event.target === event.currentTarget &&
      isOutsideDialog(event.currentTarget, event.clientX, event.clientY);

    startedOutsideRef.current = false;

    if (shouldClose) {
      requestClose();
    }
  }

  const winnerNames =
    data?.rivalry.winning_side == null
      ? ""
      : data.rivalry.members
          .filter((member) => member.side === data.rivalry.winning_side)
          .map((member) => member.name)
          .join(" & ");

  return (
    <dialog
      ref={dialogRef}
      className="rivalry-modal"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onPointerDown={handlePointerDown}
      onPointerCancel={() => {
        startedOutsideRef.current = false;
      }}
      onClick={handleBackdropClick}
    >
      <header className="rivalry-modal__header">
        <div className="rivalry-modal__header-copy">
          <span className="rivalry-modal__header-icon" aria-hidden="true">
            <Swords size={21} />
          </span>

          <div>
            <p>Career stories</p>
            <h2 id={headingId}>Rivalry details</h2>
          </div>
        </div>

        <button
          className="rivalry-modal__close"
          type="button"
          aria-label="Close rivalry details"
          autoFocus
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div
        ref={contentRef}
        className="rivalry-modal__content"
        aria-busy={isLoading}
      >
        {isLoading && (
          <div className="rivalry-modal__state">
            <LoaderCircle
              className="rivalry-modal__spinner"
              size={26}
              aria-hidden="true"
            />

            <p role="status">Loading rivalry details…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="rivalry-modal__state">
            <p className="rivalry-modal__error" role="alert">
              {errorMessage}
            </p>

            <button
              className="rivalry-modal__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <>
            <section
              className="rivalry-modal__hero"
              aria-label="Rivalry matchup"
            >
              <div className="rivalry-modal__badges">
                <span>{kindLabels[data.rivalry.kind]}</span>

                <span
                  className={
                    data.rivalry.status === "active" ? "is-active" : ""
                  }
                >
                  {statusLabels[data.rivalry.status]}
                </span>
              </div>

              <h3>{getRivalryName(data.rivalry)}</h3>

              <RivalryParticipants members={data.rivalry.members} />
            </section>

            <div className="rivalry-modal__level">
              <RivalryLevel level={data.rivalry.level} />
            </div>

            <section
              className="rivalry-modal__overview"
              aria-labelledby={factsId}
            >
              <h3 id={factsId}>The story so far</h3>

              <dl className="rivalry-modal__facts">
                <div>
                  <dt>Started</dt>
                  <dd>
                    Season {data.rivalry.started_season}
                    {" · "}
                    Week {data.rivalry.started_week}
                  </dd>
                </div>

                <div>
                  <dt>Duration</dt>
                  <dd>
                    {data.rivalry.weeks_active}{" "}
                    {data.rivalry.weeks_active === 1 ? "week" : "weeks"}
                  </dd>
                </div>

                {data.rivalry.ended_tick !== null && (
                  <div>
                    <dt>Ended</dt>
                    <dd>{formatTick(data.rivalry.ended_tick)}</dd>
                  </div>
                )}

                {data.rivalry.status === "resolved" && (
                  <div>
                    <dt>Rivalry winner</dt>
                    <dd>{winnerNames || "No winner assigned"}</dd>
                  </div>
                )}
              </dl>
            </section>

            <div className="rivalry-modal__history">
              <RivalryRecentHistory
                careerId={careerId}
                history={data.history}
                onNavigate={requestClose}
              />
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
