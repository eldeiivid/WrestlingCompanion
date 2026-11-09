import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useParams,
} from "react-router-dom";

import CareerHeader from "../components/CareerHeader";
import CareerNavigation from "../components/CareerNavigation";

import { useMyGmCareer } from "../hooks/useMyGmCareer";
import { useMyGmRoute } from "../hooks/useMyGmRoute";
import { useSeasonTransition } from "../hooks/season-draft/useSeasonTransition";
import { canonicalMyGmPath, myGmCareerPath } from "../routes/mygmPaths";

import type { MyGmOutletContext } from "../types/mygm.types";
import type { MyGmRoute } from "../routes/mygmPaths";

import "./MyGmLayout.scss";

type CareerTheme = CSSProperties & {
  "--career-accent": string;
};

interface CareerSeasonGateProps {
  context: MyGmOutletContext;
}

function CareerSeasonGate({ context }: CareerSeasonGateProps) {
  const { pathname } = useLocation();
  const { career } = context;

  const { data, isLoading, isReady, errorMessage, retry } = useSeasonTransition(
    career.id,
  );

  const seasonDraftPath = `${context.careerPath}/season-draft`;

  const isSeasonDraftRoute = pathname.replace(/\/+$/, "") === seasonDraftPath;

  if (isLoading || (!isReady && !errorMessage)) {
    return (
      <div className="mygm-layout__status">
        <p role="status">Checking season status…</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <section className="mygm-layout__notice">
        <h2>Unable to check season status</h2>

        <p role="alert">{errorMessage}</p>

        <button type="button" onClick={retry}>
          Try again
        </button>

        <Link to="/mygm">Back to careers</Link>
      </section>
    );
  }

  if (data && !isSeasonDraftRoute) {
    return <Navigate to={seasonDraftPath} replace />;
  }

  return <Outlet context={context} />;
}

export default function MyGmLayout() {
  const { careerRef = "" } = useParams();
  const titleRef = useMatch("/mygm/:careerRef/titles/:titleRef")?.params.titleRef ?? null;
  const { pathname, search, hash, state } = useLocation();
  const { route, isLoading, hasError, retry } = useMyGmRoute(careerRef, titleRef);

  if (isLoading || !route) {
    return (
      <main className="mygm-layout__status">
        {isLoading ? (
          <p role="status">Opening your career…</p>
        ) : (
          <section>
            <h1>{hasError ? "Unable to open this link" : titleRef ? "Championship not found" : "Career not found"}</h1>
            <p role={hasError ? "alert" : undefined}>
              {hasError
                ? "We couldn’t resolve this link. Please try again."
                : "This resource is unavailable or you do not have access to it."}
            </p>
            {hasError && <button type="button" onClick={retry}>Try again</button>}
            <Link to="/mygm">Back to careers</Link>
          </section>
        )}
      </main>
    );
  }

  const canonicalPath = canonicalMyGmPath(pathname, route);
  if (canonicalPath !== pathname) {
    return <Navigate to={{ pathname: canonicalPath, search, hash }} replace state={state} />;
  }

  return <MyGmCareerLayout route={route} />;
}

function MyGmCareerLayout({ route }: { route: MyGmRoute }) {
  const { pathname } = useLocation();
  const contentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  const { career, isLoading, errorMessage, refreshCareer } =
    useMyGmCareer(route.career_id);

  if (isLoading && !career) {
    return (
      <main className="mygm-layout__status">
        <p role="status">Loading career…</p>
      </main>
    );
  }

  if (!career) {
    return (
      <main className="mygm-layout__status">
        <section>
          <h1>{errorMessage ? "Unable to load career" : "Career not found"}</h1>

          <p role={errorMessage ? "alert" : undefined}>
            {errorMessage ||
              "This career is unavailable or you do not have access to it."}
          </p>

          {errorMessage && (
            <button type="button" onClick={refreshCareer}>
              Try again
            </button>
          )}

          <Link to="/mygm">Back to careers</Link>
        </section>
      </main>
    );
  }

  const primaryColor = career.brand_primary_color;

  const theme: CareerTheme = {
    "--career-accent":
      primaryColor && /^#[0-9a-f]{6}$/i.test(primaryColor)
        ? primaryColor
        : "#E2231A",
  };

  const context: MyGmOutletContext = {
    career,
    careerPath: myGmCareerPath(route.career_slug),
    titleId: route.title_id,
    refreshCareer,
  };

  return (
    <div className="mygm-layout" style={theme}>
      <a className="mygm-layout__skip" href="#career-content">Skip to career content</a>
      <CareerHeader career={career} careerPath={context.careerPath} />

      <CareerNavigation careerPath={context.careerPath} />

      <main ref={contentRef} id="career-content" className="mygm-layout__content" tabIndex={-1}>
        {errorMessage && (
          <div className="mygm-layout__notice">
            <p role="alert">{errorMessage}</p>

            <button type="button" onClick={refreshCareer}>
              Try again
            </button>
          </div>
        )}

        <CareerSeasonGate
          key={`${career.id}:${career.current_tick}:${pathname}`}
          context={context}
        />
      </main>
    </div>
  );
}
