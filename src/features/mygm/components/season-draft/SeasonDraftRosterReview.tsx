import { useId, useState } from "react";
import { UserRound } from "lucide-react";

import type { SeasonDraftReviewWrestler } from "../../types/season-draft/seasonDraftReview.types";

import "./SeasonDraftRosterReview.scss";

interface SeasonDraftRosterReviewProps {
  roster: SeasonDraftReviewWrestler[];
  disabled?: boolean;
  onEditRetentions: () => void;
  onEditDraft: () => void;
}

interface RosterGroupProps {
  title: string;
  wrestlers: SeasonDraftReviewWrestler[];
  emptyMessage: string;
  editLabel: string;
  disabled: boolean;
  onEdit: () => void;
}

function WrestlerPortrait({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="season-draft-roster-review__portrait" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <UserRound size={28} />
      )}
    </span>
  );
}

function RosterGroup({
  title,
  wrestlers,
  emptyMessage,
  editLabel,
  disabled,
  onEdit,
}: RosterGroupProps) {
  const headingId = useId();

  return (
    <section
      className="season-draft-roster-review__group"
      aria-labelledby={headingId}
    >
      <header className="season-draft-roster-review__group-header">
        <h3 id={headingId}>
          {title} ({wrestlers.length})
        </h3>

        <button
          className="season-draft-roster-review__button"
          type="button"
          disabled={disabled}
          onClick={onEdit}
        >
          {editLabel}
        </button>
      </header>

      {wrestlers.length === 0 ? (
        <p className="season-draft-roster-review__empty">{emptyMessage}</p>
      ) : (
        <ul className="season-draft-roster-review__list">
          {wrestlers.map((wrestler) => (
            <li
              className="season-draft-roster-review__row"
              key={wrestler.selection_key}
            >
              <WrestlerPortrait src={wrestler.image_url} />

              <div className="season-draft-roster-review__person">
                <p>{wrestler.name}</p>

                {wrestler.wrestler_id === null && (
                  <span>New to this career</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SeasonDraftRosterReview({
  roster,
  disabled = false,
  onEditRetentions,
  onEditDraft,
}: SeasonDraftRosterReviewProps) {
  const headingId = useId();

  const retained = roster.filter((wrestler) => wrestler.source === "retained");

  const drafted = roster.filter((wrestler) => wrestler.source === "draft");

  return (
    <section className="season-draft-roster-review" aria-labelledby={headingId}>
      <header className="season-draft-roster-review__header">
        <h2 id={headingId}>Final roster</h2>

        <p>
          {roster.length} {roster.length === 1 ? "wrestler" : "wrestlers"}{" "}
          selected for the new season.
        </p>
      </header>

      {roster.length === 0 && (
        <p className="season-draft-roster-review__notice">
          Your final roster is empty. Review your retentions and draft
          selections before confirming.
        </p>
      )}

      <div className="season-draft-roster-review__groups">
        <RosterGroup
          title="Retained wrestlers"
          wrestlers={retained}
          emptyMessage="No wrestlers retained from the previous season."
          editLabel="Edit retentions"
          disabled={disabled}
          onEdit={onEditRetentions}
        />

        <RosterGroup
          title="Drafted wrestlers"
          wrestlers={drafted}
          emptyMessage="No additional wrestlers selected in the draft."
          editLabel="Edit draft"
          disabled={disabled}
          onEdit={onEditDraft}
        />
      </div>
    </section>
  );
}
