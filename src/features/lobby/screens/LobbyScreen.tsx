import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Globe2,
  LogOut,
  Swords,
  Trophy,
  UsersRound,
} from "lucide-react";

import { useAuth } from "../../auth/hooks/useAuth";

import brandLogo from "../../../assets/brand/logo-dark-background.svg";
import brandSymbol from "../../../assets/brand/symbol-violet.svg";

import "./LobbyScreen.scss";

export default function LobbyScreen() {
  const { user, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const username = user?.user_metadata?.username;
  const fullName = user?.user_metadata?.full_name;

  const displayName =
    typeof username === "string" && username.trim()
      ? username.trim()
      : typeof fullName === "string" && fullName.trim()
        ? fullName.trim()
        : "Manager";

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    setErrorMessage("");

    try {
      await signOut();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="lobby">
      <header className="lobby__header">
        <div className="lobby__header-inner">
          <Link className="lobby__brand" to="/" aria-label="WrestlingBook home">
            <img src={brandLogo} alt="" />
          </Link>

          <div className="lobby__account">
            <span className="lobby__avatar" aria-hidden="true">
              {displayName.charAt(0).toUpperCase()}
            </span>

            <span className="lobby__username">{displayName}</span>

            <button
              className="lobby__icon-button"
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label={isSigningOut ? "Signing out" : "Sign out"}
              title="Sign out"
            >
              <LogOut size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="lobby__content">
        <section className="lobby__welcome" aria-labelledby="lobby-title">
          <p className="lobby__eyebrow">Welcome back, {displayName}</p>

          <h1 id="lobby-title">
            Every career.
            <br />
            <span>A story worth keeping.</span>
          </h1>

          <p className="lobby__description">
            Your roster, your rivalries, your biggest moments. Choose a mode and
            write your next chapter.
          </p>
        </section>

        {errorMessage && (
          <p className="lobby__error" role="alert">
            {errorMessage}
          </p>
        )}

        <section
          className="lobby__mode-section"
          aria-labelledby="lobby-modes-title"
        >
          <header className="lobby__section-header">
            <h2 id="lobby-modes-title">Choose your mode</h2>
            <span>WWE 2K26</span>
          </header>

          <div className="lobby__modes">
            <article
              className="mode-card mode-card--active"
              aria-labelledby="mygm-mode-title"
            >
              <div className="mode-card__topline">
                <span className="mode-card__eyebrow">Career management</span>

                <span className="mode-card__status">
                  <Check size={13} aria-hidden="true" />
                  Available
                </span>
              </div>

              <div className="mode-card__art" aria-hidden="true">
                <img src={brandSymbol} alt="" />
              </div>

              <div className="mode-card__content">
                <span className="mode-card__edition">01</span>

                <h3 id="mygm-mode-title">MyGM</h3>

                <p>
                  Build a brand that leaves a legacy. Draft your roster, book
                  the card and make every season count.
                </p>
              </div>

              <ul className="mode-card__features" aria-label="MyGM features">
                <li>
                  <UsersRound size={16} aria-hidden="true" />
                  Roster
                </li>

                <li>
                  <CalendarDays size={16} aria-hidden="true" />
                  Booking
                </li>

                <li>
                  <Trophy size={16} aria-hidden="true" />
                  Records
                </li>
              </ul>

              <Link className="mode-card__action" to="/mygm">
                Explore MyGM
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
            </article>

            <article
              className="mode-card mode-card--upcoming"
              aria-labelledby="universe-mode-title"
            >
              <div className="mode-card__topline">
                <span className="mode-card__eyebrow">Creative sandbox</span>

                <span className="mode-card__status mode-card__status--muted">
                  Coming soon
                </span>
              </div>

              <div className="mode-card__art" aria-hidden="true">
                <Globe2 strokeWidth={0.7} />
              </div>

              <div className="mode-card__content">
                <span className="mode-card__edition">02</span>

                <h3 id="universe-mode-title">Universe</h3>

                <p>
                  A world built around your imagination. Shape your brands,
                  create rivalries and tell stories on your terms.
                </p>
              </div>

              <ul
                className="mode-card__features"
                aria-label="Planned Universe features"
              >
                <li>
                  <Globe2 size={16} aria-hidden="true" />
                  Brands
                </li>

                <li>
                  <Swords size={16} aria-hidden="true" />
                  Rivalries
                </li>
              </ul>

              <p className="mode-card__upcoming-note">
                Your next universe is on the horizon.
              </p>
            </article>
          </div>
        </section>

        <footer className="lobby__footer">
          <img src={brandSymbol} alt="" aria-hidden="true" />
          <p>Your stories. All in one book.</p>
        </footer>
      </main>
    </div>
  );
}
