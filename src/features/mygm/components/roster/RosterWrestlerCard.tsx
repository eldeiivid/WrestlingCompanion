import { useId, useState } from "react";
import { UserRound } from "lucide-react";
import type {
  CareerRosterCategory,
  CareerRosterWrestler,
} from "../../types/roster/careerRoster.types";
import "./RosterWrestlerCard.scss";
import { Link } from "react-router-dom";

interface RosterWrestlerCardProps {
  careerId: string;
  currentTick: number;
  wrestler: CareerRosterWrestler;
}

const categoryLabels: Record<CareerRosterCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

export default function RosterWrestlerCard({
  careerId,
  currentTick,
  wrestler,
}: RosterWrestlerCardProps) {
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage =
    wrestler.image_url !== null && wrestler.image_url !== failedUrl;

  const primaryClass = wrestler.primary_class?.trim() ?? "";
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";

  const canHaveSecondaryClass =
    wrestler.in_ring_skill !== null && wrestler.in_ring_skill >= 15;

  const hasSecondaryClass =
    canHaveSecondaryClass &&
    secondaryClass !== "" &&
    secondaryClass.toLowerCase() !== primaryClass.toLowerCase();

  const contractEndTick = wrestler.membership.contract_end_tick;

  const remainingWeeks =
    contractEndTick === null
      ? null
      : Math.max(0, contractEndTick - currentTick + 1);

  const isExpiringSoon =
    remainingWeeks !== null && remainingWeeks >= 1 && remainingWeeks <= 3;

  const contractLabel =
    remainingWeeks === null
      ? "No expiration"
      : remainingWeeks === 0
        ? "Expired"
        : remainingWeeks === 1
          ? "Expires this week"
          : `${remainingWeeks} weeks remaining`;

  return (
    <article className="roster-wrestler-card" aria-labelledby={headingId}>
      <div className="roster-wrestler-card__image">
        <span className="roster-wrestler-card__category">
          {wrestler.mygm_category
            ? categoryLabels[wrestler.mygm_category]
            : "Uncategorized"}
        </span>

        <div className="roster-wrestler-card__portrait" aria-hidden="true">
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
      </div>

      <div className="roster-wrestler-card__content">
        <header className="roster-wrestler-card__header">
          <h2 id={headingId}>{wrestler.name}</h2>

          <div className="roster-wrestler-card__badges">
            <span>{wrestler.gender === "male" ? "Male" : "Female"}</span>

            <span>{wrestler.role === "face" ? "Face" : "Heel"}</span>
          </div>
        </header>

        <dl className="roster-wrestler-card__classes">
          <div>
            <dt>Primary class</dt>
            <dd>{primaryClass || "Not recorded"}</dd>
          </div>

          {canHaveSecondaryClass && (
            <div>
              <dt>Secondary class</dt>
              <dd>{hasSecondaryClass ? secondaryClass : "Not recorded"}</dd>
            </div>
          )}
        </dl>

        <dl className="roster-wrestler-card__stats">
          <div>
            <dt>Mic skill</dt>
            <dd>
              {wrestler.mic_skill === null
                ? "Not recorded"
                : `${wrestler.mic_skill} / 5`}
            </dd>
          </div>

          <div>
            <dt>In-ring level</dt>
            <dd>
              {wrestler.in_ring_skill === null
                ? "Not recorded"
                : wrestler.in_ring_skill}
            </dd>
          </div>
        </dl>

        <div
          className={`roster-wrestler-card__contract${
            remainingWeeks === 0
              ? " roster-wrestler-card__contract--expired"
              : isExpiringSoon
                ? " roster-wrestler-card__contract--expiring"
                : ""
          }`}
        >
          <span className="roster-wrestler-card__contract-label">Contract</span>

          <strong>{contractLabel}</strong>

          {remainingWeeks !== null &&
            remainingWeeks >= 2 &&
            remainingWeeks <= 3 && (
              <span className="roster-wrestler-card__contract-warning">
                Expiring soon
              </span>
            )}
        </div>

        <Link
          className="roster-wrestler-card__profile-link"
          to={`/mygm/${careerId}/roster/${wrestler.id}`}
          aria-label={`View profile: ${wrestler.name}`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
