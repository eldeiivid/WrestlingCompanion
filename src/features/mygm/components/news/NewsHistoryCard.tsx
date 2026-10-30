import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, UserRound } from "lucide-react";

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
        <Trophy size={40} />
      ) : (
        <UserRound size={24} />
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

  const feudId =
    item.event_type === "rivalry_started" || item.event_type === "rivalry_ended"
      ? item.data.feud_id
      : null;

  return (
    <article className="news-history-card" aria-labelledby={headingId}>
      <header className="news-history-card__header">
        <span className="news-history-card__category">
          {presentation.category}
        </span>

        <p className="news-history-card__period">{presentation.periodLabel}</p>
      </header>

      <h2 id={headingId}>{presentation.title}</h2>

      <p className="news-history-card__description">
        {presentation.description}
      </p>

      {presentation.championship && (
        <Link
          className="news-history-card__championship"
          to={`/mygm/${careerId}/titles/${presentation.championship.id}`}
        >
          <Thumbnail
            key={`title:${presentation.championship.id}:${presentation.championship.image_url}`}
            src={presentation.championship.image_url}
            kind="title"
          />

          <span>{presentation.championship.name}</span>
        </Link>
      )}

      {presentation.people.length > 0 && (
        <ul
          className="news-history-card__people"
          aria-label="Featured wrestlers"
        >
          {presentation.people.map((person) => (
            <li key={person.id}>
              <Thumbnail
                key={`person:${person.id}:${person.image_url}`}
                src={person.image_url}
                kind="person"
              />

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
            </Link>
          )}

          {feudId && (
            <button
              className="news-history-card__button"
              type="button"
              onClick={() => onViewRivalry(feudId)}
            >
              View rivalry
            </button>
          )}
        </footer>
      )}
    </article>
  );
}
