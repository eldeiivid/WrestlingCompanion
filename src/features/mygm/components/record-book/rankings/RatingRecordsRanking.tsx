import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, Crown, Star, Swords } from "lucide-react";

import RecordRanking from "./RecordRanking";
import { useRatingRecords } from "../../../hooks/record-book/useRecordBookRankings";

import type {
  RatingRecordKind,
  RecordBookMatchParticipant,
} from "../../../types/record-book/recordBookPage.types";

import "./RatingRecordsRanking.scss";

interface RatingRecordsRankingProps {
  careerId: string;
  record: RatingRecordKind;
}

const recordPresentation: Record<
  RatingRecordKind,
  {
    title: string;
    description: string;
    emptyMessage: string;
  }
> = {
  best_shows: {
    title: "Highest-rated shows",
    description: "Completed shows ranked by their average match rating.",
    emptyMessage: "No completed shows with a rating have been recorded yet.",
  },

  best_matches: {
    title: "Highest-rated matches",
    description: "Individual matches ranked by their recorded star rating.",
    emptyMessage: "No completed matches with a rating have been recorded yet.",
  },
};

const eventKindLabels = {
  weekly: "Weekly show",
  ple: "PLE",
  special: "Special show",
};

function getMatchLabel(participants: RecordBookMatchParticipant[]): string {
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

export default function RatingRecordsRanking({
  careerId,
  record,
}: RatingRecordsRankingProps) {
  const presentation = recordPresentation[record];

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useRatingRecords(careerId, record);

  return (
    <RecordRanking
      title={presentation.title}
      description={presentation.description}
      emptyMessage={presentation.emptyMessage}
      isLoading={isLoading}
      errorMessage={errorMessage}
      page={page}
      totalPages={data?.total_pages ?? 0}
      totalCount={data?.total_count ?? 0}
      onRetry={retry}
      onPageChange={goToPage}
    >
      {data?.items.map((item) => (
        <li
          className={`rating-records-ranking__row${
            item.rank === 1 ? " rating-records-ranking__row--leader" : ""
          }`}
          key={`${item.kind}:${item.id}`}
        >
          <span
            className="rating-records-ranking__position"
            aria-label={`Rank ${item.rank}`}
          >
            {item.rank === 1 && <Crown size={15} aria-hidden="true" />}
            <span>#{item.rank}</span>
          </span>

          <span className="rating-records-ranking__icon" aria-hidden="true">
            {item.kind === "show" ? (
              <CalendarDays size={28} />
            ) : (
              <Swords size={28} />
            )}
          </span>

          <div className="rating-records-ranking__content">
            <p className="rating-records-ranking__period">
              Season {item.event.season}
              {" · "}
              Week {item.event.week}
              {" · "}
              {eventKindLabels[item.event.kind]}
            </p>

            <h3>
              {item.kind === "show"
                ? item.event.name
                : getMatchLabel(item.match.participants)}
            </h3>

            {item.kind === "match" && (
              <>
                <p className="rating-records-ranking__match-type">
                  {item.match.format_name}

                  {item.match.stipulation_name &&
                    ` · ${item.match.stipulation_name}`}
                </p>

                <p className="rating-records-ranking__event">
                  {item.event.name}
                  {" · "}
                  Segment {item.match.position}
                </p>
              </>
            )}

            <Link
              className="rating-records-ranking__show-link"
              to={`/mygm/${careerId}/history/${item.event.id}`}
            >
              View show results
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <p className="rating-records-ranking__value">
            <span className="rating-records-ranking__score">
              <Star size={20} aria-hidden="true" />

              <strong>
                {item.record_value.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </strong>
            </span>

            <span>{item.record_value === 1 ? "star" : "stars"}</span>
          </p>
        </li>
      ))}
    </RecordRanking>
  );
}
