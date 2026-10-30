import { useId } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import ShowDetailMatchCard from "../../components/show-history/ShowDetailMatchCard";
import ShowDetailOverview from "../../components/show-history/ShowDetailOverview";
import ShowDetailPromoCard from "../../components/show-history/ShowDetailPromoCard";
import { useShowDetail } from "../../hooks/show-history/useShowDetail";
import type { MyGmOutletContext } from "../../types/mygm.types";
import "./ShowDetailScreen.scss";

function getMatchPositionLabel(
  matchId: string,
  firstMatchId: string | undefined,
  lastMatchId: string | undefined,
): string | undefined {
  if (matchId === firstMatchId && matchId === lastMatchId) {
    return "Opener & Main event";
  }

  if (matchId === firstMatchId) {
    return "Opener";
  }

  if (matchId === lastMatchId) {
    return "Main event";
  }

  return undefined;
}

export default function ShowDetailScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const { eventId } = useParams<{ eventId: string }>();

  const headingId = useId();
  const segmentsHeadingId = useId();

  const { data, isLoading, errorMessage, retry } = useShowDetail(
    career.id,
    eventId,
  );

  const historyPath = `/mygm/${career.id}/history`;

  const segments = [...(data?.segments ?? [])].sort(
    (first, second) => first.position - second.position,
  );

  const matches = segments.filter((segment) => segment.kind === "match");

  const firstMatchId = matches[0]?.id;
  const lastMatchId = matches[matches.length - 1]?.id;

  return (
    <section className="show-detail" aria-labelledby={headingId}>
      <header className="show-detail__header">
        <Link className="show-detail__back-link" to={historyPath}>
          ← Back to show history
        </Link>

        <p className="show-detail__eyebrow">Completed show</p>

        <h1 id={headingId}>{data?.event.name ?? "Show details"}</h1>

        <p className="show-detail__description">
          Review the recorded results and outcomes of this show.
        </p>
      </header>

      <div className="show-detail__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="show-detail__state" role="status">
            <p>Loading show details…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="show-detail__state" role="alert">
            <h2>Show details could not be loaded</h2>

            <p>{errorMessage}</p>

            {eventId && (
              <button
                className="show-detail__button"
                type="button"
                onClick={retry}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <>
            <ShowDetailOverview event={data.event} summary={data.summary} />

            <section
              className="show-detail__segments"
              aria-labelledby={segmentsHeadingId}
            >
              <header className="show-detail__section-header">
                <h2 id={segmentsHeadingId}>Show card</h2>

                <p>Segments are displayed in their original order.</p>
              </header>

              {segments.length === 0 ? (
                <div className="show-detail__state">
                  <p>No segments were recorded for this show.</p>
                </div>
              ) : (
                <ol className="show-detail__list">
                  {segments.map((segment) => (
                    <li key={segment.id}>
                      {segment.kind === "match" ? (
                        <ShowDetailMatchCard
                          match={segment}
                          financesRecorded={data.summary.finances_recorded}
                          positionLabel={getMatchPositionLabel(
                            segment.id,
                            firstMatchId,
                            lastMatchId,
                          )}
                        />
                      ) : (
                        <ShowDetailPromoCard
                          promo={segment}
                          financesRecorded={data.summary.finances_recorded}
                        />
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  );
}
