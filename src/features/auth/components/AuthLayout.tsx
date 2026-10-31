import type { ReactNode } from "react";
import { CalendarDays, Trophy, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import brandLogo from "../../../assets/brand/logo-dark-background.svg";
import brandSymbol from "../../../assets/brand/symbol-violet.svg";

import "./AuthLayout.scss";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <header className="auth-layout__header">
        <Link
          className="auth-layout__brand"
          to="/"
          aria-label="WrestlingBook home"
        >
          <img src={brandLogo} alt="" />
        </Link>

        <span className="auth-layout__header-caption">
          Your wrestling story, organized.
        </span>
      </header>

      <main className="auth-layout__main">
        <aside className="auth-layout__story" aria-label="About WrestlingBook">
          <div className="auth-layout__story-copy">
            <p className="auth-layout__eyebrow">A home for your career</p>

            <h2>
              Every rivalry.
              <br />
              Every reign.
              <br />
              <span>Your story.</span>
            </h2>

            <p className="auth-layout__description">
              From your first draft to your biggest main event. Keep your
              wrestling world together in WrestlingBook.
            </p>
          </div>

          <div className="auth-layout__art" aria-hidden="true">
            <div className="auth-layout__halo" />

            <img src={brandSymbol} alt="" />
          </div>

          <ul className="auth-layout__features" aria-label="Career tools">
            <li>
              <UsersRound size={17} aria-hidden="true" />
              Your roster
            </li>

            <li>
              <CalendarDays size={17} aria-hidden="true" />
              Your shows
            </li>

            <li>
              <Trophy size={17} aria-hidden="true" />
              Your legacy
            </li>
          </ul>
        </aside>

        <section className="auth-layout__panel">
          <div className="auth-layout__form-container">{children}</div>
        </section>
      </main>

      <footer className="auth-layout__footer">
        Built for the stories you create.
      </footer>
    </div>
  );
}
