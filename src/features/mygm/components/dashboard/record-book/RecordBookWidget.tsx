import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Flag,
  LoaderCircle,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useRecordBookSummary } from "../../../hooks/record-book/useRecordBookSummary";

import type { RecordBookReign } from "../../../types/record-book/recordBook.types";

import "./RecordBookWidget.scss";

interface RecordBookWidgetProps {
  careerId: string;
}

type RecordCategoryId =
  | "longest_reigns"
  | "most_defenses"
  | "high_rated_matches"
  | "wrestlemania_main_events";

interface RecordRow {
  id: string;
  rank: number;
  name: string;
  description: string | null;
  metric: string;
  imageUrl: string | null;
  imageKind: "title" | "wrestler";
}

interface RecordCategory {
  id: RecordCategoryId;
  tabLabel: string;
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
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
      className={[
        "record-book-widget__thumbnail",
        `record-book-widget__thumbnail--${kind}`,
      ].join(" ")}
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
        <Trophy size={25} />
      ) : (
        <UserRound size={25} />
      )}
    </span>
  );
}

export default function RecordBookWidget({ careerId }: RecordBookWidgetProps) {
  const headingId = useId();
  const tabsId = useId();

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [activeCategory, setActiveCategory] =
    useState<RecordCategoryId>("longest_reigns");

  const { data, isLoading, errorMessage, retry } =
    useRecordBookSummary(careerId);

  const recordBookPath = `/mygm/${careerId}/record-book`;

  const highRatedRows: RecordRow[] =
    data?.high_rated_wrestlers.map((entry) => ({
      id: entry.wrestler.id,
      rank: entry.rank,
      name: entry.wrestler.name,
      description: null,
      metric: formatCount(entry.match_count, "match", "matches"),
      imageUrl: entry.wrestler.image_url,
      imageKind: "wrestler",
    })) ?? [];

  const mainEventRows: RecordRow[] =
    data?.wrestlemania_main_eventers.map((entry) => ({
      id: entry.wrestler.id,
      rank: entry.rank,
      name: entry.wrestler.name,
      description: null,
      metric: formatCount(entry.appearance_count, "appearance", "appearances"),
      imageUrl: entry.wrestler.image_url,
      imageKind: "wrestler",
    })) ?? [];

  const categories: RecordCategory[] = [
    {
      id: "longest_reigns",
      tabLabel: "Reigns",
      title: "Longest reigns",
      description: "The longest individual championship reigns.",
      emptyMessage: "No reigns with a completed week yet.",
      icon: Trophy,
      entries: data ? getReignRows(data.longest_reigns, "duration") : [],
      href:
        `${recordBookPath}` + "?section=championships&record=longest_reigns",
    },
    {
      id: "most_defenses",
      tabLabel: "Defenses",
      title: "Most successful defenses",
      description: "Successful title defenses within one reign.",
      emptyMessage: "No successful title defenses recorded yet.",
      icon: ShieldCheck,
      entries: data ? getReignRows(data.most_defenses, "defenses") : [],
      href: `${recordBookPath}` + "?section=championships&record=most_defenses",
    },
    {
      id: "high_rated_matches",
      tabLabel: "4.5+ stars",
      title: "4.5+ star matches",
      description: "Appearances in matches rated 4.5 stars or higher.",
      emptyMessage: "No matches rated 4.5 stars or higher yet.",
      icon: Star,
      entries: highRatedRows,
      href: `${recordBookPath}` + "?section=matches&record=high_rated_matches",
    },
    {
      id: "wrestlemania_main_events",
      tabLabel: "WM events",
      title: "WrestleMania main events",
      description: "Appearances in the final match of week 50 PLEs.",
      emptyMessage: "No WrestleMania main event appearances recorded yet.",
      icon: Flag,
      entries: mainEventRows,
      href:
        `${recordBookPath}` +
        "?section=wrestlemania&record=wrestlemania_main_events",
    },
  ];

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    let nextIndex: number;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (index + 1) % categories.length;
        break;

      case "ArrowLeft":
        nextIndex = (index - 1 + categories.length) % categories.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = categories.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    setActiveCategory(categories[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="record-book-widget" aria-labelledby={headingId}>
      <header className="record-book-widget__header">
        <h2 id={headingId}>Record Book</h2>

        <Link to={recordBookPath}>
          View record book
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div aria-busy={isLoading}>
        {isLoading && (
          <div className="record-book-widget__state">
            <LoaderCircle
              className="record-book-widget__spinner"
              size={24}
              aria-hidden="true"
            />

            <p role="status">Loading career records…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="record-book-widget__state">
            <p className="record-book-widget__error" role="alert">
              {errorMessage}
            </p>

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
          <div className="record-book-widget__frame">
            <div
              className="record-book-widget__tabs"
              role="tablist"
              aria-label="Career record categories"
            >
              {categories.map((category, index) => (
                <button
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  key={category.id}
                  id={`${tabsId}-tab-${category.id}`}
                  className="record-book-widget__tab"
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  aria-controls={`${tabsId}-panel-${category.id}`}
                  tabIndex={activeCategory === category.id ? 0 : -1}
                  title={category.title}
                  onClick={() => setActiveCategory(category.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {category.tabLabel}
                </button>
              ))}
            </div>

            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <div
                  className="record-book-widget__panel"
                  key={category.id}
                  id={`${tabsId}-panel-${category.id}`}
                  role="tabpanel"
                  aria-labelledby={`${tabsId}-tab-${category.id}`}
                  hidden={activeCategory !== category.id}
                  tabIndex={0}
                >
                  <header className="record-book-widget__category-header">
                    <span
                      className="record-book-widget__category-icon"
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </span>

                    <div>
                      <h3>{category.title}</h3>
                      <p>{category.description}</p>
                    </div>
                  </header>

                  {category.entries.length === 0 ? (
                    <div className="record-book-widget__empty">
                      <p>{category.emptyMessage}</p>
                    </div>
                  ) : (
                    <ol className="record-book-widget__list">
                      {category.entries.map((entry) => (
                        <li
                          className={[
                            "record-book-widget__row",
                            entry.rank === 1 ? "is-leader" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={entry.id}
                          value={entry.rank}
                        >
                          <span
                            className="record-book-widget__rank"
                            aria-label={`Rank ${entry.rank}`}
                          >
                            {entry.rank}
                          </span>

                          <RecordThumbnail
                            src={entry.imageUrl}
                            kind={entry.imageKind}
                          />

                          <div className="record-book-widget__entry">
                            <p className="record-book-widget__name">
                              {entry.name}
                            </p>

                            {entry.description && (
                              <p className="record-book-widget__description">
                                {entry.description}
                              </p>
                            )}
                          </div>

                          <p className="record-book-widget__metric">
                            {entry.metric}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}

                  <footer className="record-book-widget__footer">
                    <Link
                      to={category.href}
                      aria-label={`View full ranking: ${category.title}`}
                    >
                      View full ranking
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  </footer>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
