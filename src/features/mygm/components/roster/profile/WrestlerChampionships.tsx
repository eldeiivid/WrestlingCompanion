import { useId, useState } from "react";
import { Trophy } from "lucide-react";
import type { DashboardChampionship } from "../../../types/dashboard.types";
import type { WrestlerProfileChampionship } from "../../../types/roster/wrestlerProfile.types";
import "./WrestlerChampionships.scss";

interface WrestlerChampionshipsProps {
  championships: WrestlerProfileChampionship[];
}

const categoryLabels: Record<DashboardChampionship["category"], string> = {
  world: "World",
  midcard: "Midcard",
  tag_team: "Tag team",
  mitb: "Money in the Bank",
  other: "Championship",
};

function ChampionshipImage({ src }: { src: string | null }) {
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
        <Trophy size={48} />
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
}: WrestlerChampionshipsProps) {
  const headingId = useId();

  return (
    <section className="wrestler-championships" aria-labelledby={headingId}>
      <h2 id={headingId}>Current championships</h2>

      {championships.length === 0 ? (
        <p className="wrestler-championships__empty">
          No championships currently held.
        </p>
      ) : (
        <ul className="wrestler-championships__list">
          {championships.map((championship) => (
            <li
              className="wrestler-championships__card"
              key={championship.reign_id}
            >
              <ChampionshipImage src={championship.image_url} />

              <div>
                <p className="wrestler-championships__category">
                  {categoryLabels[championship.category]}
                </p>

                <h3>{championship.name}</h3>
              </div>

              <dl className="wrestler-championships__holders">
                <dt>
                  {championship.holders.length > 1
                    ? "Current holders"
                    : "Current holder"}
                </dt>

                <dd>
                  {championship.holders
                    .map((holder) => holder.name)
                    .join(" & ") || "Holder unavailable"}
                </dd>
              </dl>

              <p className="wrestler-championships__won">
                Won: {formatTick(championship.won_tick)}
              </p>

              {championship.category !== "mitb" && (
                <dl className="wrestler-championships__stats">
                  <div>
                    <dt>Reign duration</dt>
                    <dd>
                      {championship.duration_weeks}{" "}
                      {championship.duration_weeks === 1 ? "week" : "weeks"}
                    </dd>
                  </div>

                  <div>
                    <dt>Successful defenses</dt>
                    <dd>{championship.defenses}</dd>
                  </div>
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
