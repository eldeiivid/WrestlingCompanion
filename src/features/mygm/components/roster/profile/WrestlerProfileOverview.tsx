import { useId, useState } from "react";
import { Clock3, IdCard, LockKeyhole, Mic, Sparkles, Swords, TriangleAlert, UserRound } from "lucide-react";

import type {
  CareerRosterAcquisition,
  CareerRosterCategory,
} from "../../../types/roster/careerRoster.types";
import type { WrestlerProfileChampionship, WrestlerProfileWrestler } from "../../../types/roster/wrestlerProfile.types";

import "./WrestlerProfileOverview.scss";

interface WrestlerProfileOverviewProps {
  wrestler: WrestlerProfileWrestler;
  currentTick: number;
  championships: WrestlerProfileChampionship[];
}

function ProfileTitle({ title }: { title: WrestlerProfileChampionship }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <li title={title.name}>
    {title.image_url && title.image_url !== failedUrl
      ? <img src={title.image_url} alt={title.name} onError={() => setFailedUrl(title.image_url)} />
      : <span>{title.name}</span>}
  </li>;
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
  championships,
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

          {championships.length > 0 && (
            <ul className="wrestler-overview__titles" aria-label="Current championships and briefcases">
              {championships.map(title => <ProfileTitle key={title.id} title={title} />)}
            </ul>
          )}

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
                <Mic size={15} aria-hidden="true" />
                Mic skill
              </dt>
              <dd>
                {wrestler.mic_skill === null ? (
                  <span className="wrestler-overview__unknown">
                    Not recorded
                  </span>
                ) : (
                  <span className="wrestler-overview__mic-rating" role="img" aria-label={`${wrestler.mic_skill} of 5`}>
                    {[1, 2, 3, 4, 5].map(point => <Mic key={point} size={22} aria-hidden="true" className={point <= (wrestler.mic_skill ?? 0) ? "is-active" : ""} />)}
                  </span>
                )}
              </dd>
            </div>

            <div>
              <dt>
                <Sparkles size={15} aria-hidden="true" />
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
        <section className="wrestler-overview__section wrestler-overview__style" aria-label="Classes">
          <h3><Swords size={18} aria-hidden="true" />Wrestling style</h3>

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
            <div className="wrestler-overview__unlock">
              <p className="wrestler-overview__hint"><LockKeyhole size={14} aria-hidden="true" />Secondary class · Unlocks at level 15</p>
              <progress max={15} value={wrestler.in_ring_skill} aria-label="Progress toward secondary class unlock" />
              <span>Level {wrestler.in_ring_skill} / 15</span>
            </div>
          )}
        </section>

        {membership && (
          <section
            className="wrestler-overview__section wrestler-overview__membership"
            aria-label="Roster membership"
          >
            <div className="wrestler-overview__section-heading">
              <h3><IdCard size={18} aria-hidden="true" />Roster membership</h3>
              <p className={`wrestler-overview__contract${contractClass}`}>
                {remainingWeeks !== null && remainingWeeks <= 3
                  ? <TriangleAlert size={15} aria-hidden="true" />
                  : <Clock3 size={15} aria-hidden="true" />}
                {contractLabel}
              </p>
            </div>

            <dl className="wrestler-overview__details">
              <div>
                <dt>Joined</dt>
                <dd>{formatTick(membership.joined_tick)}</dd>
              </div>

              <div>
                <dt>Time on roster</dt>
                <dd className="wrestler-overview__tenure">
                  <strong>{weeksOnRoster}</strong> {weeksOnRoster === 1 ? "week" : "weeks"}
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

          </section>
        )}
      </div>
    </section>
  );
}
