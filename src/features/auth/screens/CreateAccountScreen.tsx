import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import "./CreateAccountScreen.scss";

function getRegistrationError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return "An account with this email already exists.";

      case "weak_password":
        return "Please choose a stronger password.";

      case "email_address_invalid":
        return "Please enter a valid email address.";

      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return "Too many attempts. Please wait a moment and try again.";
    }
  }

  return "Unable to create your account. Please try again.";
}

export default function CreateAccountScreen() {
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<"email" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  const isSubmitting = pending !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");

    if (username.trim().length < 3) {
      setErrorMessage("Your username must contain at least 3 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Your passwords do not match.");
      return;
    }

    setPending("email");

    try {
      const { session } = await signUp({
        username,
        email,
        password,
      });

      // With email confirmation disabled, App redirects using the new session.
      if (!session) {
        setConfirmationSent(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      setErrorMessage(getRegistrationError(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="login login--register">
      <section className="login__intro">
        <p className="login__brand">
          Wrestling<span>Companion</span>
        </p>

        <div className="login__intro-content">
          <p className="login__eyebrow">WWE 2K26 Companion</p>

          <h1>
            Start your career.
            <br />
            Build your story.
          </h1>

          <p>
            Create your account and keep your wrestling careers in one place.
          </p>
        </div>
      </section>

      <section className="login__panel" aria-labelledby="register-title">
        <div className="login__form-container">
          <header className="login__heading">
            <h2 id="register-title">Create account</h2>
            <p>Your next chapter starts here.</p>
          </header>

          {confirmationSent ? (
            <div className="register__confirmation" role="status">
              <Mail size={28} aria-hidden="true" />

              <h3>Check your email</h3>

              <p>
                If registration can proceed, you will receive a confirmation
                link at <strong>{email.trim()}</strong>. Check your inbox and
                spam folder.
              </p>

              <Link
                className="login__button login__button--primary"
                to="/login"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="login__divider">
                <span>or with your email</span>
              </div>

              <form onSubmit={handleSubmit} aria-busy={pending === "email"}>
                <div className="login__field">
                  <label htmlFor="register-username">Username</label>

                  <div className="login__input-wrapper">
                    <UserRound size={18} aria-hidden="true" />

                    <input
                      id="register-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      placeholder="Your username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      minLength={3}
                      maxLength={40}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="login__field">
                  <label htmlFor="register-email">Email address</label>

                  <div className="login__input-wrapper">
                    <Mail size={18} aria-hidden="true" />

                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="login__field">
                  <label htmlFor="register-password">Password</label>

                  <div className="login__input-wrapper">
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      id="register-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      disabled={isSubmitting}
                      required
                    />

                    <button
                      className="login__password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide passwords" : "Show passwords"
                      }
                      aria-controls="register-password register-confirm-password"
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

                <div className="login__field">
                  <label htmlFor="register-confirm-password">
                    Confirm password
                  </label>

                  <div className="login__input-wrapper">
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      id="register-confirm-password"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      minLength={8}
                      disabled={isSubmitting}
                      required
                    />
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
                  {pending === "email" ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="register__footer">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
