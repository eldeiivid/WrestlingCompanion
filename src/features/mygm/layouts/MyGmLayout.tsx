import type { CSSProperties } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

import CareerHeader from "../components/CareerHeader";
import CareerNavigation from "../components/CareerNavigation";

import { useMyGmCareer } from "../hooks/useMyGmCareer";
import { useSeasonTransition } from "../hooks/season-draft/useSeasonTransition";

import type { MyGmOutletContext } from "../types/mygm.types";

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

  const seasonDraftPath = `/mygm/${career.id}/season-draft`;

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
  const { careerId } = useParams();
  const { pathname } = useLocation();

  const { career, isLoading, errorMessage, refreshCareer } =
    useMyGmCareer(careerId);

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
    refreshCareer,
  };

  return (
    <div className="mygm-layout" style={theme}>
      <CareerHeader career={career} />

      <CareerNavigation careerId={career.id} />

      <main className="mygm-layout__content">
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
