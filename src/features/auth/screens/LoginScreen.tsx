import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import "./LoginScreen.scss";

function getLoginError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    switch (error.code) {
      case "invalid_credentials":
        return "Incorrect email or password.";

      case "email_not_confirmed":
        return "Please confirm your email before signing in.";

      case "over_request_rate_limit":
        return "Too many attempts. Please wait a moment and try again.";
    }
  }

  return "Unable to sign in. Check your connection and try again.";
}

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = pending !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setPending("email");

    try {
      await signIn({ email, password });
      // App changes screens when AuthProvider receives the session.
    } catch (error) {
      setErrorMessage(getLoginError(error));
    } finally {
      setPending(null);
    }
  }

  async function handleGoogleSignIn() {
    if (isSubmitting) return;

    setErrorMessage("");
    setPending("google");

    try {
      await signInWithGoogle();
    } catch {
      setErrorMessage("Unable to start Google sign-in. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="login">
      <section className="login__intro">
        <p className="login__brand">
          Wrestling<span>Companion</span>
        </p>

        <div className="login__intro-content">
          <p className="login__eyebrow">WWE 2K26 Companion</p>

          <h1>
            Your brand.
            <br />
            Your story.
          </h1>

          <p>
            Manage your roster, plan your shows, and track your career history.
          </p>
        </div>
      </section>

      <section className="login__panel" aria-labelledby="login-title">
        <div className="login__form-container">
          <header className="login__heading">
            <h2 id="login-title">Sign in</h2>
            <p>Continue your career in WrestlingCompanion.</p>
          </header>

          <button
            className="login__button login__button--secondary"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <span className="login__google-icon" aria-hidden="true">
              G
            </span>

            {pending === "google" ? "Opening Google…" : "Continue with Google"}
          </button>

          <div className="login__divider">
            <span>or with your email</span>
          </div>

          <form onSubmit={handleSubmit} aria-busy={pending === "email"}>
            <div className="login__field">
              <label htmlFor="login-email">Email address</label>

              <div className="login__input-wrapper">
                <Mail size={18} aria-hidden="true" />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="login__field">
              <label htmlFor="login-password">Password</label>

              <div className="login__input-wrapper">
                <LockKeyhole size={18} aria-hidden="true" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                />

                <button
                  className="login__password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="login__error" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              className="login__button login__button--primary"
              type="submit"
              disabled={isSubmitting}
            >
              {pending === "email" ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="login__account-link">
            Don't have an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
