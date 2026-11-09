import { useMyGmCareerPath } from "../../hooks/useMyGmCareerPath";
import { useId, useState } from "react";
import { ArrowUpRight, Mic, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import type {
  MarketCategory,
  MarketWrestler,
} from "../../types/market/market.types";

import "./MarketWrestlerCard.scss";

interface MarketWrestlerCardProps {
  wrestler: MarketWrestler;
}

const categoryLabels: Record<MarketCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

export default function MarketWrestlerCard({
  wrestler,
}: MarketWrestlerCardProps) {
  const careerPath = useMyGmCareerPath();
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const primaryClass = wrestler.primary_class?.trim() ?? "";
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";
  const profilePath = wrestler.career_wrestler_id
    ? `${careerPath}/market/wrestlers/${wrestler.career_wrestler_id}`
    : wrestler.catalog_wrestler_id
      ? `${careerPath}/market/catalog/${wrestler.catalog_wrestler_id}`
      : null;

  const hasSecondaryClass =
    (wrestler.in_ring_skill ?? 0) >= 15 &&
    secondaryClass !== "" &&
    secondaryClass.toLowerCase() !== primaryClass.toLowerCase();

  return (
    <article className="market-wrestler-card" aria-labelledby={headingId}>
      <div className="market-wrestler-card__image">
        <span className="market-wrestler-card__category">
          {wrestler.mygm_category
            ? categoryLabels[wrestler.mygm_category]
            : "Uncategorized"}
        </span>

        <div className="market-wrestler-card__portrait" aria-hidden="true">
          {wrestler.image_url && wrestler.image_url !== failedUrl ? (
            <img
              src={wrestler.image_url}
              alt=""
              loading="lazy"
              onError={() => setFailedUrl(wrestler.image_url)}
            />
          ) : (
            <UserRound size={64} strokeWidth={1.25} />
          )}
        </div>
      </div>

      <div className="market-wrestler-card__content">
        <header className="market-wrestler-card__header">
          <h2 id={headingId}>{wrestler.name}</h2>

          <p className="market-wrestler-card__meta">
            {wrestler.gender === "male" ? "Male" : "Female"}
            {" · "}
            {wrestler.role === "face" ? "Face" : "Heel"}
          </p>
        </header>

        <div className="market-wrestler-card__classes">
          <p>
            <span className="market-wrestler-card__sr-only">
              Primary class:{" "}
            </span>
            {primaryClass || "Class not recorded"}
          </p>

          {hasSecondaryClass && (
            <p className="market-wrestler-card__secondary">
              Secondary: {secondaryClass}
            </p>
          )}
        </div>

        <dl className="market-wrestler-card__stats">
          <div>
            <dt className="market-wrestler-card__sr-only">Mic skill</dt>
            <dd>
              {wrestler.mic_skill === null
                ? <><Mic size={16} aria-hidden="true" /><span>Not recorded</span></>
                : <span className="market-wrestler-card__mic-rating" role="img" aria-label={`Mic skill: ${wrestler.mic_skill} of 5`}>
                    {[1, 2, 3, 4, 5].map((point) => (
                      <Mic key={point} size={16} aria-hidden="true" className={point <= wrestler.mic_skill! ? "is-active" : ""} />
                    ))}
                  </span>}
            </dd>
          </div>

          <div>
            <dt className="market-wrestler-card__sr-only">Ring level</dt>
            <dd><Sparkles size={17} aria-hidden="true" />{wrestler.in_ring_skill ?? "Not recorded"}</dd>
          </div>
        </dl>

        {profilePath ? <Link
          className="market-wrestler-card__button"
          to={profilePath}
          aria-label={`View profile: ${wrestler.name}`}
        >
          View profile
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link> : <p className="market-wrestler-card__unavailable">Profile unavailable</p>}
      </div>
    </article>
  );
}
