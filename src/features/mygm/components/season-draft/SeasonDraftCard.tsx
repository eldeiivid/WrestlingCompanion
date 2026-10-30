import { useId, useState } from "react";
import { UserRound } from "lucide-react";

import type { CareerRosterCategory } from "../../types/roster/careerRoster.types";
import type { SeasonDraftOption } from "../../types/season-draft/seasonDraftOptions.types";

import "./SeasonDraftCard.scss";

interface SeasonDraftCardProps {
  wrestler: SeasonDraftOption;
  isSelected: boolean;
  disabled?: boolean;
  onSelectionChange: (draftKey: string, isSelected: boolean) => void;
}

const categoryLabels: Record<CareerRosterCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

export default function SeasonDraftCard({
  wrestler,
  isSelected,
  disabled = false,
  onSelectionChange,
}: SeasonDraftCardProps) {
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage =
    Boolean(wrestler.image_url) && wrestler.image_url !== failedUrl;

  const primaryClass = wrestler.primary_class?.trim() ?? "";
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";

  const hasSecondaryClass =
    (wrestler.in_ring_skill ?? 0) >= 15 &&
    secondaryClass !== "" &&
    secondaryClass.toLowerCase() !== primaryClass.toLowerCase();

  return (
    <article
      className={`season-draft-card${
        isSelected ? " season-draft-card--selected" : ""
      }`}
      aria-labelledby={headingId}
    >
      <div className="season-draft-card__image" aria-hidden="true">
        {showImage && wrestler.image_url ? (
          <img
            src={wrestler.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(wrestler.image_url)}
          />
        ) : (
          <UserRound size={64} />
        )}
      </div>

      <div className="season-draft-card__content">
        <header className="season-draft-card__header">
          <h3 id={headingId}>{wrestler.name}</h3>

          <div className="season-draft-card__badges">
            <span>{wrestler.gender === "male" ? "Male" : "Female"}</span>

            <span>{wrestler.role === "face" ? "Face" : "Heel"}</span>

            {wrestler.mygm_category && (
              <span>{categoryLabels[wrestler.mygm_category]}</span>
            )}
          </div>
        </header>

        <p className="season-draft-card__class">
          {primaryClass || "Class not recorded"}

          {hasSecondaryClass && <span>Secondary: {secondaryClass}</span>}
        </p>

        <dl className="season-draft-card__stats">
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

        {wrestler.was_on_previous_roster && (
          <p className="season-draft-card__previous">
            On your roster last season
          </p>
        )}

        <label className="season-draft-card__selection">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={disabled}
            aria-label={`Draft ${wrestler.name}`}
            onChange={(event) =>
              onSelectionChange(wrestler.draft_key, event.target.checked)
            }
          />

          <span>{isSelected ? "Selected for draft" : "Draft wrestler"}</span>
        </label>
      </div>
    </article>
  );
}
