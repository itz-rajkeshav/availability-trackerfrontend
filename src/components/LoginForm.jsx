import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MentorqueBrand from "./MentorqueLogo";
import { ROLE, ROLE_LOGIN_PATH, homePathFor } from "../constants/roles.js";
import { ErrorNote } from "./ui/Bits.jsx";

const COPY = {
  [ROLE.USER]: {
    title: "Sign in as a mentee",
    blurb: "Set your availability and request a mentoring call.",
  },
  [ROLE.MENTOR]: {
    title: "Sign in as a mentor",
    blurb: "Keep your weekly availability up to date.",
  },
  [ROLE.ADMIN]: {
    title: "Sign in as an admin",
    blurb: "Review requests, match mentors and book calls.",
  },
};

const OTHER_ROLES = {
  [ROLE.USER]: [ROLE.MENTOR, ROLE.ADMIN],
  [ROLE.MENTOR]: [ROLE.USER, ROLE.ADMIN],
  [ROLE.ADMIN]: [ROLE.USER, ROLE.MENTOR],
};

const ROLE_WORD = { USER: "Mentee", MENTOR: "Mentor", ADMIN: "Admin" };

// shared login form used by all three pages. role gets sent as expectedRole so
// the server rejects it if you log in on the wrong page instead of just redirecting
export default function LoginForm({ role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const copy = COPY[role];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password, role);
      navigate(homePathFor(user.role), { replace: true });
    } catch (err) {
      // if it's a role mismatch the response tells us their actual role, so use that
      const actual = err?.data?.actualRole;
      setError(
        actual
          ? `${err.message} That address is registered as a ${ROLE_WORD[actual].toLowerCase()}.`
          : err.message || "Sign in failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mq-card p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <MentorqueBrand size="lg" className="mb-4" textClassName="font-bold text-ink-50 tracking-tight" />
            <h1 className="text-xl font-semibold text-ink-50">{copy.title}</h1>
            <p className="mt-1 text-sm text-ink-500">{copy.blurb}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {params.get("expired") === "1" && !error && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
                Your session expired. Please sign in again.
              </div>
            )}
            <ErrorNote>{error}</ErrorNote>

            <div>
              <label htmlFor="email" className="mq-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mq-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mq-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mq-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={submitting} className="mq-btn-primary w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[0.08] pt-4 text-center text-xs text-ink-500">
            Not a {ROLE_WORD[role].toLowerCase()}?{" "}
            {OTHER_ROLES[role].map((other, i) => (
              <span key={other}>
                {i > 0 && " · "}
                <Link to={ROLE_LOGIN_PATH[other]} className="text-ink-400 underline hover:text-ink-50">
                  {ROLE_WORD[other]} sign in
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
