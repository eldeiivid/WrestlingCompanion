import { useId, useState } from "react";
import { Trophy, UserRound } from "lucide-react";

import type { CareerRosterCategory } from "../../types/roster/careerRoster.types";
import type { SeasonRetentionCandidate } from "../../types/season-draft/seasonDraft.types";

import "./SeasonRetentionCard.scss";

interface SeasonRetentionCardProps {
  candidate: SeasonRetentionCandidate;
  isSelected: boolean;
  disabled?: boolean;
  onSelectionChange: (membershipId: string, isSelected: boolean) => void;
}

const categoryLabels: Record<CareerRosterCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

export default function SeasonRetentionCard({
  candidate,
  isSelected,
  disabled = false,
  onSelectionChange,
}: SeasonRetentionCardProps) {
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage =
    Boolean(candidate.image_url) && candidate.image_url !== failedUrl;

  const primaryClass = candidate.primary_class?.trim() ?? "";
  const secondaryClass = candidate.secondary_class?.trim() ?? "";

  const hasSecondaryClass =
    (candidate.in_ring_skill ?? 0) >= 15 &&
    secondaryClass !== "" &&
    secondaryClass.toLowerCase() !== primaryClass.toLowerCase();

  return (
    <article
      className={`season-retention-card${
        isSelected ? " season-retention-card--selected" : ""
      }`}
      aria-labelledby={headingId}
    >
      <div className="season-retention-card__image" aria-hidden="true">
        {showImage && candidate.image_url ? (
          <img
            src={candidate.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(candidate.image_url)}
          />
        ) : (
          <UserRound size={64} />
        )}
      </div>

      <div className="season-retention-card__content">
        <header className="season-retention-card__header">
          <h3 id={headingId}>{candidate.name}</h3>

          <div className="season-retention-card__badges">
            <span>{candidate.gender === "male" ? "Male" : "Female"}</span>

            <span>{candidate.role === "face" ? "Face" : "Heel"}</span>

            {candidate.mygm_category && (
              <span>{categoryLabels[candidate.mygm_category]}</span>
            )}
          </div>
        </header>

        <p className="season-retention-card__class">
          {primaryClass || "Class not recorded"}

          {hasSecondaryClass && <span>Secondary: {secondaryClass}</span>}
        </p>

        <dl className="season-retention-card__stats">
          <div>
            <dt>Mic skill</dt>
            <dd>
              {candidate.mic_skill === null
                ? "Not recorded"
                : `${candidate.mic_skill} / 5`}
            </dd>
          </div>

          <div>
            <dt>Ring level</dt>
            <dd>{candidate.in_ring_skill ?? "Not recorded"}</dd>
          </div>
        </dl>

        {candidate.is_champion && (
          <p className="season-retention-card__recommendation">
            <Trophy size={16} aria-hidden="true" />
            Champion · Recommended
          </p>
        )}

        {candidate.championships.length > 0 && (
          <ul
            className="season-retention-card__championships"
            aria-label="Currently held titles and briefcases"
          >
            {candidate.championships.map((title) => (
              <li key={title.id}>{title.name}</li>
            ))}
          </ul>
        )}

        <label className="season-retention-card__selection">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={disabled}
            aria-label={`Retain ${candidate.name}`}
            onChange={(event) =>
              onSelectionChange(candidate.membership_id, event.target.checked)
            }
          />

          <span>
            {isSelected ? "Selected for retention" : "Retain wrestler"}
          </span>
        </label>
      </div>
    </article>
  );
}
