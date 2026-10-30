import { useEffect, useId, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
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

  if (customName) {
    return customName;
  }

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
  const startedOutside = useRef(false);
  const headingId = useId();

  const isOpen = feudId !== null;

  const { data, isLoading, errorMessage, retry } = useRivalryDetail(
    careerId,
    feudId,
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog || !isOpen) {
      return;
    }

    const previousFocus = document.activeElement;

    const careerScroller = dialog.closest<HTMLElement>(".mygm-layout__content");

    const previousBodyOverflow = document.body.style.overflowY;
    const previousCareerOverflow = careerScroller?.style.overflowY;

    document.body.style.overflowY = "hidden";

    if (careerScroller) {
      careerScroller.style.overflowY = "hidden";
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      document.body.style.overflowY = previousBodyOverflow;

      if (careerScroller) {
        careerScroller.style.overflowY = previousCareerOverflow ?? "";
      }

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    startedOutside.current =
      event.target === event.currentTarget &&
      isOutsideDialog(event.currentTarget, event.clientX, event.clientY);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const shouldClose =
      startedOutside.current &&
      event.target === event.currentTarget &&
      isOutsideDialog(event.currentTarget, event.clientX, event.clientY);

    startedOutside.current = false;

    if (shouldClose) {
      onClose();
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
      className="rivalry-modal"
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={handlePointerDown}
      onPointerCancel={() => {
        startedOutside.current = false;
      }}
      onClick={handleBackdropClick}
    >
      <header className="rivalry-modal__header">
        <div>
          <p className="rivalry-modal__eyebrow">Rivalry overview</p>

          <h2 id={headingId}>
            {data ? getRivalryName(data.rivalry) : "Rivalry details"}
          </h2>
        </div>

        <button
          className="rivalry-modal__close"
          type="button"
          aria-label="Close rivalry details"
          autoFocus
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="rivalry-modal__content" aria-busy={isLoading}>
        {isLoading && (
          <p className="rivalry-modal__message" role="status">
            Loading rivalry details…
          </p>
        )}

        {!isLoading && errorMessage && (
          <div className="rivalry-modal__state">
            <p role="alert">{errorMessage}</p>

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
            <div className="rivalry-modal__badges">
              <span>{kindLabels[data.rivalry.kind]}</span>
              <span>{statusLabels[data.rivalry.status]}</span>
            </div>

            <RivalryParticipants members={data.rivalry.members} />

            <RivalryLevel level={data.rivalry.level} />

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

            <RivalryRecentHistory
              careerId={careerId}
              history={data.history}
              onNavigate={onClose}
            />
          </>
        )}
      </div>
    </dialog>
  );
}
