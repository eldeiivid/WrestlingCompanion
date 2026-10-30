import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";

import { useChampionshipReigns } from "../../../hooks/championships/useChampionshipReigns";

import type { ChampionshipCategory } from "../../../types/championships/championships.types";
import type { ChampionshipReign } from "../../../types/championships/championshipDetail.types";

import "./ChampionshipReignHistory.scss";

interface ChampionshipReignHistoryProps {
  careerId: string;
  titleId: string;
  category: ChampionshipCategory;
  onViewDefenses: (reign: ChampionshipReign) => void;
}

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

function HolderPortrait({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="championship-reign-history__portrait" aria-hidden="true">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <UserRound size={24} />
      )}
    </span>
  );
}

export default function ChampionshipReignHistory({
  careerId,
  titleId,
  category,
  onViewDefenses,
}: ChampionshipReignHistoryProps) {
  const headingId = useId();
  const isBriefcase = category === "mitb";

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useChampionshipReigns(careerId, titleId);

  return (
    <section className="championship-reign-history" aria-labelledby={headingId}>
      <header className="championship-reign-history__header">
        <div>
          <h2 id={headingId}>
            {isBriefcase ? "Holder history" : "Reign history"}
          </h2>

          <p>
            {isBriefcase
              ? "Current and previous briefcase holders."
              : "Current and previous champions, reigns and defenses."}
          </p>
        </div>

        <button
          className="championship-reign-history__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <div aria-busy={isLoading}>
        {isLoading ? (
          <p className="championship-reign-history__state" role="status">
            Loading history…
          </p>
        ) : errorMessage ? (
          <div className="championship-reign-history__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="championship-reign-history__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          data.items.length === 0 ? (
            <p className="championship-reign-history__state">
              {isBriefcase
                ? "No holder history has been recorded."
                : "No reigns have been recorded for this championship."}
            </p>
          ) : (
            <>
              <p className="championship-reign-history__count">
                {data.total_count}{" "}
                {isBriefcase
                  ? data.total_count === 1
                    ? "holder period"
                    : "holder periods"
                  : data.total_count === 1
                    ? "reign"
                    : "reigns"}
              </p>

              <ol className="championship-reign-history__list">
                {data.items.map((reign) => (
                  <li
                    className="championship-reign-history__card"
                    key={reign.id}
                  >
                    <header className="championship-reign-history__card-header">
                      <h3>
                        {isBriefcase
                          ? reign.is_current
                            ? "Current holders"
                            : "Previous holders"
                          : reign.is_current
                            ? "Current reign"
                            : "Previous reign"}
                      </h3>

                      <span
                        className={`championship-reign-history__status${
                          reign.is_current
                            ? " championship-reign-history__status--current"
                            : ""
                        }`}
                      >
                        {reign.is_current ? "Current" : "Ended"}
                      </span>
                    </header>

                    {reign.holders.length > 0 ? (
                      <ul className="championship-reign-history__holders">
                        {reign.holders.map((holder) => (
                          <li key={holder.id}>
                            <HolderPortrait
                              key={`${holder.id}:${holder.image_url}`}
                              src={holder.image_url}
                            />

                            <Link to={`/mygm/${careerId}/roster/${holder.id}`}>
                              {holder.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="championship-reign-history__message">
                        Holder information is unavailable.
                      </p>
                    )}

                    <dl className="championship-reign-history__details">
                      <div>
                        <dt>Started</dt>
                        <dd>{formatPeriod(reign.won_tick)}</dd>
                      </div>

                      <div>
                        <dt>Ended</dt>
                        <dd>
                          {reign.lost_tick === null
                            ? "Ongoing"
                            : formatPeriod(reign.lost_tick)}
                        </dd>
                      </div>

                      {!isBriefcase && (
                        <>
                          <div>
                            <dt>Reign length</dt>
                            <dd>
                              {reign.duration_weeks}{" "}
                              {reign.duration_weeks === 1 ? "week" : "weeks"}
                            </dd>
                          </div>

                          <div>
                            <dt>Successful defenses</dt>
                            <dd>{reign.defenses}</dd>
                          </div>
                        </>
                      )}
                    </dl>

                    <div className="championship-reign-history__matches">
                      {reign.won_match ? (
                        <Link
                          to={`/mygm/${careerId}/history/${reign.won_match.event_id}`}
                        >
                          View acquisition show: {reign.won_match.event_name}
                        </Link>
                      ) : (
                        <p>No acquisition match is recorded.</p>
                      )}

                      {reign.end_type === "match" &&
                        (reign.lost_match ? (
                          <Link
                            to={`/mygm/${careerId}/history/${reign.lost_match.event_id}`}
                          >
                            View loss show: {reign.lost_match.event_name}
                          </Link>
                        ) : (
                          <p>The recorded end match is unavailable.</p>
                        ))}

                      {reign.end_type === "without_match" && (
                        <p>Ended without a recorded match.</p>
                      )}
                    </div>

                    {!isBriefcase && reign.defenses > 0 && (
                      <button
                        className="championship-reign-history__button"
                        type="button"
                        onClick={() => onViewDefenses(reign)}
                      >
                        View defenses
                      </button>
                    )}
                  </li>
                ))}
              </ol>

              {data.total_pages > 1 && (
                <nav
                  className="championship-reign-history__pagination"
                  aria-label={
                    isBriefcase
                      ? "Holder history pagination"
                      : "Reign history pagination"
                  }
                >
                  <button
                    className="championship-reign-history__button"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {page} of {data.total_pages}
                  </span>

                  <button
                    className="championship-reign-history__button"
                    type="button"
                    disabled={page >= data.total_pages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )
        ) : null}
      </div>
    </section>
  );
}
