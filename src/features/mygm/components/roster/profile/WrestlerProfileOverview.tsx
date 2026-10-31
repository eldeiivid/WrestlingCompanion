import { useId, useState } from "react";
import { Clock3, Mic2, Swords, UserRound } from "lucide-react";

import type {
  CareerRosterAcquisition,
  CareerRosterCategory,
} from "../../../types/roster/careerRoster.types";
import type { WrestlerProfileWrestler } from "../../../types/roster/wrestlerProfile.types";

import "./WrestlerProfileOverview.scss";

interface WrestlerProfileOverviewProps {
  wrestler: WrestlerProfileWrestler;
  currentTick: number;
}

const categoryLabels: Record<CareerRosterCategory, string> = {
  active: "Active",
  legend: "Legend",
  local: "Local",
};

const acquisitionLabels: Record<CareerRosterAcquisition, string> = {
  draft: "Draft",
  market: "Market",
  custom: "Custom",
  transfer: "Transfer",
};

function formatTick(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function WrestlerProfileOverview({
  wrestler,
  currentTick,
}: WrestlerProfileOverviewProps) {
  const headingId = useId();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const primaryClass = wrestler.primary_class?.trim() ?? "";
  const secondaryClass = wrestler.secondary_class?.trim() ?? "";

  const canHaveSecondaryClass =
    wrestler.in_ring_skill !== null && wrestler.in_ring_skill >= 15;

  const hasSecondaryClass =
    canHaveSecondaryClass &&
    secondaryClass !== "" &&
    secondaryClass.toLowerCase() !== primaryClass.toLowerCase();

  const membership = wrestler.membership;

  const weeksOnRoster = membership
    ? Math.max(0, currentTick - membership.joined_tick)
    : null;

  const remainingWeeks =
    membership?.contract_end_tick == null
      ? null
      : Math.max(0, membership.contract_end_tick - currentTick + 1);

  const contractLabel =
    remainingWeeks === null
      ? "No expiration"
      : remainingWeeks === 0
        ? "Expired"
        : remainingWeeks === 1
          ? "Expires this week"
          : `${remainingWeeks} weeks remaining`;

  const contractClass =
    remainingWeeks === 0
      ? " wrestler-overview__contract--expired"
      : remainingWeeks !== null && remainingWeeks <= 3
        ? " wrestler-overview__contract--expiring"
        : "";

  return (
    <section className="wrestler-overview" aria-labelledby={headingId}>
      <div className="wrestler-overview__hero">
        <div className="wrestler-overview__portrait" aria-hidden="true">
          {wrestler.image_url && wrestler.image_url !== failedUrl ? (
            <img
              src={wrestler.image_url}
              alt=""
              onError={() => setFailedUrl(wrestler.image_url)}
            />
          ) : (
            <UserRound size={100} strokeWidth={1} />
          )}
        </div>

        <div className="wrestler-overview__identity">
          <p className="wrestler-overview__category">
            {wrestler.mygm_category
              ? categoryLabels[wrestler.mygm_category]
              : "Uncategorized"}
          </p>

          <h2 id={headingId}>{wrestler.name}</h2>

          <p className="wrestler-overview__meta">
            <span>{wrestler.gender === "male" ? "Male" : "Female"}</span>
            <span aria-hidden="true">·</span>
            <span>{wrestler.role === "face" ? "Face" : "Heel"}</span>
          </p>

          <p
            className={`wrestler-overview__status${
              wrestler.is_on_roster
                ? " wrestler-overview__status--on-roster"
                : ""
            }`}
          >
            <span aria-hidden="true" />
            {wrestler.is_on_roster ? "On your roster" : "Not on your roster"}
          </p>

          <dl className="wrestler-overview__skills">
            <div>
              <dt>
                <Mic2 size={15} aria-hidden="true" />
                Mic skill
              </dt>
              <dd>
                {wrestler.mic_skill === null ? (
                  <span className="wrestler-overview__unknown">
                    Not recorded
                  </span>
                ) : (
                  <>
                    {wrestler.mic_skill}
                    <span> / 5</span>
                  </>
                )}
              </dd>
            </div>

            <div>
              <dt>
                <Swords size={15} aria-hidden="true" />
                In-ring level
              </dt>
              <dd>
                {wrestler.in_ring_skill === null ? (
                  <span className="wrestler-overview__unknown">
                    Not recorded
                  </span>
                ) : (
                  wrestler.in_ring_skill
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="wrestler-overview__information">
        <section className="wrestler-overview__section" aria-label="Classes">
          <h3>Wrestling style</h3>

          <dl className="wrestler-overview__details">
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

          {wrestler.in_ring_skill !== null && wrestler.in_ring_skill < 15 && (
            <p className="wrestler-overview__hint">
              A second class unlocks at in-ring level 15.
            </p>
          )}
        </section>

        {membership && (
          <section
            className="wrestler-overview__section"
            aria-label="Roster membership"
          >
            <h3>Roster membership</h3>

            <dl className="wrestler-overview__details">
              <div>
                <dt>Joined</dt>
                <dd>{formatTick(membership.joined_tick)}</dd>
              </div>

              <div>
                <dt>Time on roster</dt>
                <dd>
                  {weeksOnRoster} {weeksOnRoster === 1 ? "week" : "weeks"}
                </dd>
              </div>

              <div>
                <dt>Acquisition</dt>
                <dd>{acquisitionLabels[membership.acquisition_type]}</dd>
              </div>

              <div>
                <dt>Contract ends</dt>
                <dd>
                  {membership.contract_end_tick === null
                    ? "No expiration"
                    : formatTick(membership.contract_end_tick)}
                </dd>
              </div>
            </dl>

            <p className={`wrestler-overview__contract${contractClass}`}>
              <Clock3 size={15} aria-hidden="true" />
              {contractLabel}
            </p>
          </section>
        )}
      </div>
    </section>
  );
}
