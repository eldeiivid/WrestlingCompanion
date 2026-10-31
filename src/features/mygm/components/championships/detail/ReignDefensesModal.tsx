import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

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

function WinnerPortrait({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="reign-defenses-modal__portrait" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <UserRound size={22} strokeWidth={1.25} />
      )}
    </span>
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
  const contentRef = useRef<HTMLDivElement>(null);
  const backdropPointerRef = useRef(false);
  const animationRef = useRef<Animation | null>(null);
  const closingRef = useRef(false);
  const mountedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useReignDefenses(careerId, titleId, reign.id);

  const holderNames =
    reign.holders.map((holder) => holder.name).join(" & ") || "Selected reign";

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

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

    if (!dialog || closingRef.current) return;

    closingRef.current = true;
    backdropPointerRef.current = false;
    animationRef.current?.cancel();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCloseRef.current();
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
          onCloseRef.current();
        }
      },
      () => {
        // Cancellation is expected when the component unmounts.
      },
    );
  }

  function handlePageChange(nextPage: number) {
    if (
      isLoading ||
      closingRef.current ||
      !data ||
      nextPage < 1 ||
      nextPage > data.total_pages
    ) {
      return;
    }

    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    goToPage(nextPage);
  }

  return (
    <dialog
      ref={dialogRef}
      className="reign-defenses-modal"
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
      <header className="reign-defenses-modal__header">
        <div className="reign-defenses-modal__heading">
          <span className="reign-defenses-modal__icon" aria-hidden="true">
            <Trophy size={20} strokeWidth={1.5} />
          </span>

          <div>
            <h2 id={headingId}>Successful defenses</h2>
            <p id={descriptionId}>{holderNames}</p>
          </div>
        </div>

        <button
          className="reign-defenses-modal__close"
          type="button"
          aria-label="Close defenses"
          autoFocus
          onClick={requestClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div
        ref={contentRef}
        className="reign-defenses-modal__content"
        aria-busy={isLoading}
      >
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
                  const winners = defense.participants.filter(
                    (participant) => participant.result === "winner",
                  );

                  const visibleWinners = winners.slice(0, 2);
                  const additionalWinners =
                    winners.length - visibleWinners.length;

                  return (
                    <li
                      className="reign-defenses-modal__card"
                      key={defense.segment_id}
                    >
                      <p className="reign-defenses-modal__period">
                        Season {defense.season} · Week {defense.week}
                        {" · "}
                        Segment {defense.position}
                      </p>

                      <h3>{getMatchLabel(defense.participants)}</h3>

                      <p className="reign-defenses-modal__match-type">
                        {defense.format_name}
                        {defense.stipulation_name
                          ? ` · ${defense.stipulation_name}`
                          : ""}
                      </p>

                      <div className="reign-defenses-modal__result">
                        {winners.length > 0 && (
                          <div className="reign-defenses-modal__winners">
                            <div
                              className="reign-defenses-modal__portraits"
                              aria-hidden="true"
                            >
                              {visibleWinners.map((winner) => (
                                <WinnerPortrait
                                  key={winner.wrestler_id}
                                  src={winner.image_url}
                                />
                              ))}

                              {additionalWinners > 0 && (
                                <span className="reign-defenses-modal__more">
                                  +{additionalWinners}
                                </span>
                              )}
                            </div>

                            <div className="reign-defenses-modal__winner-copy">
                              <span>
                                {winners.length === 1 ? "Winner" : "Winners"}
                              </span>
                              <strong>
                                {winners
                                  .map((winner) => winner.name)
                                  .join(" & ")}
                              </strong>
                            </div>
                          </div>
                        )}

                        <p
                          className="reign-defenses-modal__rating"
                          aria-label={
                            defense.rating === null
                              ? "Match not rated"
                              : `Match rating: ${defense.rating} out of 5 stars`
                          }
                        >
                          <Star size={15} aria-hidden="true" />

                          {defense.rating === null ? (
                            <span>Not rated</span>
                          ) : (
                            <>
                              <strong>{defense.rating}</strong>
                              <span>/ 5</span>
                            </>
                          )}
                        </p>
                      </div>

                      {defense.outcome === "draw" && (
                        <p className="reign-defenses-modal__note">
                          This match ended in a draw.
                        </p>
                      )}

                      {defense.outcome === "no_contest" && (
                        <p className="reign-defenses-modal__note">
                          This match ended in a no contest.
                        </p>
                      )}

                      <Link
                        className="reign-defenses-modal__show-link"
                        to={`/mygm/${careerId}/history/${defense.event_id}`}
                        onClick={requestClose}
                        aria-label={`View ${defense.event_name}, season ${defense.season}, week ${defense.week}`}
                      >
                        <span>View show: {defense.event_name}</span>
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )
        ) : null}
      </div>

      {!errorMessage &&
        data &&
        data.items.length > 0 &&
        data.total_pages > 1 && (
          <nav
            className="reign-defenses-modal__pagination"
            aria-label="Reign defenses pagination"
          >
            <button
              className="reign-defenses-modal__button"
              type="button"
              disabled={isLoading || page <= 1}
              aria-label="Previous page"
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <span>
              Page {page} of {data.total_pages}
            </span>

            <button
              className="reign-defenses-modal__button"
              type="button"
              disabled={isLoading || page >= data.total_pages}
              aria-label="Next page"
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </nav>
        )}
    </dialog>
  );
}
