import { useId } from "react";
import type {
  ShowDetailEvent,
  ShowDetailSummary,
} from "../../types/show-history/showDetail.types";
import type { ShowHistoryType } from "../../types/show-history/showHistory.types";
import "./ShowDetailOverview.scss";

interface ShowDetailOverviewProps {
  event: ShowDetailEvent;
  summary: ShowDetailSummary;
}

const showTypeLabels: Record<ShowHistoryType, string> = {
  weekly: "Weekly show",
  go_home: "Go-home show",
  ple: "PLE",
  special: "Special show",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyChangeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

const fansFormatter = new Intl.NumberFormat("en-US");

const fanChangeFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatAmount(
  value: string | null,
  formatter: Intl.NumberFormat,
): string {
  if (value === null || !/^-?\d+$/.test(value)) {
    return "Not recorded";
  }

  return formatter.format(BigInt(value));
}

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

export default function ShowDetailOverview({
  event,
  summary,
}: ShowDetailOverviewProps) {
  const headingId = useId();
  const completedDate = formatDate(event.completed_at);

  return (
    <section className="show-overview" aria-labelledby={headingId}>
      <header className="show-overview__header">
        <div>
          <span className="show-overview__badge">
            {showTypeLabels[event.show_type]}
          </span>

          <h2 id={headingId}>Show overview</h2>

          <p className="show-overview__week">
            Season {event.season} · Week {event.week}
          </p>
        </div>

        <div className="show-overview__rating">
          <span className="show-overview__rating-label">Show rating</span>

          <strong>
            <span aria-hidden="true">★ </span>

            {event.rating === null
              ? "Not recorded"
              : `${event.rating.toFixed(2)} / 5`}
          </strong>
        </div>
      </header>

      <dl className="show-overview__stats">
        <div>
          <dt>Matches</dt>
          <dd>{summary.match_count}</dd>
        </div>

        <div>
          <dt>Promos</dt>
          <dd>{summary.promo_count}</dd>
        </div>

        <div>
          <dt>Recorded</dt>
          <dd>
            {completedDate && event.completed_at ? (
              <time dateTime={event.completed_at}>{completedDate}</time>
            ) : (
              "Not recorded"
            )}
          </dd>
        </div>
      </dl>

      {summary.finances_recorded && (
        <section className="show-overview__section">
          <h3>Finances</h3>

          <dl className="show-overview__stats">
            <div>
              <dt>Card cost</dt>
              <dd>{formatAmount(summary.total_cost, moneyFormatter)}</dd>
            </div>

            <div>
              <dt>Net money change</dt>
              <dd>
                {formatAmount(summary.money_change, moneyChangeFormatter)}
              </dd>
            </div>

            <div>
              <dt>Final money balance</dt>
              <dd>{formatAmount(summary.final_money, moneyFormatter)}</dd>
            </div>
          </dl>

          <p className="show-overview__hint">
            The net change includes show income and expenses. Card costs and
            promo outcomes are already included.
          </p>
        </section>
      )}

      {summary.fans_recorded && (
        <section className="show-overview__section">
          <h3>Fans</h3>

          <dl className="show-overview__stats">
            <div>
              <dt>Fans gained or lost</dt>
              <dd>{formatAmount(summary.fan_change, fanChangeFormatter)}</dd>
            </div>

            <div>
              <dt>Final fan total</dt>
              <dd>{formatAmount(summary.final_fans, fansFormatter)}</dd>
            </div>
          </dl>

          <p className="show-overview__hint">
            Charity and Invasion outcomes are included in the overall fan
            change.
          </p>
        </section>
      )}
    </section>
  );
}
