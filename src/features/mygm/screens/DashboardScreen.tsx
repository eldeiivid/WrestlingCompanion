import { Link, useOutletContext } from "react-router-dom";
import { ArrowUpRight, CalendarPlus } from "lucide-react";

import ChampionsWidget from "../components/dashboard/championships/ChampionsWidget";
import LatestShowWidget from "../components/dashboard/last-show/LatestShowWidget";
import NewsWidget from "../components/dashboard/news/NewsWidget";
import FeaturedRivalriesWidget from "../components/dashboard/rivalries/FeaturedRivalriesWidget";
import CareerShortcuts from "../components/dashboard/shortcuts/CareerShortcuts";
import RecordBookWidget from "../components/dashboard/record-book/RecordBookWidget";

import { useMyGmDashboard } from "../hooks/useMyGmDashboard";

import type { MyGmOutletContext } from "../types/mygm.types";

import "./DashboardScreen.scss";

export default function DashboardScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  const { data, isLoading, errorMessage, retry } = useMyGmDashboard(career.id);

  return (
    <div className="dashboard-screen">
      <header className="dashboard-screen__heading">
        <div>
          <p className="dashboard-screen__eyebrow">Career overview</p>

          <h1>Dashboard</h1>

          <p className="dashboard-screen__description">
            Your latest stories, results and career milestones.
          </p>
        </div>

        <Link
          className="dashboard-screen__booking"
          to={`/mygm/${career.id}/booking`}
        >
          <CalendarPlus size={18} aria-hidden="true" />
          Open booking
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </header>

      <div className="dashboard-screen__sections">
        <div className="dashboard-screen__block">
          <NewsWidget key={`news:${career.id}`} careerId={career.id} />
        </div>

        <div className="dashboard-screen__block">
          <LatestShowWidget
            key={`latest-show:${career.id}`}
            careerId={career.id}
          />
        </div>

        <div className="dashboard-screen__block">
          <FeaturedRivalriesWidget
            key={`rivalries:${career.id}`}
            careerId={career.id}
          />
        </div>

        <div className="dashboard-screen__block">
          {isLoading ? (
            <section
              className="dashboard-screen__loading"
              aria-labelledby="dashboard-championships-loading"
              aria-busy="true"
            >
              <h2 id="dashboard-championships-loading">Championships</h2>

              <p role="status">Loading championships…</p>

              <div className="dashboard-screen__skeletons" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </section>
          ) : errorMessage ? (
            <section
              className="dashboard-screen__error"
              aria-labelledby="dashboard-championships-error"
            >
              <h2 id="dashboard-championships-error">Championships</h2>

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
        </div>

        <div className="dashboard-screen__block">
          <CareerShortcuts careerId={career.id} />
        </div>

        <div className="dashboard-screen__block">
          <RecordBookWidget
            key={`record-book:${career.id}`}
            careerId={career.id}
          />
        </div>
      </div>
    </div>
  );
}
