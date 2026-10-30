import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

import { useReignDefenses } from "../../../hooks/championships/useReignDefenses";

import type {
  ChampionshipDefenseParticipant,
  ChampionshipReign,
} from "../../../types/championships/championshipDetail.types";

import "./ReignDefensesModal.scss";

interface ReignDefensesModalProps {
  careerId: string;
  titleId: string;
  reign: ChampionshipReign;
  onClose: () => void;
}

function getMatchLabel(participants: ChampionshipDefenseParticipant[]): string {
  const teams = new Map<number, string[]>();

  for (const participant of participants) {
    const members = teams.get(participant.side) ?? [];
    members.push(participant.name);
    teams.set(participant.side, members);
  }

  return (
    [...teams.entries()]
      .sort(([first], [second]) => first - second)
      .map(([, names]) => names.join(" & "))
      .join(" vs ") || "Participants not recorded"
  );
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

export default function ReignDefensesModal({
  careerId,
  titleId,
  reign,
  onClose,
}: ReignDefensesModalProps) {
  const headingId = useId();
  const descriptionId = useId();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerRef = useRef(false);

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useReignDefenses(careerId, titleId, reign.id);

  const holderNames =
    reign.holders.map((holder) => holder.name).join(" & ") || "Selected reign";

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

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

  return (
    <dialog
      ref={dialogRef}
      className="reign-defenses-modal"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
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
          onClose();
        }
      }}
    >
      <header className="reign-defenses-modal__header">
        <div>
          <h2 id={headingId}>Successful defenses</h2>
          <p id={descriptionId}>{holderNames}</p>
        </div>

        <button
          className="reign-defenses-modal__close"
          type="button"
          aria-label="Close defenses"
          autoFocus
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="reign-defenses-modal__content" aria-busy={isLoading}>
        {isLoading ? (
          <p className="reign-defenses-modal__state" role="status">
            Loading defenses…
          </p>
        ) : errorMessage ? (
          <div className="reign-defenses-modal__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="reign-defenses-modal__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          data.items.length === 0 ? (
            <p className="reign-defenses-modal__state">
              No successful defenses have been recorded for this reign.
            </p>
          ) : (
            <>
              <p className="reign-defenses-modal__count" role="status">
                {data.total_count}{" "}
                {data.total_count === 1
                  ? "successful defense"
                  : "successful defenses"}
              </p>

              <ol className="reign-defenses-modal__list">
                {data.items.map((defense) => {
                  const winners = defense.participants
                    .filter((participant) => participant.result === "winner")
                    .map((participant) => participant.name)
                    .join(" & ");

                  return (
                    <li
                      className="reign-defenses-modal__card"
                      key={defense.segment_id}
                    >
                      <p className="reign-defenses-modal__period">
                        Season {defense.season}
                        {" · "}
                        Week {defense.week}
                        {" · "}
                        Segment {defense.position}
                      </p>

                      <h3>{getMatchLabel(defense.participants)}</h3>

                      <p className="reign-defenses-modal__match-type">
                        {defense.format_name}

                        {defense.stipulation_name &&
                          ` · ${defense.stipulation_name}`}
                      </p>

                      <dl className="reign-defenses-modal__details">
                        <div>
                          <dt>Match rating</dt>
                          <dd>
                            {defense.rating === null
                              ? "Not rated"
                              : `${defense.rating} ${
                                  defense.rating === 1 ? "star" : "stars"
                                }`}
                          </dd>
                        </div>

                        {winners && (
                          <div>
                            <dt>Winners</dt>
                            <dd>{winners}</dd>
                          </div>
                        )}
                      </dl>

                      <Link
                        className="reign-defenses-modal__show-link"
                        to={`/mygm/${careerId}/history/${defense.event_id}`}
                        onClick={onClose}
                      >
                        View show: {defense.event_name}
                      </Link>
                    </li>
                  );
                })}
              </ol>

              {data.total_pages > 1 && (
                <nav
                  className="reign-defenses-modal__pagination"
                  aria-label="Reign defenses pagination"
                >
                  <button
                    className="reign-defenses-modal__button"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of {data.total_pages}
                  </span>

                  <button
                    className="reign-defenses-modal__button"
                    type="button"
                    disabled={page >= data.total_pages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )
        ) : null}
      </div>
    </dialog>
  );
}
