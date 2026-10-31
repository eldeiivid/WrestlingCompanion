import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import AuthLayout from "../components/AuthLayout";
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

  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);

  const isSubmitting = pending !== null;

  useEffect(() => {
    if (confirmationSent) {
      confirmationHeadingRef.current?.focus();
    }
  }, [confirmationSent]);

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
        username: username.trim(),
        email: email.trim(),
        password,
      });

      // App handles navigation when a session is returned.
      if (!session) {
        setConfirmationSent(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error: unknown) {
      setErrorMessage(getRegistrationError(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        {confirmationSent ? (
          <>
            <header className="auth-form__heading">
              <p className="auth-form__eyebrow">One more step</p>

              <h1
                ref={confirmationHeadingRef}
                id="registration-confirmation-title"
                tabIndex={-1}
              >
                Check your inbox.
              </h1>

              <p>Your next chapter is almost ready.</p>
            </header>

            <section
              className="register-confirmation"
              aria-labelledby="registration-confirmation-title"
            >
              <div className="register-confirmation__icon" aria-hidden="true">
                <Mail size={30} strokeWidth={1.5} />
              </div>

              <p role="status">
                If registration can proceed, you will receive a confirmation
                link at <strong>{email.trim()}</strong>.
              </p>

              <p className="register-confirmation__hint">
                Open the link to confirm your email, then return to sign in.
                Check your spam folder if you cannot find it.
              </p>

              <Link className="auth-form__submit" to="/login">
                Back to sign in
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </section>
          </>
        ) : (
          <>
            <header className="auth-form__heading">
              <p className="auth-form__eyebrow">Start your story</p>

              <h1 id="register-title">Make it your own.</h1>

              <p>Create your account and give your wrestling careers a home.</p>
            </header>

            <form
              onSubmit={handleSubmit}
              aria-labelledby="register-title"
              aria-describedby={errorMessage ? "register-error" : undefined}
              aria-busy={isSubmitting}
            >
              <div className="auth-form__fields">
                <div className="auth-form__field">
                  <label htmlFor="register-username">Username</label>

                  <div className="auth-form__input-wrapper">
                    <UserRound size={18} aria-hidden="true" />

                    <input
                      id="register-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Choose your username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      minLength={3}
                      maxLength={40}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form__field">
                  <label htmlFor="register-email">Email address</label>

                  <div className="auth-form__input-wrapper">
                    <Mail size={18} aria-hidden="true" />

                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form__field">
                  <label htmlFor="register-password">Password</label>

                  <div className="auth-form__input-wrapper">
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
                      className="auth-form__password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isSubmitting}
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

                <div className="auth-form__field">
                  <label htmlFor="register-confirm-password">
                    Confirm password
                  </label>

                  <div className="auth-form__input-wrapper">
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
              </div>

              {errorMessage && (
                <p
                  className="auth-form__error"
                  id="register-error"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}

              <button
                className="auth-form__submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className="auth-form__spinner"
                      size={18}
                      aria-hidden="true"
                    />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="auth-form__footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
