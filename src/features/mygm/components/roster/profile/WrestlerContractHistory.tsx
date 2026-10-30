import { useId } from "react";

import { useWrestlerContractHistory } from "../../../hooks/roster/useWrestlerContractHistory";

import type { CareerRosterAcquisition } from "../../../types/roster/careerRoster.types";
import type {
  ContractHistoryAction,
  ContractHistoryActionType,
  ContractHistoryStatus,
} from "../../../types/roster/wrestlerContractHistory.types";

import "./WrestlerContractHistory.scss";

interface WrestlerContractHistoryProps {
  careerId: string;
  wrestlerId: string;
}

const acquisitionLabels: Record<CareerRosterAcquisition, string> = {
  draft: "Draft",
  market: "Market",
  custom: "Custom",
  transfer: "Transfer",
};

const statusLabels: Record<ContractHistoryStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  terminated: "Terminated",
  expired: "Expired",
  ended: "Ended",
  season_ended: "Season ended",
};

const actionLabels: Record<ContractHistoryActionType, string> = {
  signed: "Contract signed",
  extended: "Contract extended",
  terminated: "Contract terminated",
  expired: "Contract expired",
  season_ended: "Contract ended at season transition",
  retained: "Retained for the new season",
  drafted: "Selected in the season draft",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatPeriod(tick: number): string {
  const season = Math.floor((tick - 1) / 50) + 1;
  const week = ((tick - 1) % 50) + 1;

  return `Season ${season} · Week ${week}`;
}

function ContractAction({ action }: { action: ContractHistoryAction }) {
  return (
    <li className="wrestler-contract-history__event">
      <p className="wrestler-contract-history__event-period">
        {formatPeriod(action.tick)}
      </p>

      <h4>{actionLabels[action.action]}</h4>

      {action.added_weeks !== null && (
        <p>
          {action.action === "signed" ? "Contract length" : "Added"}:{" "}
          {action.added_weeks} {action.added_weeks === 1 ? "week" : "weeks"}
        </p>
      )}

      {action.previous_end_tick !== null && action.action === "extended" && (
        <p>
          Previous last contracted week:{" "}
          {formatPeriod(action.previous_end_tick)}
        </p>
      )}

      {action.new_end_tick !== null && (
        <p>
          {action.action === "extended"
            ? "New last contracted week"
            : "Last contracted week"}
          : {formatPeriod(action.new_end_tick)}
        </p>
      )}

      {action.cost !== null && (
        <p>
          {action.action === "extended" ? "Extension cost" : "Signing cost"}:{" "}
          {currencyFormatter.format(BigInt(action.cost))}
        </p>
      )}

      {action.action === "terminated" && (
        <p>Released without a termination cost or refund.</p>
      )}

      {action.action === "expired" && (
        <p>Released automatically after the contract expired.</p>
      )}
    </li>
  );
}

export default function WrestlerContractHistory({
  careerId,
  wrestlerId,
}: WrestlerContractHistoryProps) {
  const headingId = useId();

  const { data, page, isLoading, errorMessage, goToPage, retry } =
    useWrestlerContractHistory(careerId, wrestlerId);

  return (
    <section className="wrestler-contract-history" aria-labelledby={headingId}>
      <header className="wrestler-contract-history__header">
        <div>
          <h2 id={headingId}>Contract history</h2>

          <p>Roster spells and recorded contract changes.</p>
        </div>

        <button
          className="wrestler-contract-history__button"
          type="button"
          disabled={isLoading}
          onClick={retry}
        >
          Refresh
        </button>
      </header>

      <div aria-busy={isLoading}>
        {isLoading ? (
          <p className="wrestler-contract-history__state" role="status">
            Loading contract history…
          </p>
        ) : errorMessage ? (
          <div className="wrestler-contract-history__state">
            <p role="alert">{errorMessage}</p>

            <button
              className="wrestler-contract-history__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : data ? (
          data.items.length === 0 ? (
            <p className="wrestler-contract-history__state">
              This wrestler has not joined your roster yet.
            </p>
          ) : (
            <>
              <p className="wrestler-contract-history__count">
                {data.total_count}{" "}
                {data.total_count === 1 ? "roster spell" : "roster spells"}
              </p>

              <ol className="wrestler-contract-history__stages">
                {data.items.map((stage) => (
                  <li
                    className="wrestler-contract-history__stage"
                    key={stage.membership_id}
                  >
                    <header className="wrestler-contract-history__stage-header">
                      <div>
                        <h3>{stage.brand_name}</h3>

                        <p>
                          Joined through{" "}
                          {acquisitionLabels[stage.acquisition_type]}
                        </p>
                      </div>

                      <span
                        className={`wrestler-contract-history__status wrestler-contract-history__status--${stage.status}`}
                      >
                        {statusLabels[stage.status]}
                      </span>
                    </header>

                    <dl className="wrestler-contract-history__details">
                      <div>
                        <dt>Joined</dt>
                        <dd>{formatPeriod(stage.joined_tick)}</dd>
                      </div>

                      <div>
                        <dt>Last contracted week</dt>
                        <dd>
                          {stage.contract_end_tick === null
                            ? "No expiration"
                            : formatPeriod(stage.contract_end_tick)}
                        </dd>
                      </div>

                      {stage.left_tick !== null && (
                        <div>
                          <dt>Left roster</dt>
                          <dd>{formatPeriod(stage.left_tick)}</dd>
                        </div>
                      )}

                      {stage.remaining_weeks !== null && (
                        <div>
                          <dt>Remaining, including this week</dt>
                          <dd>
                            {stage.remaining_weeks}{" "}
                            {stage.remaining_weeks === 1 ? "week" : "weeks"}
                          </dd>
                        </div>
                      )}
                    </dl>

                    {stage.actions.length > 0 ? (
                      <ol className="wrestler-contract-history__events">
                        {stage.actions.map((action) => (
                          <ContractAction key={action.id} action={action} />
                        ))}
                      </ol>
                    ) : (
                      <p className="wrestler-contract-history__no-actions">
                        No contract actions were recorded for this roster spell.
                      </p>
                    )}
                  </li>
                ))}
              </ol>

              {data.total_pages > 1 && (
                <nav
                  className="wrestler-contract-history__pagination"
                  aria-label="Contract history pagination"
                >
                  <button
                    className="wrestler-contract-history__button"
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
                    className="wrestler-contract-history__button"
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
