import { useOutletContext } from "react-router-dom";

import ChampionsWidget from "../components/dashboard/championships/ChampionsWidget";
import LatestShowWidget from "../components/dashboard/last-show/LatestShowWidget";
import NewsWidget from "../components/dashboard/news/NewsWidget";
import FeaturedRivalriesWidget from "../components/dashboard/rivalries/FeaturedRivalriesWidget";
import CareerShortcuts from "../components/dashboard/shortcuts/CareerShortcuts";
import { useMyGmDashboard } from "../hooks/useMyGmDashboard";
import RecordBookWidget from "../components/dashboard/record-book/RecordBookWidget";

import type { MyGmOutletContext } from "../types/mygm.types";

import "./DashboardScreen.scss";

export default function DashboardScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  const { data, isLoading, errorMessage, retry } = useMyGmDashboard(career.id);

  return (
    <div className="dashboard-screen">
      <header className="dashboard-screen__heading">
        <p>My GM</p>
        <h1>{career.name}</h1>
      </header>

      <NewsWidget key={`news:${career.id}`} careerId={career.id} />

      <LatestShowWidget key={`latest-show:${career.id}`} careerId={career.id} />

      <FeaturedRivalriesWidget
        key={`rivalries:${career.id}`}
        careerId={career.id}
      />

      {isLoading ? (
        <p role="status">Loading championships…</p>
      ) : errorMessage ? (
        <section className="dashboard-screen__error">
          <p role="alert">{errorMessage}</p>

          <button type="button" onClick={retry}>
            Try again
          </button>
        </section>
      ) : data ? (
        <ChampionsWidget
          careerId={career.id}
          currentTick={career.current_tick}
          championships={data.championships}
        />
      ) : null}

      <CareerShortcuts careerId={career.id} />

      <RecordBookWidget key={`record-book:${career.id}`} careerId={career.id} />
    </div>
  );
}
