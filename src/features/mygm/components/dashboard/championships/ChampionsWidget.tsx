import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Trophy,
  UserRound,
} from "lucide-react";

import type { DashboardChampionship } from "../../../types/dashboard.types";

import "./ChampionsWidget.scss";

interface ChampionsWidgetProps {
  careerId: string;
  currentTick: number;
  championships: DashboardChampionship[];
}

const categoryLabels: Record<DashboardChampionship["category"], string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag Team",
  mitb: "Money in the Bank",
  other: "Championship",
};

function ChampionshipImage({
  src,
  fallback,
}: {
  src: string | null;
  fallback: ReactNode;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img src={src} alt="" loading="lazy" onError={() => setFailedUrl(src)} />
  ) : (
    fallback
  );
}

export default function ChampionsWidget({
  careerId,
  currentTick,
  championships,
}: ChampionsWidgetProps) {
  const headingId = useId();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const [scrollState, setScrollState] = useState({
    canPrevious: false,
    canNext: false,
  });

  const listKey = championships.map((title) => title.id).join("|");

  useEffect(() => {
    const list = listRef.current;

    if (!list) return;

    function updateScrollState() {
      if (!list) return;

      const maximumScroll = list.scrollWidth - list.clientWidth;

      const canPrevious = list.scrollLeft > 2;
      const canNext = list.scrollLeft < maximumScroll - 2;

      setScrollState((previous) =>
        previous.canPrevious === canPrevious && previous.canNext === canNext
          ? previous
          : { canPrevious, canNext },
      );
    }

    list.scrollTo({
      left: 0,
      behavior: "instant",
    });

    updateScrollState();

    list.addEventListener("scroll", updateScrollState, {
      passive: true,
    });

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(list);

    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", updateScrollState);
    };
  }, [careerId, listKey]);

  function scrollTitles(direction: -1 | 1) {
    const list = listRef.current;

    if (!list) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    list.scrollBy({
      left: direction * list.clientWidth * 0.85,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  return (
    <section className="champions-widget" aria-labelledby={headingId}>
      <header className="champions-widget__header">
        <h2 id={headingId}>Championships</h2>

        <Link to={`/mygm/${careerId}/titles`}>
          View all titles
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {championships.length === 0 ? (
        <div className="champions-widget__empty">
          <span className="champions-widget__empty-icon">
            <Trophy size={28} aria-hidden="true" />
          </span>

          <div>
            <h3>No championships selected.</h3>
            <p>This career has no titles to display.</p>
          </div>
        </div>
      ) : (
        <>
          <ul
            ref={listRef}
            id={listId}
            className={[
              "champions-widget__list",
              championships.length === 1
                ? "champions-widget__list--single"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Championships and briefcases"
            tabIndex={championships.length > 1 ? 0 : undefined}
          >
            {championships.map((title) => {
              const isBriefcase = title.category === "mitb";
              const hasReign = Boolean(title.reign_id);

              const holders = hasReign ? title.holders : [];

              const elapsedWeeks =
                title.won_tick === null
                  ? 0
                  : Math.max(0, currentTick - title.won_tick);

              const holderLabel = isBriefcase
                ? holders.length === 1
                  ? "Briefcase holder"
                  : "Briefcase holders"
                : holders.length === 1
                  ? "Champion"
                  : "Champions";

              const statusLabel = !hasReign
                ? isBriefcase
                  ? "Unclaimed"
                  : "Vacant"
                : "Holder unavailable";

              const TitleIcon = isBriefcase ? Briefcase : Trophy;

              return (
                <li className="champions-widget__card" key={title.id}>
                  <Link
                    className="champions-widget__card-link"
                    to={`/mygm/${careerId}/titles/${title.id}`}
                    aria-label={`View ${title.name}`}
                  >
                    <div className="champions-widget__visual">
                      <span className="champions-widget__category">
                        {categoryLabels[title.category]}
                      </span>

                      <span
                        className="champions-widget__belt"
                        aria-hidden="true"
                      >
                        <ChampionshipImage
                          src={title.image_url}
                          fallback={<TitleIcon size={34} />}
                        />
                      </span>

                      <div
                        className={[
                          "champions-widget__people",
                          holders.length > 1
                            ? "champions-widget__people--pair"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-hidden="true"
                      >
                        {holders.length > 0 ? (
                          holders.slice(0, 2).map((holder) => (
                            <span
                              className="champions-widget__person"
                              key={holder.id}
                            >
                              <ChampionshipImage
                                src={holder.image_url}
                                fallback={<UserRound size={38} />}
                              />
                            </span>
                          ))
                        ) : (
                          <span className="champions-widget__vacant-art">
                            <TitleIcon size={62} strokeWidth={1} />
                          </span>
                        )}

                        {holders.length > 2 && (
                          <span className="champions-widget__extra">
                            +{holders.length - 2}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="champions-widget__body">
                      <h3>{title.name}</h3>

                      <div className="champions-widget__holder-info">
                        {holders.length > 0 ? (
                          <>
                            <p className="champions-widget__holder-label">
                              {holderLabel}
                            </p>

                            <ul className="champions-widget__holders">
                              {holders.map((holder) => (
                                <li key={holder.id}>{holder.name}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="champions-widget__status">
                            <TitleIcon size={15} aria-hidden="true" />
                            {statusLabel}
                          </p>
                        )}
                      </div>

                      {!isBriefcase && hasReign && title.won_tick !== null && (
                        <dl className="champions-widget__stats">
                          <div>
                            <dt>Reign</dt>

                            <dd>
                              {elapsedWeeks}
                              <span>
                                {elapsedWeeks === 1 ? "week" : "weeks"}
                              </span>
                            </dd>
                          </div>

                          <div>
                            <dt>Defenses</dt>
                            <dd>{title.defenses}</dd>
                          </div>
                        </dl>
                      )}

                      <div className="champions-widget__card-footer">
                        <span>
                          {isBriefcase ? "View briefcase" : "View championship"}
                        </span>

                        <ArrowUpRight size={18} aria-hidden="true" />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {(scrollState.canPrevious || scrollState.canNext) && (
            <div className="champions-widget__controls">
              <button
                type="button"
                aria-label="Previous championships"
                aria-controls={listId}
                disabled={!scrollState.canPrevious}
                onClick={() => scrollTitles(-1)}
              >
                <ChevronLeft size={19} aria-hidden="true" />
              </button>

              <button
                type="button"
                aria-label="Next championships"
                aria-controls={listId}
                disabled={!scrollState.canNext}
                onClick={() => scrollTitles(1)}
              >
                <ChevronRight size={19} aria-hidden="true" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
