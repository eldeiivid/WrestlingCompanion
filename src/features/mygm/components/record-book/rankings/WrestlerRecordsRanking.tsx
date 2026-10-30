import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";

import RecordRanking from "./RecordRanking";
import { useWrestlerRecords } from "../../../hooks/record-book/useRecordBookRankings";

import type { WrestlerRecordKind } from "../../../types/record-book/recordBookPage.types";

import "./WrestlerRecordsRanking.scss";

interface WrestlerRecordsRankingProps {
  careerId: string;
  record: WrestlerRecordKind;
}

interface RecordPresentation {
  title: string;
  description: string;
  emptyMessage: string;
  singular: string;
  plural: string;
}

const recordPresentation: Record<WrestlerRecordKind, RecordPresentation> = {
  most_reigns: {
    title: "Most championship reigns",
    description:
      "Individual championship reigns, including initial champions and shared titles. Briefcases are excluded.",
    emptyMessage: "No championship holders have been recorded yet.",
    singular: "reign",
    plural: "reigns",
  },

  most_wins: {
    title: "Most wins",
    description:
      "Wins in completed shows. Each member of a winning team receives one win.",
    emptyMessage: "No match wins have been recorded yet.",
    singular: "win",
    plural: "wins",
  },

  most_matches: {
    title: "Most match appearances",
    description:
      "Match appearances in completed shows, regardless of the result.",
    emptyMessage: "No completed match appearances have been recorded yet.",
    singular: "match",
    plural: "matches",
  },

  high_rated_matches: {
    title: "Most 4.5+ star matches",
    description:
      "Appearances in completed matches rated at least 4.5 stars. Both winners and losers count.",
    emptyMessage: "No matches rated at least 4.5 stars have been recorded yet.",
    singular: "match",
    plural: "matches",
  },

  wrestlemania_main_events: {
    title: "Most WrestleMania main events",
    description:
      "Appearances in the final match of the season-ending PLE in Week 50.",
    emptyMessage:
      "No WrestleMania main-event appearances have been recorded yet.",
    singular: "appearance",
    plural: "appearances",
  },
};

function WrestlerPortrait({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="wrestler-records-ranking__portrait" aria-hidden="true">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <UserRound size={40} />
      )}
    </span>
  );
}

export default function WrestlerRecordsRanking({
  careerId,
  record,
}: WrestlerRecordsRankingProps) {
  const presentation = recordPresentation[record];

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useWrestlerRecords(careerId, record);

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
        <li className="wrestler-records-ranking__row" key={item.wrestler.id}>
          <span
            className="wrestler-records-ranking__position"
            aria-label={`Rank ${item.rank}`}
          >
            #{item.rank}
          </span>

          <WrestlerPortrait
            key={`portrait:${item.wrestler.id}:${item.wrestler.image_url}`}
            src={item.wrestler.image_url}
          />

          <div className="wrestler-records-ranking__content">
            <h3>
              <Link to={`/mygm/${careerId}/roster/${item.wrestler.id}`}>
                {item.wrestler.name}
              </Link>
            </h3>

            <p>All-time career record</p>
          </div>

          <p className="wrestler-records-ranking__value">
            <strong>{item.record_value.toLocaleString("en-US")}</strong>

            <span>
              {item.record_value === 1
                ? presentation.singular
                : presentation.plural}
            </span>
          </p>
        </li>
      ))}
    </RecordRanking>
  );
}
