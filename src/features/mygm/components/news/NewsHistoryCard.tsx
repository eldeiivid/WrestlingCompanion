import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Swords, Trophy, UserRound } from "lucide-react";

import { getNewsPresentation } from "../dashboard/news/newsPresentation";

import type { MyGmNewsItem } from "../../types/news/news.types";

import "./NewsHistoryCard.scss";

interface NewsHistoryCardProps {
  careerId: string;
  item: MyGmNewsItem;
  onViewRivalry: (feudId: string) => void;
}

function Thumbnail({
  src,
  kind,
}: {
  src: string | null;
  kind: "title" | "person";
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`news-history-card__thumbnail news-history-card__thumbnail--${kind}`}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : kind === "title" ? (
        <Trophy size={48} strokeWidth={1.25} />
      ) : (
        <UserRound size={64} strokeWidth={1.25} />
      )}
    </span>
  );
}

export default function NewsHistoryCard({
  careerId,
  item,
  onViewRivalry,
}: NewsHistoryCardProps) {
  const headingId = useId();
  const presentation = getNewsPresentation(item);

  const isRivalry =
    item.event_type === "rivalry_started" ||
    item.event_type === "rivalry_ended";

  const feudId =
    item.event_type === "rivalry_started" || item.event_type === "rivalry_ended"
      ? item.data.feud_id
      : null;

  const visiblePeople = presentation.people.slice(0, 4);
  const remainingPeople = presentation.people.length - visiblePeople.length;

  return (
    <article className="news-history-card" aria-labelledby={headingId}>
      <div className="news-history-card__visual">
        {visiblePeople.length > 0 ? (
          <div
            className={`news-history-card__portraits${
              visiblePeople.length === 1
                ? " news-history-card__portraits--solo"
                : ""
            }`}
            style={{
              gridTemplateColumns: `repeat(${visiblePeople.length}, minmax(0, 1fr))`,
            }}
            aria-hidden="true"
          >
            {visiblePeople.map((person) => (
              <Thumbnail
                key={`portrait:${person.id}:${person.image_url}`}
                src={person.image_url}
                kind="person"
              />
            ))}
          </div>
        ) : (
          <div
            className="news-history-card__visual-fallback"
            aria-hidden="true"
          >
            {isRivalry ? (
              <Swords size={80} strokeWidth={1} />
            ) : (
              <Trophy size={80} strokeWidth={1} />
            )}
          </div>
        )}

        {remainingPeople > 0 && (
          <span className="news-history-card__more" aria-hidden="true">
            +{remainingPeople}
          </span>
        )}

        {presentation.championship && (
          <Link
            className="news-history-card__championship"
            to={`/mygm/${careerId}/titles/${presentation.championship.id}`}
            aria-label={`View championship: ${presentation.championship.name}`}
          >
            <Thumbnail
              key={`title:${presentation.championship.id}:${presentation.championship.image_url}`}
              src={presentation.championship.image_url}
              kind="title"
            />

            <span>{presentation.championship.name}</span>
          </Link>
        )}
      </div>

      <div className="news-history-card__content">
        <header className="news-history-card__header">
          <span className="news-history-card__category">
            {isRivalry ? (
              <Swords size={14} aria-hidden="true" />
            ) : (
              <Trophy size={14} aria-hidden="true" />
            )}

            {presentation.category}
          </span>

          <p className="news-history-card__period">
            {presentation.periodLabel}
          </p>
        </header>

        <h2 id={headingId}>{presentation.title}</h2>

        <p className="news-history-card__description">
          {presentation.description}
        </p>

        {presentation.people.length > 0 && (
          <ul
            className="news-history-card__people"
            aria-label="Featured wrestlers"
          >
            {presentation.people.map((person) => (
              <li key={person.id}>
                <Link to={`/mygm/${careerId}/roster/${person.id}`}>
                  {person.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {(presentation.eventId || feudId) && (
          <footer className="news-history-card__actions">
            {presentation.eventId && (
              <Link
                className="news-history-card__button"
                to={`/mygm/${careerId}/history/${presentation.eventId}`}
              >
                View show
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            )}

            {feudId && (
              <button
                className="news-history-card__button news-history-card__button--rivalry"
                type="button"
                aria-haspopup="dialog"
                onClick={() => onViewRivalry(feudId)}
              >
                View rivalry
                <Swords size={16} aria-hidden="true" />
              </button>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}
