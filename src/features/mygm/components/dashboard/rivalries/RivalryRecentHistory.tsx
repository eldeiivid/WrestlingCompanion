import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  Mic,
  Star,
  Swords,
  UserRound,
} from "lucide-react";

import type {
  RivalryHistory,
  RivalryHistoryItem,
  RivalryHistoryKind,
  RivalryWrestler,
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
      return "Level increased";

    case "resolve":
      return "Rivalry ended";

    default:
      return historyKindLabels[item.kind];
  }
}

function getChangeLabel(item: RivalryHistoryItem): string {
  switch (item.rivalry_action) {
    case "create":
      return "Started";

    case "increase":
      return "Level increased";

    case "resolve":
      return "Resolved";

    default:
      return item.kind === "resolution" ? "Resolved" : "Level";
  }
}

function getSegmentDescription(item: RivalryHistoryItem): string | null {
  if (!item.segment_kind) return null;

  const label =
    item.segment_label ?? (item.segment_kind === "match" ? "Match" : "Promo");

  const stipulation =
    item.segment_kind === "match" && item.stipulation_name
      ? ` · ${item.stipulation_name}`
      : "";

  const interference = item.kind === "interference" ? "Interference · " : "";

  return `${interference}${label}${stipulation}`;
}

function WinnerPortrait({ wrestler }: { wrestler: RivalryWrestler }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage =
    wrestler.image_url !== null && wrestler.image_url !== failedUrl;

  return (
    <span className="rivalry-history__portrait">
      {showImage && wrestler.image_url ? (
        <img
          src={wrestler.image_url}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(wrestler.image_url)}
        />
      ) : (
        <UserRound size={23} />
      )}
    </span>
  );
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
          <span
            className="rivalry-history__count"
            aria-label={`Showing ${history.items.length} of ${history.total_count} recorded events`}
          >
            {history.items.length === history.total_count
              ? `${history.total_count} ${
                  history.total_count === 1 ? "event" : "events"
                }`
              : `${history.items.length} of ${history.total_count}`}
          </span>
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
            const isMatch =
              item.segment_kind === "match" || item.kind === "match";

            const isPromo =
              item.segment_kind === "promo" || item.kind === "promo";

            const hasWinners = isMatch && item.match_winners.length > 0;

            const winnerNames = item.match_winners
              .map((winner) => winner.name)
              .join(" & ");

            const segmentDescription = getSegmentDescription(item);

            const isRivalryChange =
              item.rivalry_action === "create" ||
              item.rivalry_action === "increase" ||
              item.rivalry_action === "resolve" ||
              item.kind === "level_change" ||
              item.kind === "resolution";

            const showChange =
              item.new_level !== null || (hasWinners && isRivalryChange);

            const showPromoRating = isPromo && item.promo_rating !== null;

            const canOpenShow =
              item.event_id !== null && item.event_status === "completed";

            const ActivityIcon =
              item.kind === "note" ? FileText : isPromo ? Mic : Swords;

            return (
              <li className="rivalry-history__item" key={item.id}>
                <div className="rivalry-history__row">
                  {hasWinners ? (
                    <div
                      className={[
                        "rivalry-history__winner-images",
                        item.match_winners.length === 1
                          ? "rivalry-history__winner-images--single"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-hidden="true"
                    >
                      {item.match_winners.slice(0, 2).map((winner) => (
                        <WinnerPortrait
                          key={winner.wrestler_id}
                          wrestler={winner}
                        />
                      ))}

                      {item.match_winners.length > 2 && (
                        <span className="rivalry-history__extra">
                          +{item.match_winners.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className="rivalry-history__activity-icon"
                      aria-hidden="true"
                    >
                      <ActivityIcon size={22} />
                    </span>
                  )}

                  <div className="rivalry-history__copy">
                    <p className="rivalry-history__period">
                      S{item.season} · Week {item.week}
                      {item.segment_position !== null
                        ? ` · Segment ${item.segment_position}`
                        : ""}
                    </p>

                    <div className="rivalry-history__headline">
                      <h4>
                        {hasWinners ? winnerNames : getActivityTitle(item)}
                      </h4>

                      {isMatch && item.match_rating !== null && (
                        <span
                          className="rivalry-history__rating"
                          aria-label={`Match rating: ${item.match_rating} out of 5 stars`}
                        >
                          <Star
                            size={14}
                            fill="currentColor"
                            aria-hidden="true"
                          />

                          <strong>{item.match_rating}</strong>
                          <span>/ 5</span>
                        </span>
                      )}
                    </div>

                    {(hasWinners || segmentDescription) && (
                      <p className="rivalry-history__context">
                        {hasWinners && (
                          <span>
                            {item.match_winners.length === 1
                              ? "Winner"
                              : "Winners"}
                            {segmentDescription ? " · " : ""}
                          </span>
                        )}

                        {segmentDescription}
                      </p>
                    )}

                    {item.kind === "note" && item.notes?.trim() && (
                      <p className="rivalry-history__note">{item.notes}</p>
                    )}

                    {(showChange || showPromoRating || canOpenShow) && (
                      <div className="rivalry-history__meta">
                        {showChange && (
                          <span className="rivalry-history__change">
                            {hasWinners && isRivalryChange
                              ? getChangeLabel(item)
                              : "Level"}

                            {item.new_level !== null && (
                              <> {item.new_level} / 4</>
                            )}
                          </span>
                        )}

                        {showPromoRating && item.promo_rating && (
                          <span className="rivalry-history__promo-rating">
                            <Mic size={12} aria-hidden="true" />
                            {item.promo_rating.name}
                          </span>
                        )}

                        {canOpenShow && (
                          <Link
                            className="rivalry-history__link"
                            to={`/mygm/${careerId}/history/${item.event_id}`}
                            onClick={onNavigate}
                            aria-label={`View show from season ${item.season}, week ${item.week}`}
                            title="View show"
                          >
                            <ArrowUpRight size={18} aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
