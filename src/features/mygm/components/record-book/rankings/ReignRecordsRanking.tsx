import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Trophy, UserRound } from "lucide-react";

import RecordRanking from "./RecordRanking";
import { useReignRecords } from "../../../hooks/record-book/useRecordBookRankings";

import type { ReignRecordKind } from "../../../types/record-book/recordBookPage.types";

import "./ReignRecordsRanking.scss";

interface ReignRecordsRankingProps {
  careerId: string;
  record: ReignRecordKind;
}

const recordPresentation: Record<
  ReignRecordKind,
  {
    title: string;
    description: string;
    emptyMessage: string;
  }
> = {
  longest_reigns: {
    title: "Longest reigns",
    description:
      "The longest championship reigns, including current reigns. Briefcases are excluded.",
    emptyMessage: "No championship reigns have reached one elapsed week yet.",
  },
  most_defenses: {
    title: "Most successful defenses",
    description:
      "Individual reigns with the most successful defenses in completed shows.",
    emptyMessage: "No successful championship defenses have been recorded yet.",
  },
};

function Thumbnail({
  src,
  kind,
}: {
  src: string | null;
  kind: "title" | "holder";
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`reign-records-ranking__thumbnail reign-records-ranking__thumbnail--${kind}`}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : kind === "title" ? (
        <Trophy size={44} strokeWidth={1.25} />
      ) : (
        <UserRound size={26} strokeWidth={1.5} />
      )}
    </span>
  );
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function ReignRecordsRanking({
  careerId,
  record,
}: ReignRecordsRankingProps) {
  const presentation = recordPresentation[record];
  const isDurationRecord = record === "longest_reigns";

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useReignRecords(careerId, record);

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
          className={`reign-records-ranking__row${
            item.rank === 1 ? " reign-records-ranking__row--leader" : ""
          }`}
          key={item.reign_id}
        >
          <div className="reign-records-ranking__visual">
            <span
              className="reign-records-ranking__position"
              aria-label={`Rank ${item.rank}`}
            >
              {item.rank === 1 && <Crown size={15} aria-hidden="true" />}

              <span>#{item.rank}</span>
            </span>

            <Thumbnail
              key={`title:${item.title.id}:${item.title.image_url}`}
              src={item.title.image_url}
              kind="title"
            />
          </div>

          <div className="reign-records-ranking__content">
            <div className="reign-records-ranking__heading">
              <h3>
                <Link to={`/mygm/${careerId}/titles/${item.title.id}`}>
                  {item.title.name}
                </Link>
              </h3>

              {item.is_current && (
                <span className="reign-records-ranking__current">
                  <span aria-hidden="true" />
                  Current reign
                </span>
              )}
            </div>

            {item.holders.length > 0 ? (
              <ul className="reign-records-ranking__holders">
                {item.holders.map((holder) => (
                  <li key={holder.id}>
                    <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                      <Thumbnail
                        key={`holder:${holder.id}:${holder.image_url}`}
                        src={holder.image_url}
                        kind="holder"
                      />

                      <span>{holder.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="reign-records-ranking__message">
                Holder information is unavailable.
              </p>
            )}

            <dl className="reign-records-ranking__period">
              <div>
                <dt>Started</dt>
                <dd>{formatPeriod(item.won_tick)}</dd>
              </div>

              <div>
                <dt>Ended</dt>
                <dd>
                  {item.lost_tick === null
                    ? "Ongoing"
                    : formatPeriod(item.lost_tick)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="reign-records-ranking__result">
            <p className="reign-records-ranking__value">
              <strong>{item.record_value.toLocaleString("en-US")}</strong>

              <span>
                {isDurationRecord
                  ? item.record_value === 1
                    ? "week"
                    : "weeks"
                  : item.record_value === 1
                    ? "defense"
                    : "defenses"}
              </span>
            </p>

            <p className="reign-records-ranking__secondary">
              {isDurationRecord
                ? `${item.defenses.toLocaleString("en-US")} successful ${
                    item.defenses === 1 ? "defense" : "defenses"
                  }`
                : `${item.duration_weeks.toLocaleString("en-US")} ${
                    item.duration_weeks === 1 ? "week" : "weeks"
                  }`}
            </p>
          </div>
        </li>
      ))}
    </RecordRanking>
  );
}
