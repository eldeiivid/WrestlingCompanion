import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Trophy, UserRound } from "lucide-react";

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
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  if (kind === "holder") {
    return <UserRound size={56} strokeWidth={1.25} />;
  }

  return kind === "briefcase" ? (
    <Briefcase size={44} strokeWidth={1.25} />
  ) : (
    <Trophy size={44} strokeWidth={1.25} />
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

  const visibleHolders = hasCurrentReign
    ? championship.holders.slice(0, 2)
    : [];

  const additionalHolderCount = hasCurrentReign
    ? Math.max(0, championship.holders.length - visibleHolders.length)
    : 0;

  const statusLabel = hasCurrentReign
    ? isBriefcase
      ? "Claimed"
      : championship.holders.length > 1
        ? "Champions"
        : "Champion"
    : isBriefcase
      ? "Unclaimed"
      : "Vacant";

  const holderLabel = isBriefcase
    ? championship.holders.length > 1
      ? "Current holders"
      : "Current holder"
    : championship.holders.length > 1
      ? "Current champions"
      : "Current champion";

  return (
    <article className="championship-card" aria-labelledby={headingId}>
      <div className="championship-card__visual">
        <div className="championship-card__visual-meta">
          <span className="championship-card__category">
            {categoryLabels[championship.category]}
          </span>

          <span
            className={`championship-card__status${
              hasCurrentReign ? "" : " championship-card__status--vacant"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="championship-card__belt" aria-hidden="true">
          <AssetImage
            src={championship.image_url}
            kind={isBriefcase ? "briefcase" : "title"}
          />
        </div>

        {visibleHolders.length > 0 ? (
          <div className="championship-card__portraits" aria-hidden="true">
            {visibleHolders.map((holder) => (
              <span className="championship-card__portrait" key={holder.id}>
                <AssetImage src={holder.image_url} kind="holder" />
              </span>
            ))}

            {additionalHolderCount > 0 && (
              <span className="championship-card__more">
                +{additionalHolderCount}
              </span>
            )}
          </div>
        ) : (
          <div className="championship-card__placeholder" aria-hidden="true">
            {hasCurrentReign ? (
              <UserRound size={76} strokeWidth={1} />
            ) : isBriefcase ? (
              <Briefcase size={72} strokeWidth={1} />
            ) : (
              <Trophy size={76} strokeWidth={1} />
            )}
          </div>
        )}
      </div>

      <div className="championship-card__content">
        <header className="championship-card__heading">
          <p className="championship-card__classification">
            {genderLabels[championship.gender]}
            {!isBriefcase && (
              <>
                {" · "}
                {divisionLabels[championship.division]}
              </>
            )}
          </p>

          <h2 id={headingId}>{championship.name}</h2>
        </header>

        <div className="championship-card__holder-information">
          {hasCurrentReign ? (
            championship.holders.length > 0 ? (
              <>
                <p className="championship-card__holder-label">{holderLabel}</p>

                <ul
                  className="championship-card__holders"
                  aria-label={holderLabel}
                >
                  {championship.holders.map((holder) => (
                    <li key={holder.id}>
                      <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                        {holder.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
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
        </div>

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
                  <strong>{championship.duration_weeks}</strong>{" "}
                  <span>
                    {championship.duration_weeks === 1 ? "week" : "weeks"}
                  </span>
                </dd>
              </div>

              <div>
                <dt>Successful defenses</dt>
                <dd>
                  <strong>{championship.defenses}</strong>
                </dd>
              </div>
            </dl>
          )}

        <Link
          className="championship-card__detail-link"
          to={`/mygm/${careerId}/titles/${championship.id}`}
          aria-label={`View ${
            isBriefcase ? "briefcase" : "championship"
          }: ${championship.name}`}
        >
          {isBriefcase ? "View briefcase" : "View championship"}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
