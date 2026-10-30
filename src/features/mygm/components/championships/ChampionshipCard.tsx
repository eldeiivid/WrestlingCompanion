import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, UserRound } from "lucide-react";

import type {
  ChampionshipCategory,
  ChampionshipDivision,
  ChampionshipGender,
  ChampionshipListItem,
} from "../../types/championships/championships.types";

import "./ChampionshipCard.scss";

interface ChampionshipCardProps {
  careerId: string;
  championship: ChampionshipListItem;
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
      className={`championship-card__thumbnail championship-card__thumbnail--${kind}`}
      aria-hidden="true"
    >
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : kind === "title" ? (
        <Trophy size={64} />
      ) : (
        <UserRound size={24} />
      )}
    </span>
  );
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function ChampionshipCard({
  careerId,
  championship,
}: ChampionshipCardProps) {
  const headingId = useId();

  const isBriefcase = championship.category === "mitb";
  const hasCurrentReign = championship.reign_id !== null;

  const statusLabel = hasCurrentReign
    ? isBriefcase
      ? "Claimed"
      : "Champion"
    : isBriefcase
      ? "Unclaimed"
      : "Vacant";

  return (
    <article className="championship-card" aria-labelledby={headingId}>
      <div className="championship-card__visual">
        <span
          className={`championship-card__status${
            hasCurrentReign ? "" : " championship-card__status--vacant"
          }`}
        >
          {statusLabel}
        </span>

        <Thumbnail
          key={`title:${championship.id}:${championship.image_url}`}
          src={championship.image_url}
          kind="title"
        />
      </div>

      <div className="championship-card__content">
        <p className="championship-card__category">
          {categoryLabels[championship.category]}
        </p>

        <h2 id={headingId}>{championship.name}</h2>

        <div className="championship-card__badges">
          <span>{genderLabels[championship.gender]}</span>

          {!isBriefcase && <span>{divisionLabels[championship.division]}</span>}
        </div>

        {hasCurrentReign ? (
          championship.holders.length > 0 ? (
            <ul
              className="championship-card__holders"
              aria-label={isBriefcase ? "Current holders" : "Current champions"}
            >
              {championship.holders.map((holder) => (
                <li key={holder.id}>
                  <Thumbnail
                    key={`holder:${holder.id}:${holder.image_url}`}
                    src={holder.image_url}
                    kind="holder"
                  />

                  <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                    {holder.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="championship-card__empty">
              Holder information is unavailable.
            </p>
          )
        ) : (
          <p className="championship-card__empty">
            {isBriefcase
              ? "This briefcase has not been claimed."
              : "This championship is currently vacant."}
          </p>
        )}

        {hasCurrentReign && championship.won_tick !== null && (
          <p className="championship-card__since">
            Held since {formatPeriod(championship.won_tick)}
          </p>
        )}

        {!isBriefcase &&
          hasCurrentReign &&
          championship.duration_weeks !== null && (
            <dl className="championship-card__stats">
              <div>
                <dt>Reign length</dt>
                <dd>
                  {championship.duration_weeks}{" "}
                  {championship.duration_weeks === 1 ? "week" : "weeks"}
                </dd>
              </div>

              <div>
                <dt>Successful defenses</dt>
                <dd>{championship.defenses}</dd>
              </div>
            </dl>
          )}

        <Link
          className="championship-card__detail-link"
          to={`/mygm/${careerId}/titles/${championship.id}`}
          aria-label={`View ${isBriefcase ? "briefcase" : "championship"}: ${championship.name}`}
        >
          {isBriefcase ? "View briefcase" : "View championship"}
        </Link>
      </div>
    </article>
  );
}
