import { useId, useState } from "react";
import { UserRound } from "lucide-react";
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

  const weeksOnRoster = wrestler.membership
    ? Math.max(0, currentTick - wrestler.membership.joined_tick)
    : null;

  return (
    <section className="wrestler-overview" aria-labelledby={headingId}>
      <div className="wrestler-overview__portrait" aria-hidden="true">
        {showImage && wrestler.image_url ? (
          <img
            src={wrestler.image_url}
            alt=""
            onError={() => setFailedUrl(wrestler.image_url)}
          />
        ) : (
          <UserRound size={80} />
        )}
      </div>

      <div className="wrestler-overview__content">
        <header className="wrestler-overview__header">
          <p className="wrestler-overview__category">
            {wrestler.mygm_category
              ? categoryLabels[wrestler.mygm_category]
              : "Uncategorized"}
          </p>

          <h2 id={headingId}>{wrestler.name}</h2>

          <div className="wrestler-overview__badges">
            <span>{wrestler.gender === "male" ? "Male" : "Female"}</span>

            <span>{wrestler.role === "face" ? "Face" : "Heel"}</span>

            <span>{wrestler.is_on_roster ? "On roster" : "Not on roster"}</span>
          </div>
        </header>

        <section className="wrestler-overview__section">
          <h3>Classes</h3>

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
              A second class becomes available at in-ring level 15.
            </p>
          )}
        </section>

        <section className="wrestler-overview__section">
          <h3>Skills</h3>

          <dl className="wrestler-overview__details">
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
        </section>

        {wrestler.membership && (
          <section className="wrestler-overview__section">
            <h3>Roster membership</h3>

            <dl className="wrestler-overview__details">
              <div>
                <dt>Joined</dt>
                <dd>{formatTick(wrestler.membership.joined_tick)}</dd>
              </div>

              <div>
                <dt>Time on roster</dt>
                <dd>
                  {weeksOnRoster} {weeksOnRoster === 1 ? "week" : "weeks"}
                </dd>
              </div>

              <div>
                <dt>Acquisition</dt>
                <dd>
                  {acquisitionLabels[wrestler.membership.acquisition_type]}
                </dd>
              </div>

              <div>
                <dt>Contract ends</dt>
                <dd>
                  {wrestler.membership.contract_end_tick === null
                    ? "Not recorded"
                    : formatTick(wrestler.membership.contract_end_tick)}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </section>
  );
}
