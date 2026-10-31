import { useId, useState } from "react";
import { CalendarDays, Star, Trophy } from "lucide-react";

import type {
  ShowDetailEvent,
  ShowDetailSummary,
} from "../../types/show-history/showDetail.types";
import type { ShowHistoryType } from "../../types/show-history/showHistory.types";

import "./ShowDetailOverview.scss";

interface ShowDetailOverviewProps {
  event: ShowDetailEvent;
  summary: ShowDetailSummary;
  brandLogoUrl?: string | null;
}

const showTypeLabels: Record<ShowHistoryType, string> = {
  weekly: "Weekly show",
  go_home: "Go Home show",
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
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
}

function ShowMark({ src, isPle }: { src: string | null; isPle: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="show-overview__mark" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          decoding="async"
          onError={() => setFailedUrl(src)}
        />
      ) : isPle ? (
        <Trophy size={48} strokeWidth={1.25} />
      ) : (
        <CalendarDays size={44} strokeWidth={1.25} />
      )}
    </span>
  );
}

export default function ShowDetailOverview({
  event,
  summary,
  brandLogoUrl = null,
}: ShowDetailOverviewProps) {
  const headingId = useId();
  const completedDate = formatDate(event.completed_at);

  const isWeekly =
    event.show_type === "weekly" || event.show_type === "go_home";

  const logoUrl = event.logo_url?.trim() || (isWeekly ? brandLogoUrl : null);

  return (
    <section className="show-overview" aria-labelledby={headingId}>
      <h2 id={headingId} className="show-overview__sr-only">
        Recorded show summary
      </h2>

      <header className="show-overview__hero">
        <div className="show-overview__identity">
          <ShowMark src={logoUrl} isPle={event.show_type === "ple"} />

          <div className="show-overview__show">
            <p className="show-overview__badge">
              {showTypeLabels[event.show_type]}
            </p>

            <p className="show-overview__week">
              Season {event.season} · Week {event.week}
            </p>

            <p className="show-overview__segments">
              {summary.match_count}{" "}
              {summary.match_count === 1 ? "match" : "matches"}
              {" · "}
              {summary.promo_count}{" "}
              {summary.promo_count === 1 ? "promo" : "promos"}
            </p>
          </div>
        </div>

        <dl className="show-overview__rating">
          <dt>Show rating</dt>
          <dd>
            <Star size={22} aria-hidden="true" />

            <strong>
              {event.rating === null ? "Not recorded" : event.rating.toFixed(2)}
            </strong>

            {event.rating !== null && <span>/ 5</span>}
          </dd>
        </dl>
      </header>

      {(summary.finances_recorded || summary.fans_recorded) && (
        <div className="show-overview__balances">
          {summary.finances_recorded && (
            <section className="show-overview__balance">
              <h3>Money</h3>

              <dl>
                <div className="show-overview__final">
                  <dt>Final balance</dt>
                  <dd>{formatAmount(summary.final_money, moneyFormatter)}</dd>
                </div>

                <div>
                  <dt>Net money change</dt>
                  <dd className="show-overview__change">
                    {formatAmount(summary.money_change, moneyChangeFormatter)}
                  </dd>
                </div>

                <div>
                  <dt>Card cost</dt>
                  <dd>{formatAmount(summary.total_cost, moneyFormatter)}</dd>
                </div>
              </dl>

              <p className="show-overview__hint">
                The recorded balance includes all show income and expenses,
                including card costs and promo outcomes.
              </p>
            </section>
          )}

          {summary.fans_recorded && (
            <section className="show-overview__balance">
              <h3>Fans</h3>

              <dl>
                <div className="show-overview__final">
                  <dt>Final fan total</dt>
                  <dd>{formatAmount(summary.final_fans, fansFormatter)}</dd>
                </div>

                <div>
                  <dt>Fans gained or lost</dt>
                  <dd className="show-overview__change">
                    {formatAmount(summary.fan_change, fanChangeFormatter)}
                  </dd>
                </div>
              </dl>

              <p className="show-overview__hint">
                Charity and Invasion outcomes are included in the overall fan
                change.
              </p>
            </section>
          )}
        </div>
      )}

      <footer className="show-overview__recorded">
        <span>Recorded</span>

        {completedDate && event.completed_at ? (
          <time dateTime={event.completed_at}>{completedDate}</time>
        ) : (
          <span>Not recorded</span>
        )}
      </footer>
    </section>
  );
}
