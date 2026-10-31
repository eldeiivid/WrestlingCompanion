import { Link } from "react-router-dom";
import { ArrowLeft, Gamepad2, Plus, RotateCcw } from "lucide-react";

import { useAuth } from "../../auth/hooks/useAuth";
import { useMyGmCareers } from "../hooks/useMyGmCareers";
import MyGmCareerCard from "../components/careers/MyGmCareerCard";

import brandLogo from "../../../assets/brand/logo-dark-background.svg";

import "./MyGmCareersScreen.scss";

export default function MyGmCareersScreen() {
  const { user } = useAuth();

  const { careers, isLoading, errorMessage, retry } = useMyGmCareers(user?.id);

  return (
    <div className="mygm-careers">
      <header className="mygm-careers__topbar">
        <div className="mygm-careers__topbar-inner">
          <Link
            className="mygm-careers__brand"
            to="/"
            aria-label="WrestlingBook home"
          >
            <img src={brandLogo} alt="" />
          </Link>

          <Link className="mygm-careers__back" to="/">
            <ArrowLeft size={17} aria-hidden="true" />
            Lobby
          </Link>
        </div>
      </header>

      <main className="mygm-careers__content">
        <header className="mygm-careers__header">
          <div>
            <p className="mygm-careers__eyebrow">MyGM · Career library</p>

            <h1>Your next chapter awaits.</h1>

            <p className="mygm-careers__description">
              Return to your brand or build a new legacy. Every career has its
              own story.
            </p>
          </div>

          <Link
            className="mygm-careers__button mygm-careers__button--primary"
            to="/mygm/new"
          >
            <Plus size={18} aria-hidden="true" />
            New career
          </Link>
        </header>

        <section
          className="mygm-careers__library"
          aria-labelledby="career-library-title"
          aria-busy={isLoading}
        >
          <header className="mygm-careers__section-header">
            <h2 id="career-library-title">Your careers</h2>

            {!isLoading && !errorMessage && (
              <span className="mygm-careers__count">
                {careers.length} {careers.length === 1 ? "career" : "careers"}
              </span>
            )}
          </header>

          {isLoading ? (
            <>
              <p className="mygm-careers__status" role="status">
                Loading your careers…
              </p>

              <div className="mygm-careers__list" aria-hidden="true">
                {careers.map((career, index) => (
                  <MyGmCareerCard
                    key={career.id}
                    career={career}
                    index={index}
                  />
                ))}
              </div>
            </>
          ) : errorMessage ? (
            <div className="mygm-careers__empty">
              <span className="mygm-careers__empty-icon">
                <RotateCcw size={28} aria-hidden="true" />
              </span>

              <h3>Let's try that again.</h3>

              <p role="alert">{errorMessage}</p>

              <button
                className="mygm-careers__button mygm-careers__button--secondary"
                type="button"
                onClick={retry}
              >
                <RotateCcw size={17} aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : careers.length === 0 ? (
            <div className="mygm-careers__empty">
              <span className="mygm-careers__empty-icon">
                <Gamepad2 size={32} aria-hidden="true" />
              </span>

              <h3>A new legacy starts with you.</h3>

              <p>
                Choose your brand, pick your manager and draft the roster that
                will write your first chapter.
              </p>

              <Link
                className="mygm-careers__button mygm-careers__button--primary"
                to="/mygm/new"
              >
                <Plus size={18} aria-hidden="true" />
                Create your first career
              </Link>
            </div>
          ) : (
            <ul className="mygm-careers__list">
              {careers.map((career) => (
                <MyGmCareerCard key={career.id} career={career} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
