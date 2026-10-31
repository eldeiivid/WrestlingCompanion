import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

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
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<"email" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isSubmitting = pending !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setPending("email");

    try {
      await signIn({ email, password });
    } catch (error: unknown) {
      setErrorMessage(getLoginError(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <header className="auth-form__heading">
          <p className="auth-form__eyebrow">Your next chapter</p>

          <h1 id="login-title">Welcome back.</h1>

          <p>Sign in to pick up where your story left off.</p>
        </header>

        <form
          onSubmit={handleSubmit}
          aria-labelledby="login-title"
          aria-busy={isSubmitting}
        >
          <div className="auth-form__fields">
            <div className="auth-form__field">
              <label htmlFor="login-email">Email address</label>

              <div className="auth-form__input-wrapper">
                <Mail size={18} aria-hidden="true" />

                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
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
              <label htmlFor="login-password">Password</label>

              <div className="auth-form__input-wrapper">
                <LockKeyhole size={18} aria-hidden="true" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  required
                />

                <button
                  className="auth-form__password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isSubmitting}
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
          </div>

          {errorMessage && (
            <p className="auth-form__error" role="alert">
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
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="auth-form__footer">
          New to WrestlingBook? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
