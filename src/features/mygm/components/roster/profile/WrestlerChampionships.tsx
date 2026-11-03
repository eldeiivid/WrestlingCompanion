import { useId, useState } from "react";
import { BriefcaseBusiness, Trophy } from "lucide-react";
import type { DashboardChampionship } from "../../../types/dashboard.types";
import type { WrestlerProfileChampionship, WrestlerProfileReign } from "../../../types/roster/wrestlerProfile.types";
import "./WrestlerChampionships.scss";

interface WrestlerChampionshipsProps {
  championships: WrestlerProfileChampionship[];
  history?: WrestlerProfileReign[];
  wrestlerId: string;
}

const categoryLabels: Record<DashboardChampionship["category"], string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag team",
  mitb: "Money in the Bank",
  other: "Championship",
};

function ChampionshipImage({ src, isMitb }: { src: string | null; isMitb: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className="wrestler-championships__image" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        isMitb ? <BriefcaseBusiness size={48} /> : <Trophy size={48} />
      )}
    </div>
  );
}

function formatTick(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

export default function WrestlerChampionships({
  championships,
  history,
  wrestlerId,
}: WrestlerChampionshipsProps) {
  const currentTitles = history
    ? history.filter(reign => reign.status === "current" && reign.category !== "mitb")
    : championships.filter(title => title.category !== "mitb");
  const reigns = history?.filter(reign => reign.category !== "mitb" && reign.status === "completed")
    .sort((a, b) => b.won_tick - a.won_tick);
  const briefcases = history?.filter(reign => reign.category === "mitb")
    .sort((a, b) => Number(b.status === "current") - Number(a.status === "current") || b.won_tick - a.won_tick)
    ?? championships.filter(title => title.category === "mitb");

  return (
    <>
      <ChampionshipSection title="Current championships" description="The titles held right now in this career." variant="current" entries={currentTitles} wrestlerId={wrestlerId} emptyMessage="No championships currently held." />
      {reigns && <ChampionshipSection title="Past reigns" description="Every completed reign, with its own place in the record books." variant="history" entries={reigns} wrestlerId={wrestlerId} emptyMessage="No completed championship reigns yet." />}
      <ChampionshipSection title="Money in the Bank" description="Briefcase possessions, tracked separately from championship reigns." variant="briefcases" entries={briefcases} wrestlerId={wrestlerId} emptyMessage={history ? "No Money in the Bank possessions recorded in this career." : "No Money in the Bank briefcase currently held."} />
    </>
  );
}

function ChampionshipSection({ title, description, variant, entries, wrestlerId, emptyMessage }: {
  title: string;
  description: string;
  variant: "current" | "history" | "briefcases";
  entries: (WrestlerProfileChampionship | WrestlerProfileReign)[];
  wrestlerId: string;
  emptyMessage: string;
}) {
  const headingId = useId();

  return (
    <section className={`wrestler-championships wrestler-championships--${variant}`} aria-labelledby={headingId}>
      <header className="wrestler-championships__header">
        <div><h2 id={headingId}>{title}<span>{entries.length}</span></h2><p>{description}</p></div>
      </header>

      {entries.length === 0 ? (
        <p className="wrestler-championships__empty">
          {emptyMessage}
        </p>
      ) : (
        <ul className="wrestler-championships__list">
          {entries.map((championship) => {
            const historical = "lost_tick" in championship;
            const lostTick = historical ? championship.lost_tick : null;
            const isCurrent = historical ? championship.status === "current" : true;
            const isMitb = championship.category === "mitb";
            const isTagTeam = historical ? championship.division === "tag_team" : championship.holders.length > 1;
            const partners = championship.holders.filter(holder => holder.id !== wrestlerId);
            return (
            <li
              className="wrestler-championships__card"
              key={championship.reign_id}
              data-current={isCurrent}
            >
              <div className="wrestler-championships__badges">
                <span className={`wrestler-championships__status${isCurrent ? " wrestler-championships__status--current" : ""}`}>{isCurrent ? "Current" : "Completed"}</span>
                {isMitb && <span className="wrestler-championships__status"><BriefcaseBusiness size={13} aria-hidden="true" /> MITB briefcase</span>}
              </div>
              <ChampionshipImage src={championship.image_url} isMitb={isMitb} />

              <div className="wrestler-championships__identity">
                <p className="wrestler-championships__category">
                  {categoryLabels[championship.category]}
                </p>

                <h3>{championship.name}</h3>
              </div>

              {isTagTeam && <dl className="wrestler-championships__holders">
                <dt>Tag team partners</dt>
                <dd>{partners.map(holder => holder.name).join(" & ") || "Partner unavailable"}</dd>
              </dl>}

              <dl className="wrestler-championships__dates">
                <div><dt>Won</dt><dd>{formatTick(championship.won_tick)}</dd></div>
                <div><dt>Ended</dt><dd>{lostTick === null ? "Ongoing" : formatTick(lostTick)}</dd></div>
              </dl>

                <dl className="wrestler-championships__stats">
                  <div>
                    <dt>{isMitb ? "Possession duration" : "Reign duration"}</dt>
                    <dd>
                      {championship.duration_weeks}{" "}
                      <span>{championship.duration_weeks === 1 ? "week" : "weeks"}</span>
                    </dd>
                  </div>

                  {!isMitb && <div>
                    <dt>Successful defenses</dt>
                    <dd>{championship.defenses}</dd>
                  </div>}
                </dl>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
