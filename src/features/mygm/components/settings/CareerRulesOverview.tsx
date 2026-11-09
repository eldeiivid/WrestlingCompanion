import { useId } from "react";

import type { CareerSettingsData } from "../../types/settings/careerSettings.types";

import "./CareerRulesOverview.scss";

interface CareerRulesOverviewProps {
  data: CareerSettingsData;
}

function formatDifficulty(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function formatGameVersion(value: string): string {
  return value === "wwe2k26" ? "WWE 2K26" : value;
}

function OptionStatus({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`career-rules-overview__status career-rules-overview__status--${
        enabled ? "enabled" : "disabled"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

export default function CareerRulesOverview({
  data,
}: CareerRulesOverviewProps) {
  const headingId = useId();
  const { career, rules } = data;

  return (
    <section
      className="career-rules-overview career-settings-screen__section"
      aria-labelledby={headingId}
    >
      <header className="career-rules-overview__header">
        <h2 id={headingId}>Progress & rules</h2>
        <p>See where you are in the season and which rules apply to this save.</p>
        <span className="career-rules-overview__hint">Read only</span>
      </header>

      <div className="career-rules-overview__groups">
        <div className="career-rules-overview__group">
          <h3>Career progress</h3>
          <dl className="career-rules-overview__details">
            <div>
              <dt>Game</dt>
              <dd>{formatGameVersion(career.game_version)}</dd>
            </div>
            <div>
              <dt>Current season</dt>
              <dd>{career.season}</dd>
            </div>
            <div>
              <dt>Current week</dt>
              <dd>{career.week} / {rules.weeks_per_season}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>
                <time dateTime={career.created_at}>
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                  }).format(new Date(career.created_at))}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        <div className="career-rules-overview__group">
          <h3>Game rules</h3>
          <dl className="career-rules-overview__details">
            <div>
              <dt>Difficulty</dt>
              <dd>{formatDifficulty(rules.difficulty)}</dd>
            </div>
            <div>
              <dt>Season length</dt>
              <dd>{rules.weeks_per_season} weeks</dd>
            </div>
            <div>
              <dt>Finances</dt>
              <dd>
                <OptionStatus enabled={rules.finances_enabled} />
              </dd>
            </div>
            <div>
              <dt>Fans</dt>
              <dd>
                <OptionStatus enabled={rules.fans_enabled} />
              </dd>
            </div>
            <div>
              <dt>Money in the Bank</dt>
              <dd>
                <OptionStatus enabled={rules.mitb_enabled} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
