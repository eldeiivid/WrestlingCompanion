import type { ReactNode } from "react";
import { CalendarDays, Trophy, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import brandLogo from "../../../assets/brand/logo-satin-gold.svg";
import brandSymbol from "../../../assets/brand/symbol-satin-gold.svg";

import "./AuthLayout.scss";

interface AuthLayoutProps {
  children: ReactNode;
  mode: "login" | "register";
}

export default function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <header className="auth-layout__header">
        <Link
          className="auth-layout__brand"
          to="/"
          aria-label="Wrestling Book home"
        >
          <img src={brandLogo} alt="" />
        </Link>

        <span className="auth-layout__header-caption">
          Your wrestling story, organized.
        </span>
      </header>

      <main className="auth-layout__main">
        <aside className="auth-layout__story" aria-label="About Wrestling Book">
          <div className="auth-layout__story-copy">
            <p className="auth-layout__eyebrow"><span aria-hidden="true" /> Your career. Center stage.</p>

            <h2>
              Every rivalry.
              <br />{" "}
              Every reign.
              <br />{" "}
              <span>Your story.</span>
            </h2>

            <p className="auth-layout__description">
              From your first draft to your biggest main event. Keep your
              wrestling world together in Wrestling Book.
            </p>
          </div>

          <div className="auth-layout__art" aria-hidden="true">
            <img src={brandSymbol} alt="" />
            <span>Built for your next main event.</span>
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
          <div className="auth-layout__form-container" key={mode}>{children}</div>
        </section>
      </main>

      <footer className="auth-layout__footer">
        Built for the stories you create.
      </footer>
    </div>
  );
}
