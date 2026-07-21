import { useEffect, useState } from "react";
import AvailabilityDashboard from "../components/AvailabilityDashboard";
import { Tag } from "../components/ui/Bits.jsx";
import * as profilesApi from "../api/profiles";
import * as meetingsApi from "../api/meetings";
import { formatDateLocal, formatTimeRange } from "../utils/time";

// read-only on purpose - mentor tags/description are admin-controlled, so there's
// just no save button here rather than a disabled one that looks broken
function MentorProfileCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profilesApi
      .getMyProfile()
      .then(({ profile: p }) => setProfile(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mq-card p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-ink-50">Your mentor profile</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          Maintained by the Mentorque team — contact an admin to change it.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : !profile ? (
        <p className="text-sm text-ink-500">No profile has been set up yet.</p>
      ) : (
        <div className="space-y-4">
          {profile.headline && (
            <p className="text-sm font-medium text-ink-50">{profile.headline}</p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="mq-label mb-1">Company</dt>
              <dd className="text-ink-400">{profile.company || "—"}</dd>
            </div>
            <div>
              <dt className="mq-label mb-1">Domain</dt>
              <dd className="text-ink-400">{profile.domain || "—"}</dd>
            </div>
          </dl>

          {profile.tags?.length > 0 && (
            <div>
              <span className="mq-label">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {profile.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
          )}

          {profile.description && (
            <div>
              <span className="mq-label">Description</span>
              <p className="text-xs leading-relaxed text-ink-400">{profile.description}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function UpcomingCalls() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    meetingsApi.listMeetings().then(setMeetings).catch(() => {});
  }, []);

  const upcoming = meetings.filter((m) => new Date(m.endTime) >= new Date());

  return (
    <section className="mq-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink-50">Upcoming calls</h2>
      {upcoming.length === 0 ? (
        <p className="text-xs text-ink-500">
          Nothing booked yet. Keep your availability current and an admin will schedule you.
        </p>
      ) : (
        <ul className="space-y-2">
          {upcoming.map((m) => (
            <li key={m.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
              <p className="text-sm font-medium text-ink-50">{m.title}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {formatDateLocal(m.startTime.slice(0, 10), "UTC")}{" "}
                {formatTimeRange(m.startTime, m.endTime, "UTC")} · with {m.user?.name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function MentorDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-50">Mentor dashboard</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Keep your weekly availability accurate — admins book calls into the time you mark here.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <AvailabilityDashboard role="MENTOR" embedded />
        </div>
        <div className="space-y-6">
          <UpcomingCalls />
          <MentorProfileCard />
        </div>
      </div>
    </div>
  );
}
