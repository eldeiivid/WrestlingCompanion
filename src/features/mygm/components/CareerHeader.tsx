import { Link } from "react-router-dom";
import { UserRound, UsersRound, Wallet } from "lucide-react";

import type { MyGmCareerDetails } from "../types/mygm.types";

import "./CareerHeader.scss";

interface CareerHeaderProps {
  career: MyGmCareerDetails;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fansFormatter = new Intl.NumberFormat("en-US");

export default function CareerHeader({ career }: CareerHeaderProps) {
  const season = Math.floor((career.current_tick - 1) / 50) + 1;
  const week = ((career.current_tick - 1) % 50) + 1;

  const showMetrics = career.finances_enabled || career.fans_enabled;

  return (
    <header
      className={`career-header ${
        showMetrics ? "career-header--with-metrics" : ""
      }`}
      aria-label="Career overview"
    >
      {career.brand_background_url && (
        <img
          className="career-header__background"
          src={career.brand_background_url}
          alt=""
          aria-hidden="true"
        />
      )}

      <div className="career-header__container">
        <div className="career-header__identity">
          <Link
            className="career-header__brand"
            to={`/mygm/${career.id}`}
            aria-label={`${career.brand_name} career dashboard`}
          >
            {career.brand_logo_url ? (
              <img
                src={career.brand_logo_url}
                alt={`${career.brand_name} logo`}
              />
            ) : (
              <span>{career.brand_name}</span>
            )}
          </Link>

          <div
            className="career-header__manager"
            role="group"
            aria-label={`General Manager: ${career.manager_name}`}
          >
            <div className="career-header__avatar">
              {career.manager_image_url ? (
                <img src={career.manager_image_url} alt="" />
              ) : (
                <UserRound size={20} aria-hidden="true" />
              )}
            </div>

            <div className="career-header__manager-copy">
              <span>General Manager</span>
              <strong title={career.manager_name}>{career.manager_name}</strong>
            </div>
          </div>
        </div>

        <div className="career-header__time">
          <span>Season {season}</span>
          <strong>
            Week {week} <span>/ 50</span>
          </strong>
        </div>

        {showMetrics && (
          <dl className="career-header__metrics">
            {career.finances_enabled && (
              <div className="career-header__metric">
                <dt>
                  <Wallet size={16} aria-hidden="true" />
                  Budget
                </dt>
                <dd>{moneyFormatter.format(BigInt(career.budget_total))}</dd>
              </div>
            )}

            {career.fans_enabled && (
              <div className="career-header__metric">
                <dt>
                  <UsersRound size={16} aria-hidden="true" />
                  Fans
                </dt>
                <dd>{fansFormatter.format(BigInt(career.fans_total))}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </header>
  );
}
