import { useState } from "react";
import { UserRound } from "lucide-react";

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

function WrestlerImage({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="market-wrestler-card__image">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound size={64} aria-hidden="true" />
      )}
    </div>
  );
}

export default function MarketWrestlerCard({
  wrestler,
  onViewProfile,
}: MarketWrestlerCardProps) {
  const primaryClass = wrestler.primary_class?.trim();
  const secondaryClass = wrestler.secondary_class?.trim();

  const hasSecondaryClass =
    (wrestler.in_ring_skill ?? 0) >= 15 &&
    Boolean(secondaryClass) &&
    secondaryClass?.toLowerCase() !== primaryClass?.toLowerCase();

  return (
    <article className="market-wrestler-card">
      <WrestlerImage
        key={wrestler.image_url ?? "no-image"}
        src={wrestler.image_url}
        name={wrestler.name}
      />

      <div className="market-wrestler-card__content">
        <div className="market-wrestler-card__badges">
          <span>{wrestler.gender === "male" ? "Male" : "Female"}</span>

          <span>{wrestler.role === "face" ? "Face" : "Heel"}</span>

          {wrestler.mygm_category && (
            <span>{categoryLabels[wrestler.mygm_category]}</span>
          )}
        </div>

        <h2>{wrestler.name}</h2>

        <p className="market-wrestler-card__class">
          {primaryClass || "Class not recorded"}

          {hasSecondaryClass && <span>Secondary: {secondaryClass}</span>}
        </p>

        <dl className="market-wrestler-card__stats">
          <div>
            <dt>Mic skill</dt>
            <dd>{wrestler.mic_skill ?? "Not recorded"}</dd>
          </div>

          <div>
            <dt>Ring level</dt>
            <dd>{wrestler.in_ring_skill ?? "Not recorded"}</dd>
          </div>
        </dl>

        <button
          className="market-wrestler-card__button"
          type="button"
          aria-label={`View profile for ${wrestler.name}`}
          onClick={() => onViewProfile(wrestler)}
        >
          View profile
        </button>
      </div>
    </article>
  );
}
