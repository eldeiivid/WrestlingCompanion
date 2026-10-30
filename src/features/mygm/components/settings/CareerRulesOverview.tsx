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
    <section className="career-rules-overview" aria-labelledby={headingId}>
      <header className="career-rules-overview__header">
        <h2 id={headingId}>Career configuration</h2>

        <p>Review your progress and the rules selected for this career.</p>
      </header>

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
          <dd>
            {career.week} / {rules.weeks_per_season}
          </dd>
        </div>

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

      <p className="career-rules-overview__hint">
        Career rules are shown for reference and cannot be edited here.
      </p>
    </section>
  );
}
