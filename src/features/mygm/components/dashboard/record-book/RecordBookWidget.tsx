import { useId, useState } from "react";
import { Trophy, UserRound } from "lucide-react";
import { useRecordBookSummary } from "../../../hooks/record-book/useRecordBookSummary";
import type { RecordBookReign } from "../../../types/record-book/recordBook.types";
import "./RecordBookWidget.scss";
import { Link } from "react-router-dom";

interface RecordBookWidgetProps {
  careerId: string;
}

interface RecordRow {
  id: string;
  rank: number;
  name: string;
  description: string | null;
  metric: string;
  imageUrl: string | null;
  imageKind: "title" | "wrestler";
}

interface RecordCategoryProps {
  title: string;
  description: string;
  emptyMessage: string;
  entries: RecordRow[];
  href: string;
}

interface RecordThumbnailProps {
  src: string | null;
  kind: RecordRow["imageKind"];
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getReignRows(
  reigns: RecordBookReign[],
  metric: "duration" | "defenses",
): RecordRow[] {
  return reigns.map((reign) => ({
    id: reign.reign_id,
    rank: reign.rank,
    name:
      reign.holders.map((holder) => holder.name).join(" & ") ||
      "Holder unavailable",
    description: reign.title.name + (reign.is_active ? " · Ongoing reign" : ""),
    metric:
      metric === "duration"
        ? formatCount(reign.duration_weeks, "week", "weeks")
        : formatCount(reign.defenses, "defense", "defenses"),
    imageUrl: reign.title.image_url,
    imageKind: "title",
  }));
}

function RecordThumbnail({ src, kind }: RecordThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span
      className={`record-book-widget__thumbnail record-book-widget__thumbnail--${kind}`}
      aria-hidden="true"
    >
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
        />
      ) : kind === "title" ? (
        <Trophy size={24} />
      ) : (
        <UserRound size={24} />
      )}
    </span>
  );
}

function RecordCategory({
  title,
  description,
  emptyMessage,
  entries,
  href,
}: RecordCategoryProps) {
  const headingId = useId();

  return (
    <section
      className="record-book-widget__category"
      aria-labelledby={headingId}
    >
      <header className="record-book-widget__category-header">
        <h3 id={headingId}>{title}</h3>
        <p>{description}</p>
      </header>

      {entries.length === 0 ? (
        <p className="record-book-widget__empty">{emptyMessage}</p>
      ) : (
        <ol className="record-book-widget__list">
          {entries.map((entry) => (
            <li className="record-book-widget__row" key={entry.id}>
              <span
                className="record-book-widget__rank"
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </span>

              <RecordThumbnail src={entry.imageUrl} kind={entry.imageKind} />

              <div className="record-book-widget__entry">
                <p className="record-book-widget__name">{entry.name}</p>

                {entry.description && (
                  <p className="record-book-widget__description">
                    {entry.description}
                  </p>
                )}

                <p className="record-book-widget__metric">{entry.metric}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link
        className="record-book-widget__link"
        to={href}
        aria-label={`View full ranking: ${title}`}
      >
        View ranking
      </Link>
    </section>
  );
}

export default function RecordBookWidget({ careerId }: RecordBookWidgetProps) {
  const headingId = useId();

  const recordBookPath = `/mygm/${careerId}/record-book`;

  const { data, isLoading, errorMessage, retry } =
    useRecordBookSummary(careerId);

  const highRatedRows: RecordRow[] =
    data?.high_rated_wrestlers.map(
      (entry): RecordRow => ({
        id: entry.wrestler.id,
        rank: entry.rank,
        name: entry.wrestler.name,
        description: null,
        metric: formatCount(entry.match_count, "match", "matches"),
        imageUrl: entry.wrestler.image_url,
        imageKind: "wrestler",
      }),
    ) ?? [];

  const mainEventRows: RecordRow[] =
    data?.wrestlemania_main_eventers.map(
      (entry): RecordRow => ({
        id: entry.wrestler.id,
        rank: entry.rank,
        name: entry.wrestler.name,
        description: null,
        metric: formatCount(
          entry.appearance_count,
          "appearance",
          "appearances",
        ),
        imageUrl: entry.wrestler.image_url,
        imageKind: "wrestler",
      }),
    ) ?? [];

  return (
    <section className="record-book-widget" aria-labelledby={headingId}>
      <header className="record-book-widget__header">
        <div>
          <h2 id={headingId}>Record Book</h2>
          <p>Highlights from your career history.</p>
        </div>

        <Link className="record-book-widget__link" to={recordBookPath}>
          View record book
        </Link>
      </header>

      <div aria-busy={isLoading}>
        {isLoading && (
          <div className="record-book-widget__state">
            <p role="status">Loading career records…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="record-book-widget__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="record-book-widget__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <div className="record-book-widget__categories">
            <RecordCategory
              title="Longest reigns"
              description="The longest individual championship reigns."
              emptyMessage="No reigns with a completed week yet."
              entries={getReignRows(data.longest_reigns, "duration")}
              href={`${recordBookPath}?section=championships&record=longest_reigns`}
            />

            <RecordCategory
              title="Most successful defenses"
              description="The most successful defenses within one reign."
              emptyMessage="No successful title defenses recorded yet."
              entries={getReignRows(data.most_defenses, "defenses")}
              href={`${recordBookPath}?section=championships&record=most_defenses`}
            />

            <RecordCategory
              title="4.5+ star matches"
              description="Appearances in matches rated 4.5 stars or higher."
              emptyMessage="No matches rated 4.5 stars or higher yet."
              entries={highRatedRows}
              href={`${recordBookPath}?section=matches&record=high_rated_matches`}
            />

            <RecordCategory
              title="WrestleMania main events"
              description="Appearances in the final match of week 50 PLEs."
              emptyMessage="No WrestleMania main event appearances recorded yet."
              entries={mainEventRows}
              href={`${recordBookPath}?section=wrestlemania&record=wrestlemania_main_events`}
            />
          </div>
        )}
      </div>
    </section>
  );
}
