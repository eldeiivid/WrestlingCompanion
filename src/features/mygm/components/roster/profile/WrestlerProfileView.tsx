import { useId } from "react";
import { Link } from "react-router-dom";

import WrestlerProfileOverview from "./WrestlerProfileOverview";
import WrestlerProfileStats from "./WrestlerProfileStats";
import WrestlerRecentMatches from "./WrestlerRecentMatches";
import WrestlerChampionships from "./WrestlerChampionships";
import WrestlerActiveRivalries from "./WrestlerActiveRivalries";
import type { ReactNode } from "react";

import type { WrestlerProfileData } from "../../../types/roster/wrestlerProfile.types";
import WrestlerContractHistory from "./WrestlerContractHistory";

interface WrestlerProfileViewProps {
  careerId: string;
  backPath: string;
  backLabel: string;
  data: WrestlerProfileData | null;
  isLoading: boolean;
  errorMessage: string;
  canRefresh: boolean;
  onRetry: () => void;
  actions?: ReactNode;
  contractHistoryWrestlerId?: string;
}

export default function WrestlerProfileView({
  careerId,
  backPath,
  backLabel,
  data,
  isLoading,
  errorMessage,
  canRefresh,
  onRetry,
  actions,
  contractHistoryWrestlerId,
}: WrestlerProfileViewProps) {
  const headingId = useId();

  return (
    <section className="wrestler-profile" aria-labelledby={headingId}>
      <header className="wrestler-profile__header">
        <Link className="wrestler-profile__back-link" to={backPath}>
          ← {backLabel}
        </Link>

        <div className="wrestler-profile__heading">
          <div>
            <p className="wrestler-profile__eyebrow">Career profile</p>

            <h1 id={headingId}>Wrestler profile</h1>

            <p className="wrestler-profile__description">
              Current details, career statistics and recent matches.
            </p>
          </div>

          <button
            className="wrestler-profile__button"
            type="button"
            disabled={isLoading || !canRefresh}
            onClick={onRetry}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="wrestler-profile__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="wrestler-profile__state">
            <p role="status">Loading wrestler profile…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="wrestler-profile__state">
            <h2>The wrestler profile could not be loaded</h2>

            <p role="alert">{errorMessage}</p>

            {canRefresh && (
              <button
                className="wrestler-profile__button"
                type="button"
                onClick={onRetry}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <>
            <WrestlerProfileOverview
              wrestler={data.wrestler}
              currentTick={data.current_tick}
            />

            {actions}

            <WrestlerProfileStats stats={data.stats} />

            <WrestlerChampionships championships={data.championships} />

            <WrestlerActiveRivalries
              careerId={careerId}
              rivalries={data.rivalries}
            />

            <WrestlerRecentMatches
              careerId={careerId}
              history={data.match_history}
            />

            {contractHistoryWrestlerId ? (
              <WrestlerContractHistory
                key={`contract-history:${careerId}:${contractHistoryWrestlerId}`}
                careerId={careerId}
                wrestlerId={contractHistoryWrestlerId}
              />
            ) : (
              <section
                className="wrestler-contract-history"
                aria-label="Contract history"
              >
                <header className="wrestler-contract-history__header">
                  <div>
                    <h2>Contract history</h2>
                    <p>Roster spells and recorded contract changes.</p>
                  </div>
                </header>

                <p className="wrestler-contract-history__state">
                  This wrestler has not joined your roster yet.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
