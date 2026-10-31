import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, UserRound, UsersRound, Wallet } from "lucide-react";

import type { MyGmCareerDetails } from "../types/mygm.types";

import "./CareerHeader.scss";

interface CareerHeaderProps {
  career: MyGmCareerDetails;
}

type CareerHeaderTheme = CSSProperties & {
  "--header-glow": string;
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactMoneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fansFormatter = new Intl.NumberFormat("en-US");

const compactFansFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function CareerHeader({ career }: CareerHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isCompact, setIsCompact] = useState(false);

  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const [failedManagerUrl, setFailedManagerUrl] = useState<string | null>(null);

  const [failedBackgroundUrl, setFailedBackgroundUrl] = useState<string | null>(
    null,
  );

  const season = Math.floor((career.current_tick - 1) / 50) + 1;
  const week = ((career.current_tick - 1) % 50) + 1;

  const metricCount =
    Number(career.finances_enabled) + Number(career.fans_enabled);

  const brandColor =
    career.brand_primary_color &&
    /^#[0-9a-f]{6}$/i.test(career.brand_primary_color)
      ? career.brand_primary_color
      : "#8F98AB";

  const theme: CareerHeaderTheme = {
    "--header-glow": `${brandColor}1A`,
  };

  const showLogo =
    career.brand_logo_url !== null && career.brand_logo_url !== failedLogoUrl;

  const showManager =
    career.manager_image_url !== null &&
    career.manager_image_url !== failedManagerUrl;

  const showBackground =
    career.brand_background_url !== null &&
    career.brand_background_url !== failedBackgroundUrl;

  const fullBudget = career.finances_enabled
    ? moneyFormatter.format(BigInt(career.budget_total))
    : "";

  const fullFans = career.fans_enabled
    ? fansFormatter.format(BigInt(career.fans_total))
    : "";

  // Measure the content so the outer header can animate its height.
  // Animate the header independently from the mobile scroll viewport.
  useLayoutEffect(() => {
    const header = headerRef.current;
    const container = containerRef.current;
    const layout = header?.closest<HTMLElement>(".mygm-layout");

    if (!header || !container || !layout) {
      return;
    }

    function updateHeight() {
      if (!header || !container || !layout) {
        return;
      }

      const contentHeight = container.getBoundingClientRect().height;

      header.style.setProperty("--header-height", `${contentHeight}px`);

      // Keep the initial content offset stable while compact.
      if (!header.classList.contains("career-header--compact")) {
        const styles = window.getComputedStyle(header);

        const borderHeight =
          (Number.parseFloat(styles.borderTopWidth) || 0) +
          (Number.parseFloat(styles.borderBottomWidth) || 0);

        layout.style.setProperty(
          "--career-header-expanded-height",
          `${contentHeight + borderHeight}px`,
        );
      }
    }

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);

    return () => {
      observer.disconnect();

      header.style.removeProperty("--header-height");
      layout.style.removeProperty("--career-header-expanded-height");
    };
  }, [career.id]);
  useEffect(() => {
    const scrollArea = headerRef.current
      ?.closest(".mygm-layout")
      ?.querySelector<HTMLElement>(".mygm-layout__content");

    if (!scrollArea) return;

    const desktopQuery = window.matchMedia("(min-width: 768px)");

    let compact = false;
    let animationFrame: number | null = null;

    function updateCompactState() {
      animationFrame = null;

      if (!scrollArea) return;

      const scrollTop = scrollArea.scrollTop;

      // Different thresholds prevent flickering near the boundary.
      const nextCompact =
        !desktopQuery.matches && (compact ? scrollTop > 16 : scrollTop > 140);

      if (nextCompact !== compact) {
        compact = nextCompact;
        setIsCompact(nextCompact);
      }
    }

    function scheduleUpdate() {
      if (animationFrame !== null) return;

      animationFrame = window.requestAnimationFrame(updateCompactState);
    }

    setIsCompact(false);
    updateCompactState();

    scrollArea.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });

    desktopQuery.addEventListener("change", scheduleUpdate);

    return () => {
      scrollArea.removeEventListener("scroll", scheduleUpdate);
      desktopQuery.removeEventListener("change", scheduleUpdate);

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [career.id]);

  return (
    <header
      ref={headerRef}
      className={[
        "career-header",
        metricCount > 0 ? "career-header--with-metrics" : "",
        metricCount === 2 ? "career-header--two-metrics" : "",
        isCompact ? "career-header--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={theme}
      aria-label="Career overview"
    >
      {showBackground && career.brand_background_url && (
        <img
          className="career-header__background"
          src={career.brand_background_url}
          alt=""
          aria-hidden="true"
          onError={() => setFailedBackgroundUrl(career.brand_background_url)}
        />
      )}

      <div ref={containerRef} className="career-header__container">
        <div className="career-header__identity">
          <Link
            className="career-header__brand"
            to={`/mygm/${career.id}`}
            aria-label={`${career.brand_name} career dashboard`}
          >
            {showLogo && career.brand_logo_url ? (
              <img
                src={career.brand_logo_url}
                alt=""
                onError={() => setFailedLogoUrl(career.brand_logo_url)}
              />
            ) : (
              <>
                <Gamepad2 size={24} aria-hidden="true" />
                <span>{career.brand_name}</span>
              </>
            )}
          </Link>

          <div className="career-header__copy">
            <p className="career-header__career-name" title={career.name}>
              {career.name}
            </p>

            <div
              className="career-header__manager"
              role="group"
              aria-label={`General Manager: ${career.manager_name}`}
            >
              <span className="career-header__avatar" aria-hidden="true">
                {showManager && career.manager_image_url ? (
                  <img
                    src={career.manager_image_url}
                    alt=""
                    onError={() =>
                      setFailedManagerUrl(career.manager_image_url)
                    }
                  />
                ) : (
                  <UserRound size={15} />
                )}
              </span>

              <span className="career-header__manager-label">GM</span>

              <span
                className="career-header__manager-name"
                title={career.manager_name}
              >
                {career.manager_name}
              </span>
            </div>
          </div>
        </div>

        <div
          className="career-header__time"
          role="group"
          aria-label={`Season ${season}, week ${week} of 50`}
        >
          <span className="career-header__season">Season {season}</span>

          <strong>
            Week {week}
            {!isCompact && <span> / 50</span>}
          </strong>
        </div>

        {metricCount > 0 && (
          <dl
            className={[
              "career-header__metrics",
              metricCount === 1 ? "career-header__metrics--single" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {career.finances_enabled && (
              <div className="career-header__metric">
                <dt>
                  <Wallet size={15} aria-hidden="true" />
                  Budget
                </dt>

                <dd title={fullBudget} aria-label={fullBudget}>
                  {isCompact
                    ? compactMoneyFormatter.format(BigInt(career.budget_total))
                    : fullBudget}
                </dd>
              </div>
            )}

            {career.fans_enabled && (
              <div className="career-header__metric">
                <dt>
                  <UsersRound size={15} aria-hidden="true" />
                  Fans
                </dt>

                <dd title={fullFans} aria-label={fullFans}>
                  {isCompact
                    ? compactFansFormatter.format(BigInt(career.fans_total))
                    : fullFans}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </header>
  );
}
