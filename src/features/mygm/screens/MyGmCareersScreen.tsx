import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Gamepad2, Plus } from "lucide-react";

import { useAuth } from "../../auth/hooks/useAuth";
import { useMyGmCareers } from "../hooks/useMyGmCareers";

import "./MyGmCareersScreen.scss";

export default function MyGmCareersScreen() {
  const { user } = useAuth();
  const { careers, isLoading, errorMessage, retry } = useMyGmCareers(user?.id);

  return (
    <main className="mygm-careers">
      <Link className="mygm-careers__back" to="/">
        <ArrowLeft size={18} aria-hidden="true" />
        Back to lobby
      </Link>

      <header className="mygm-careers__header">
        <div>
          <p className="mygm-careers__eyebrow">My GM</p>
          <h1>Your careers</h1>
          <p>Continue your story or start a new chapter.</p>
        </div>

        <Link
          className="mygm-careers__button mygm-careers__button--primary"
          to="/mygm/new"
        >
          <Plus size={18} aria-hidden="true" />
          New career
        </Link>
      </header>

      {isLoading ? (
        <p className="mygm-careers__status" role="status">
          Loading your careers…
        </p>
      ) : errorMessage ? (
        <section className="mygm-careers__empty">
          <p role="alert">{errorMessage}</p>

          <button
            className="mygm-careers__button mygm-careers__button--secondary"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </section>
      ) : careers.length === 0 ? (
        <section className="mygm-careers__empty">
          <Gamepad2 size={40} aria-hidden="true" />

          <h2>Your first season starts here</h2>

          <p>
            You don't have any My GM careers yet. Create one to choose your
            brand, manager, and starting roster.
          </p>

          <Link
            className="mygm-careers__button mygm-careers__button--primary"
            to="/mygm/new"
          >
            <Plus size={18} aria-hidden="true" />
            Create your first career
          </Link>
        </section>
      ) : (
        <ul className="mygm-careers__list">
          {careers.map((career) => {
            const season = Math.floor((career.current_tick - 1) / 50) + 1;
            const week = ((career.current_tick - 1) % 50) + 1;

            return (
              <li className="career-card" key={career.id}>
                <div className="career-card__icon">
                  <Gamepad2 size={24} aria-hidden="true" />
                </div>

                <div className="career-card__details">
                  <h2>{career.name}</h2>
                  <p>
                    Season {season} · Week {week}
                  </p>
                </div>

                <Link
                  className="mygm-careers__button mygm-careers__button--secondary"
                  to={`/mygm/${career.id}`}
                  aria-label={`Continue ${career.name}`}
                >
                  Continue
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
