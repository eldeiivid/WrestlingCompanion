import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock3, TriangleAlert, UserRound } from "lucide-react";

import type {
  CareerRosterCategory,
  CareerRosterWrestler,
} from "../../types/roster/careerRoster.types";

import "./RosterWrestlerCard.scss";

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
  const contractId = useId();

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
          : `${remainingWeeks} weeks left`;

  const ContractIcon =
    remainingWeeks === 0 || isExpiringSoon ? TriangleAlert : Clock3;

  return (
    <article className="roster-wrestler-card" aria-labelledby={headingId}>
      <Link
        className="roster-wrestler-card__link"
        to={`/mygm/${careerId}/roster/${wrestler.id}`}
        aria-label={`View profile: ${wrestler.name}`}
        aria-describedby={contractId}
      >
        <div className="roster-wrestler-card__image">
          <span className="roster-wrestler-card__category">
            {wrestler.mygm_category
              ? categoryLabels[wrestler.mygm_category]
              : "Uncategorized"}
          </span>

          <span className="roster-wrestler-card__portrait" aria-hidden="true">
            {showImage && wrestler.image_url ? (
              <img
                src={wrestler.image_url}
                alt=""
                loading="lazy"
                onError={() => setFailedUrl(wrestler.image_url)}
              />
            ) : (
              <UserRound size={52} strokeWidth={1.2} />
            )}
          </span>
        </div>

        <div className="roster-wrestler-card__content">
          <header className="roster-wrestler-card__header">
            <h2 id={headingId}>{wrestler.name}</h2>

            <p className="roster-wrestler-card__meta">
              {wrestler.gender === "male" ? "Male" : "Female"}
              {" · "}
              {wrestler.role === "face" ? "Face" : "Heel"}
            </p>
          </header>

          <div className="roster-wrestler-card__classes">
            <p>
              <span className="roster-wrestler-card__sr-only">
                Primary class:{" "}
              </span>

              {primaryClass || "Class not recorded"}
            </p>

            {hasSecondaryClass && (
              <p className="roster-wrestler-card__secondary">
                Secondary: {secondaryClass}
              </p>
            )}
          </div>

          <dl className="roster-wrestler-card__stats">
            <div>
              <dt>Mic</dt>

              <dd
                aria-label={
                  wrestler.mic_skill === null ? "Not recorded" : undefined
                }
              >
                {wrestler.mic_skill === null
                  ? "—"
                  : `${wrestler.mic_skill} / 5`}
              </dd>
            </div>

            <div>
              <dt>Ring level</dt>

              <dd
                aria-label={
                  wrestler.in_ring_skill === null ? "Not recorded" : undefined
                }
              >
                {wrestler.in_ring_skill ?? "—"}
              </dd>
            </div>
          </dl>

          <p
            id={contractId}
            className={[
              "roster-wrestler-card__contract",
              remainingWeeks === 0
                ? "roster-wrestler-card__contract--expired"
                : isExpiringSoon
                  ? "roster-wrestler-card__contract--expiring"
                  : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <ContractIcon size={13} aria-hidden="true" />

            <span>
              <span className="roster-wrestler-card__sr-only">Contract: </span>

              {contractLabel}
            </span>
          </p>

          <div className="roster-wrestler-card__footer">
            <span>View profile</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </article>
  );
}
