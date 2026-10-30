import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gamepad2, Globe2, LogOut, Settings } from "lucide-react";

import { useAuth } from "../../auth/hooks/useAuth";
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
    <main className="lobby">
      <header className="lobby__header">
        <Link
          className="lobby__brand"
          to="/"
          aria-label="WrestlingCompanion home"
        >
          Wrestling<span>Companion</span>
        </Link>

        <div className="lobby__account">
          <span className="lobby__avatar" aria-hidden="true">
            {displayName.charAt(0).toUpperCase()}
          </span>

          <span className="lobby__username">{displayName}</span>

          <button
            className="lobby__icon-button"
            type="button"
            aria-label="Account settings"
            title="Account settings"
            disabled
          >
            <Settings size={20} aria-hidden="true" />
          </button>

          <button
            className="lobby__icon-button"
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label={isSigningOut ? "Signing out" : "Sign out"}
            title="Sign out"
          >
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="lobby__content">
        <section className="lobby__welcome">
          <p className="lobby__eyebrow">Your next chapter</p>
          <h1>Welcome, {displayName}.</h1>
          <p>Choose your mode and build your wrestling story.</p>
        </section>

        {errorMessage && (
          <p className="lobby__error" role="alert">
            {errorMessage}
          </p>
        )}

        <section className="lobby__modes" aria-label="Game modes">
          <article className="mode-card mode-card--active">
            <div className="mode-card__icon">
              <Gamepad2 size={32} aria-hidden="true" />
            </div>

            <div className="mode-card__content">
              <p className="mode-card__eyebrow">Manage your brand</p>
              <h2>My GM</h2>
              <p>
                Build your roster, book your shows, and guide your brand through
                every season.
              </p>
            </div>

            <Link className="mode-card__action" to="/mygm">
              Enter My GM
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>

          <article className="mode-card mode-card--upcoming">
            <div className="mode-card__icon">
              <Globe2 size={32} aria-hidden="true" />
            </div>

            <div className="mode-card__content">
              <p className="mode-card__eyebrow">Create your universe</p>
              <h2>My Universe</h2>
              <p>
                Shape your brands, rivalries, and storylines in your own
                wrestling universe.
              </p>
            </div>

            <span className="mode-card__badge">Coming soon</span>
          </article>
        </section>
      </div>
    </main>
  );
}
