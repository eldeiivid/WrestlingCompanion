import { useId } from "react";
import { Link } from "react-router-dom";
import type {
  RivalryHistory,
  RivalryHistoryItem,
  RivalryHistoryKind,
} from "../../../types/rivalries/rivalries.types";
import "./RivalryRecentHistory.scss";

interface RivalryRecentHistoryProps {
  careerId: string;
  history: RivalryHistory;
  onNavigate?: () => void;
}

const historyKindLabels: Record<RivalryHistoryKind, string> = {
  match: "Match",
  promo: "Promo",
  interference: "Interference",
  level_change: "Level changed",
  resolution: "Rivalry ended",
  note: "Note",
};

function getActivityTitle(item: RivalryHistoryItem): string {
  switch (item.rivalry_action) {
    case "create":
      return "Rivalry started";

    case "increase":
      return "Rivalry level increased";

    case "resolve":
      return "Rivalry ended";

    default:
      return historyKindLabels[item.kind];
  }
}

function getSegmentDescription(item: RivalryHistoryItem): string | null {
  if (!item.segment_kind) {
    return null;
  }

  const label =
    item.segment_label ?? (item.segment_kind === "match" ? "Match" : "Promo");

  const stipulation =
    item.segment_kind === "match" && item.stipulation_name
      ? ` · ${item.stipulation_name}`
      : "";

  const interference = item.kind === "interference" ? "Interference · " : "";

  return `${interference}${label}${stipulation}`;
}

export default function RivalryRecentHistory({
  careerId,
  history,
  onNavigate,
}: RivalryRecentHistoryProps) {
  const headingId = useId();

  return (
    <section className="rivalry-history" aria-labelledby={headingId}>
      <header className="rivalry-history__header">
        <h3 id={headingId}>Recent activity</h3>

        {history.items.length > 0 && (
          <p>
            Showing {history.items.length} of {history.total_count} recorded{" "}
            {history.total_count === 1 ? "event" : "events"}.
          </p>
        )}
      </header>

      {history.items.length === 0 ? (
        <p className="rivalry-history__empty">
          No activity has been recorded yet.
        </p>
      ) : (
        <ol
          className="rivalry-history__list"
          aria-label="Rivalry activity, newest first"
        >
          {history.items.map((item) => {
            const segmentDescription = getSegmentDescription(item);

            const winnerNames = item.match_winners
              .map((winner) => winner.name)
              .join(" & ");

            const hasResult =
              item.match_winners.length > 0 ||
              item.match_rating !== null ||
              item.promo_rating !== null;

            const canOpenShow =
              item.event_id !== null && item.event_status === "completed";

            return (
              <li className="rivalry-history__item" key={item.id}>
                <header className="rivalry-history__item-header">
                  <p className="rivalry-history__period">
                    Season {item.season} · Week {item.week}
                    {item.segment_position !== null
                      ? ` · Segment ${item.segment_position}`
                      : ""}
                  </p>

                  <h4>{getActivityTitle(item)}</h4>
                </header>

                {segmentDescription && (
                  <p className="rivalry-history__context">
                    {segmentDescription}
                  </p>
                )}

                {item.new_level !== null && (
                  <p className="rivalry-history__level">
                    Recorded level: {item.new_level} / 4
                  </p>
                )}

                {hasResult && (
                  <dl className="rivalry-history__results">
                    {item.match_winners.length > 0 && (
                      <div>
                        <dt>
                          {item.match_winners.length === 1
                            ? "Match winner"
                            : "Match winners"}
                        </dt>

                        <dd>{winnerNames}</dd>
                      </div>
                    )}

                    {item.match_rating !== null && (
                      <div>
                        <dt>Match rating</dt>
                        <dd>{item.match_rating} / 5 stars</dd>
                      </div>
                    )}

                    {item.promo_rating && (
                      <div>
                        <dt>Promo rating</dt>
                        <dd>{item.promo_rating.name}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {item.kind === "note" && item.notes?.trim() && (
                  <p className="rivalry-history__note">{item.notes}</p>
                )}

                {canOpenShow && (
                  <Link
                    className="rivalry-history__link"
                    to={`/mygm/${careerId}/history/${item.event_id}`}
                    onClick={onNavigate}
                    aria-label={`View show from season ${item.season}, week ${item.week}`}
                  >
                    View show
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
