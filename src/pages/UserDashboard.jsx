import { useCallback, useEffect, useState } from "react";
import AvailabilityDashboard from "../components/AvailabilityDashboard";
import MqSelect from "../components/MqSelect";
import { Tag, TagPicker, StatusBadge, ErrorNote, SuccessNote } from "../components/ui/Bits.jsx";
import * as profilesApi from "../api/profiles";
import * as requestsApi from "../api/requests";
import * as meetingsApi from "../api/meetings";
import { DOMAINS, USER_TAGS, CALL_TYPES, CALL_TYPE_LABELS, CALL_TYPE_BLURB } from "../constants/taxonomy.js";
import { formatTimeRange, formatDateLocal } from "../utils/time";

// mentee's own description + tags, this is what the matching engine actually reads
function ProfileCard() {
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    profilesApi
      .getMyProfile()
      .then(({ profile }) => {
        if (cancelled || !profile) return;
        setDescription(profile.description || "");
        setDomain(profile.domain || "");
        setTags(profile.tags || []);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await profilesApi.updateMyProfile({ description, domain, tags });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mq-card p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-ink-50">Your profile</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          Used to match you with a mentor. The more specific you are, the better the match.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : (
        <div className="space-y-4">
          <ErrorNote>{error}</ErrorNote>
          {saved && <SuccessNote>Profile saved.</SuccessNote>}

          <MqSelect
            id="profile-domain"
            label="Domain"
            value={domain}
            onChange={setDomain}
            placeholder="Select domain…"
            options={DOMAINS.map((d) => ({ value: d, label: d }))}
            className="relative w-full min-w-0"
          />

          <div>
            <span className="mq-label">Tags</span>
            <TagPicker options={USER_TAGS} value={tags} onChange={setTags} />
          </div>

          <div>
            <label htmlFor="profile-description" className="mq-label">
              About you
            </label>
            <textarea
              id="profile-description"
              className="mq-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on, and what do you want help with?"
            />
          </div>

          <button type="button" onClick={save} disabled={saving} className="mq-btn-primary w-full">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      )}
    </section>
  );
}

/** Request a call. Users request; only an admin books. */
function RequestsCard() {
  const [requests, setRequests] = useState([]);
  const [callType, setCallType] = useState(CALL_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { requests: r } = await requestsApi.listMyRequests();
      setRequests(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await requestsApi.createRequest({ callType, notes });
      setNotes("");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(id) {
    setError("");
    try {
      await requestsApi.cancelRequest(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="mq-card p-5">
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-ink-50">Request a call</h2>
        <p className="mt-0.5 text-xs text-ink-500">
          An admin reviews your request, picks a mentor and books a time you are both free.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        <ErrorNote>{error}</ErrorNote>

        <div>
          <span className="mq-label">Call type</span>
          <div className="space-y-1.5">
            {CALL_TYPES.map((type) => (
              <label
                key={type}
                className={`flex cursor-pointer gap-2.5 rounded-lg border p-2.5 transition-colors ${
                  callType === type
                    ? "border-white/25 bg-white/[0.07]"
                    : "border-white/[0.08] hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="callType"
                  value={type}
                  checked={callType === type}
                  onChange={() => setCallType(type)}
                  className="mt-0.5 accent-white"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-50">
                    {CALL_TYPE_LABELS[type]}
                  </span>
                  <span className="block text-xs leading-snug text-ink-500">
                    {CALL_TYPE_BLURB[type]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="request-notes" className="mq-label">
            What do you need help with?
          </label>
          <textarea
            id="request-notes"
            className="mq-textarea"
            style={{ minHeight: "5rem" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything specific the mentor should know beforehand."
          />
        </div>

        <button type="submit" disabled={submitting} className="mq-btn-primary w-full">
          {submitting ? "Submitting…" : "Submit request"}
        </button>
      </form>

      <div className="mt-5 border-t border-white/[0.08] pt-4">
        <h3 className="mq-label">Your requests</h3>
        {loading ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-xs text-ink-500">No requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-50">
                    {CALL_TYPE_LABELS[r.callType]}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
                {r.meeting ? (
                  <p className="mt-1.5 text-xs text-emerald-300">
                    Booked with {r.meeting.mentor?.name} —{" "}
                    {formatDateLocal(r.meeting.startTime.slice(0, 10), "UTC")}{" "}
                    {formatTimeRange(r.meeting.startTime, r.meeting.endTime, "UTC")}
                  </p>
                ) : r.status === "PENDING" ? (
                  <button
                    type="button"
                    onClick={() => cancel(r.id)}
                    className="mt-1.5 text-xs text-ink-500 underline hover:text-ink-50"
                  >
                    Cancel request
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function UpcomingCalls() {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    meetingsApi.listMeetings().then(setMeetings).catch(() => {});
  }, []);

  const upcoming = meetings.filter((m) => new Date(m.endTime) >= new Date());
  if (upcoming.length === 0) return null;

  return (
    <section className="mq-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink-50">Upcoming calls</h2>
      <ul className="space-y-2">
        {upcoming.map((m) => (
          <li key={m.id} className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
            <p className="text-sm font-medium text-ink-50">{m.title}</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {formatDateLocal(m.startTime.slice(0, 10), "UTC")}{" "}
              {formatTimeRange(m.startTime, m.endTime, "UTC")} · with {m.mentor?.name}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function UserDashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-50">Your dashboard</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Mark when you are free, tell us what you need, and an admin will match you with a mentor.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <AvailabilityDashboard role="USER" embedded />
        </div>
        <div className="space-y-6">
          <UpcomingCalls />
          <RequestsCard />
          <ProfileCard />
        </div>
      </div>
    </div>
  );
}
