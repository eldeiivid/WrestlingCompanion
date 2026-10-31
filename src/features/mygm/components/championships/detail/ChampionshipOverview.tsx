import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Trophy, UserRound } from "lucide-react";

import type {
  ChampionshipCategory,
  ChampionshipDivision,
  ChampionshipGender,
} from "../../../types/championships/championships.types";
import type { ChampionshipDetailData } from "../../../types/championships/championshipDetail.types";

import "./ChampionshipOverview.scss";

interface ChampionshipOverviewProps {
  data: ChampionshipDetailData;
}

const categoryLabels: Record<ChampionshipCategory, string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag Team",
  mitb: "Money in the Bank",
  other: "Championship",
};

const genderLabels: Record<ChampionshipGender, string> = {
  male: "Men",
  female: "Women",
  mixed: "Mixed",
  open: "Open",
};

const divisionLabels: Record<ChampionshipDivision, string> = {
  singles: "Singles",
  tag_team: "Tag Team",
};

function AssetImage({
  src,
  kind,
}: {
  src: string | null;
  kind: "title" | "holder" | "briefcase";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img
        src={src}
        alt=""
        decoding="async"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  if (kind === "holder") {
    return <UserRound size={80} strokeWidth={1.1} />;
  }

  return kind === "briefcase" ? (
    <Briefcase size={64} strokeWidth={1.1} />
  ) : (
    <Trophy size={64} strokeWidth={1.1} />
  );
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function ChampionshipOverview({
  data,
}: ChampionshipOverviewProps) {
  const headingId = useId();

  const {
    career_id: careerId,
    championship,
    current_reign: reign,
    history_summary: summary,
  } = data;

  const isBriefcase = championship.category === "mitb";
  const visibleHolders = reign?.holders.slice(0, 2) ?? [];

  const additionalHolderCount = reign
    ? Math.max(0, reign.holders.length - visibleHolders.length)
    : 0;

  const statusLabel = reign
    ? isBriefcase
      ? "Claimed"
      : "Held"
    : isBriefcase
      ? "Unclaimed"
      : "Vacant";

  const holderCount = reign?.holders.length ?? 0;

  const holderLabel = isBriefcase
    ? holderCount > 1
      ? "Current holders"
      : "Current holder"
    : holderCount > 1
      ? "Current champions"
      : "Current champion";

  return (
    <section className="championship-overview" aria-labelledby={headingId}>
      <div className="championship-overview__hero">
        <div className="championship-overview__visual" aria-hidden="true">
          <div className="championship-overview__belt">
            <AssetImage
              src={championship.image_url}
              kind={isBriefcase ? "briefcase" : "title"}
            />
          </div>

          {visibleHolders.length > 0 ? (
            <div className="championship-overview__portraits">
              {visibleHolders.map((holder) => (
                <span
                  className="championship-overview__portrait"
                  key={holder.id}
                >
                  <AssetImage src={holder.image_url} kind="holder" />
                </span>
              ))}

              {additionalHolderCount > 0 && (
                <span className="championship-overview__more">
                  +{additionalHolderCount}
                </span>
              )}
            </div>
          ) : (
            <div className="championship-overview__placeholder">
              {reign ? (
                <UserRound size={100} strokeWidth={1} />
              ) : isBriefcase ? (
                <Briefcase size={100} strokeWidth={1} />
              ) : (
                <Trophy size={100} strokeWidth={1} />
              )}
            </div>
          )}
        </div>

        <div className="championship-overview__identity">
          <header className="championship-overview__header">
            <p className="championship-overview__category">
              {categoryLabels[championship.category]}
            </p>

            <h2 id={headingId}>{championship.name}</h2>

            <div className="championship-overview__meta">
              <span>
                {genderLabels[championship.gender]}
                {!isBriefcase && (
                  <>
                    {" · "}
                    {divisionLabels[championship.division]}
                  </>
                )}
              </span>

              <span
                className={`championship-overview__status${
                  reign ? " championship-overview__status--held" : ""
                }`}
              >
                {statusLabel}
              </span>

              {!championship.is_active && (
                <span className="championship-overview__inactive">
                  Inactive title
                </span>
              )}
            </div>
          </header>

          <section
            className="championship-overview__current"
            aria-label={holderLabel}
          >
            <h3>{holderLabel}</h3>

            {reign ? (
              <>
                {reign.holders.length > 0 ? (
                  <ul className="championship-overview__holders">
                    {reign.holders.map((holder) => (
                      <li key={holder.id}>
                        <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                          {holder.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="championship-overview__message">
                    Holder information is unavailable.
                  </p>
                )}

                <p className="championship-overview__since">
                  Held since {formatPeriod(reign.won_tick)}
                </p>

                {reign.won_match ? (
                  <Link
                    className="championship-overview__show-link"
                    to={`/mygm/${careerId}/history/${reign.won_match.event_id}`}
                  >
                    <span>View show: {reign.won_match.event_name}</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <p className="championship-overview__hint">
                    No acquisition match is recorded for this reign.
                  </p>
                )}
              </>
            ) : (
              <p className="championship-overview__message">
                {isBriefcase
                  ? "This briefcase currently has no holder."
                  : "This championship is currently vacant."}
              </p>
            )}
          </section>

          {reign && !isBriefcase && (
            <dl
              className="championship-overview__reign-stats"
              aria-label="Current reign statistics"
            >
              <div>
                <dt>Current reign length</dt>
                <dd>
                  <strong>{reign.duration_weeks}</strong>
                  <span>{reign.duration_weeks === 1 ? "week" : "weeks"}</span>
                </dd>
              </div>

              <div>
                <dt>Successful defenses</dt>
                <dd>
                  <strong>{reign.defenses}</strong>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <dl
        className="championship-overview__history-stats"
        aria-label="Championship history statistics"
      >
        <div>
          <dt>{isBriefcase ? "Holder periods" : "Total reigns"}</dt>
          <dd>{summary.reign_count}</dd>
        </div>

        <div>
          <dt>
            {isBriefcase ? "Completed holder periods" : "Completed reigns"}
          </dt>
          <dd>{summary.completed_reign_count}</dd>
        </div>

        {!isBriefcase && (
          <div>
            <dt>All-time successful defenses</dt>
            <dd>{summary.defense_count}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
