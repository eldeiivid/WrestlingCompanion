import { useId, useState } from "react";
import { ArrowUpRight, UserRound } from "lucide-react";

import type {
  MarketCategory,
  MarketWrestler,
} from "../../types/market/market.types";

import "./MarketWrestlerCard.scss";

interface MarketWrestlerCardProps {
  wrestler: MarketWrestler;
  onViewProfile: (wrestler: MarketWrestler) => void;
}

const categoryLabels: Record<MarketCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

export default function MarketWrestlerCard({
  wrestler,
  onViewProfile,
}: MarketWrestlerCardProps) {
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const primaryClass = wrestler.primary_class?.trim() ?? "";
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";

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
            <dt>Mic skill</dt>
            <dd>
              {wrestler.mic_skill === null
                ? "Not recorded"
                : `${wrestler.mic_skill} / 5`}
            </dd>
          </div>

          <div>
            <dt>Ring level</dt>
            <dd>{wrestler.in_ring_skill ?? "Not recorded"}</dd>
          </div>
        </dl>

        <button
          className="market-wrestler-card__button"
          type="button"
          aria-label={`View profile: ${wrestler.name}`}
          onClick={() => onViewProfile(wrestler)}
        >
          View profile
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
