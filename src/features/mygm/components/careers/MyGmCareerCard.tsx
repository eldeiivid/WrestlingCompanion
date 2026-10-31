import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Gamepad2 } from "lucide-react";

import type { MyGmCareerSummary } from "../../types/mygm.types";

import "./MyGmCareerCard.scss";

interface MyGmCareerCardProps {
  career: MyGmCareerSummary;
  index?: number;
}

type CareerCardTheme = CSSProperties & {
  "--card-brand": string;
  "--card-tint": string;
  "--card-enter-delay": string;
};

export default function MyGmCareerCard({
  career,
  index = 0,
}: MyGmCareerCardProps) {
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const [failedBackgroundUrl, setFailedBackgroundUrl] = useState<string | null>(
    null,
  );

  const [failedManagerUrl, setFailedManagerUrl] = useState<string | null>(null);

  const season = Math.floor((career.current_tick - 1) / 50) + 1;
  const week = ((career.current_tick - 1) % 50) + 1;

  const brandColor =
    career.brand_primary_color &&
    /^#[0-9a-f]{6}$/i.test(career.brand_primary_color)
      ? career.brand_primary_color
      : "#B095FF";

  const theme: CareerCardTheme = {
    "--card-brand": brandColor,
    "--card-tint": `${brandColor}24`,
    "--card-enter-delay": `${Math.min(index, 5) * 45}ms`,
  };

  const showLogo =
    career.brand_logo_url !== null && career.brand_logo_url !== failedLogoUrl;

  const showBackground =
    career.brand_background_url !== null &&
    career.brand_background_url !== failedBackgroundUrl;

  const showManager =
    career.manager_image_url !== null &&
    career.manager_image_url !== failedManagerUrl;

  return (
    <li className="mygm-career-card" style={theme}>
      <Link
        className="mygm-career-card__link"
        to={`/mygm/${career.id}`}
        aria-label={`Continue ${career.name}, season ${season}, week ${week}`}
      >
        <div className="mygm-career-card__visual">
          {showBackground && career.brand_background_url && (
            <img
              className="mygm-career-card__background"
              src={career.brand_background_url}
              alt=""
              loading="lazy"
              aria-hidden="true"
              onError={() =>
                setFailedBackgroundUrl(career.brand_background_url)
              }
            />
          )}

          <span className="mygm-career-card__mode">MyGM</span>

          <div className="mygm-career-card__brand">
            {showLogo && career.brand_logo_url ? (
              <img
                className="mygm-career-card__logo"
                src={career.brand_logo_url}
                alt={career.brand_name || "Career brand"}
                loading="lazy"
                onError={() => setFailedLogoUrl(career.brand_logo_url)}
              />
            ) : (
              <>
                <Gamepad2 size={36} aria-hidden="true" />
                <span>{career.brand_name || "MyGM career"}</span>
              </>
            )}
          </div>

          {showManager && career.manager_image_url && (
            <div className="mygm-career-card__portrait" aria-hidden="true">
              <img
                src={career.manager_image_url}
                alt=""
                loading="lazy"
                onError={() => setFailedManagerUrl(career.manager_image_url)}
              />
            </div>
          )}
        </div>

        <div className="mygm-career-card__body">
          <h3>{career.name}</h3>

          {career.manager_name && (
            <p className="mygm-career-card__manager">
              <span>General Manager</span>
              <strong>{career.manager_name}</strong>
            </p>
          )}

          <div className="mygm-career-card__period">
            <span>Season {season}</span>

            <span>
              <strong>Week {week}</strong>
              <span className="mygm-career-card__week-limit"> / 50</span>
            </span>
          </div>

          <progress
            className="mygm-career-card__progress"
            value={week - 1}
            max={50}
            aria-label={`Completed weeks in season ${season}`}
            aria-valuetext={`${week - 1} of 50 weeks completed`}
          />

          <div className="mygm-career-card__footer">
            <span>Continue career</span>

            <span className="mygm-career-card__arrow" aria-hidden="true">
              <ArrowUpRight size={20} />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
