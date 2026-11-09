import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Gamepad2, Plus, RotateCcw, Search, X } from "lucide-react";

import { useAuth } from "../../auth/hooks/useAuth";
import { useMyGmCareers } from "../hooks/useMyGmCareers";
import MyGmCareerCard from "../components/careers/MyGmCareerCard";

import brandLogo from "../../../assets/brand/logo-flat-gold.svg";

import "./MyGmCareersScreen.scss";

export default function MyGmCareersScreen() {
  const { user } = useAuth();

  const { careers, isLoading, errorMessage, retry } = useMyGmCareers(user?.id);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState("newest");
  const query = search.trim().toLocaleLowerCase();
  const visibleCareers = careers.filter(career =>
    [career.name, career.brand_name, career.manager_name].some(value => value?.toLocaleLowerCase().includes(query)),
  );
  if (sort === "name") visibleCareers.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mygm-careers">
      <header className="mygm-careers__topbar">
        <div className="mygm-careers__topbar-inner">
          <Link
            className="mygm-careers__brand"
            to="/"
            aria-label="Wrestling Book home"
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

            <h1>Your careers.<br />{" "}<span>Your legacy.</span></h1>

            <p className="mygm-careers__description">
              Pick up where your story left off, or build something new.
              Your brands and biggest moments live here.
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
              <span className="mygm-careers__count" role="status">
                {careers.length} {careers.length === 1 ? "career" : "careers"}
              </span>
            )}
          </header>

          {!isLoading && !errorMessage && careers.length > 0 && (
            <div className="mygm-careers__tools">
              <div className="mygm-careers__search">
                <Search size={18} aria-hidden="true" />
                <input ref={searchRef} type="search" aria-label="Search careers by name, brand or manager" placeholder="Search careers, brands or GMs" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} />
                {search && <button type="button" aria-label="Clear career search" onClick={() => { setSearch(""); searchRef.current?.focus(); }}><X size={16} aria-hidden="true" /></button>}
              </div>
              <label className="mygm-careers__sort">
                <span>Sort by</span>
                <select value={sort} onChange={event => setSort(event.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
            </div>
          )}
          {!isLoading && !errorMessage && careers.length > 0 && query && (
            <p className="mygm-careers__results" role="status">{visibleCareers.length} of {careers.length} careers match your search.</p>
          )}

          {isLoading ? (
            <>
              <p className="mygm-careers__status" role="status">
                Loading your careers…
              </p>

              <div className="mygm-careers__list" aria-hidden="true">
                {[0, 1, 2].map(index => (
                  <div className="mygm-careers__skeleton" key={index}><div /><span /><span /><span /></div>
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
          ) : visibleCareers.length === 0 ? (
            <div className="mygm-careers__empty">
              <span className="mygm-careers__empty-icon"><Search size={28} aria-hidden="true" /></span>
              <h3>No matching careers.</h3>
              <p>Try a different career name, brand or General Manager.</p>
              <button className="mygm-careers__button mygm-careers__button--secondary" type="button" onClick={() => { setSearch(""); searchRef.current?.focus(); }}>Clear search</button>
            </div>
          ) : (
            <ul className="mygm-careers__list">
              {visibleCareers.map((career, index) => (
                <MyGmCareerCard key={career.id} career={career} index={index} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
