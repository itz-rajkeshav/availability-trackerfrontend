import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/ui/Modal.jsx";
import { Tag, StatusBadge, ErrorNote, Loading, EmptyState } from "../../components/ui/Bits.jsx";
import * as adminApi from "../../api/admin";
import { CALL_TYPE_LABELS, CALL_TYPE_INTENT } from "../../constants/taxonomy.js";
import { formatDateLocal } from "../../utils/time";

// score bar plus the reasons behind it - the whole point of this screen is showing your work
function MentorCard({ mentor, rank, selected, onSelect, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(mentor)}
      disabled={disabled}
      className={`mq-card w-full p-4 text-left transition-colors ${
        selected ? "ring-1 ring-white/30 bg-white/[0.07]" : "hover:bg-white/[0.06]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-50">
            {rank != null && <span className="text-ink-500">{rank}. </span>}
            {mentor.name}
          </p>
          <p className="truncate text-xs text-ink-500">
            {mentor.headline || mentor.company || mentor.domain}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-ink-50">
            {(mentor.score * 100).toFixed(0)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-ink-500">match</p>
        </div>
      </div>

      <div className="mq-meter mt-2.5">
        <div className="mq-meter-fill" style={{ width: `${Math.round(mentor.score * 100)}%` }} />
      </div>

      <ul className="mt-3 space-y-1">
        {mentor.reasons.map((r) => (
          <li key={r.code} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-400">
            <span aria-hidden className="mt-[3px] text-ink-500">
              ·
            </span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.domain && <Tag>{mentor.domain}</Tag>}
        {mentor.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
    </button>
  );
}

/** Cal.com-style day columns of shared free time. */
function OverlapPicker({ overlap, selectedSlot, onSelectSlot, loading }) {
  if (loading) return <Loading label="Finding shared times…" />;
  if (!overlap) return null;

  const daysWithSlots = overlap.days.filter((d) => d.slots.length > 0);

  if (daysWithSlots.length === 0) {
    return (
      <EmptyState
        title="No shared availability"
        hint={`${overlap.user.name} and ${overlap.mentor.name} have no overlapping free hours in this window.`}
      />
    );
  }

  return (
    <div className="mq-scroll flex gap-3 overflow-x-auto pb-2">
      {daysWithSlots.map((day) => (
        <div key={day.date} className="w-[104px] shrink-0">
          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {day.weekday}
            <span className="mt-0.5 block font-normal normal-case text-ink-400">
              {formatDateLocal(day.date, "UTC")}
            </span>
          </p>
          <div className="space-y-1.5">
            {day.slots.map((slot) => {
              const active = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors ${
                    active
                      ? "border-white/40 bg-white/[0.22] text-ink-50"
                      : "border-white/[0.1] bg-white/[0.04] text-ink-400 hover:bg-white/[0.09] hover:text-ink-50"
                  }`}
                >
                  {slot.startTime.slice(11, 16)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [overlap, setOverlap] = useState(null);
  const [overlapLoading, setOverlapLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.getRecommendations(requestId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  // auto-pick the top recommendation so there's something to book right away
  useEffect(() => {
    if (data?.recommended?.length && !selectedMentor) setSelectedMentor(data.recommended[0]);
  }, [data, selectedMentor]);

  useEffect(() => {
    if (!selectedMentor || !data) return;
    let cancelled = false;
    setOverlapLoading(true);
    setSelectedSlot(null);
    adminApi
      .getOverlap({ userId: data.user.id, mentorId: selectedMentor.mentorId })
      .then((o) => !cancelled && setOverlap(o))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setOverlapLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedMentor, data]);

  async function confirmBooking() {
    setBooking(true);
    setError("");
    try {
      await adminApi.bookCall({
        requestId,
        mentorId: selectedMentor.mentorId,
        startTime: selectedSlot.startTime,
      });
      setConfirmOpen(false);
      navigate("/admin/meetings");
    } catch (e) {
      setError(e.message);
      setConfirmOpen(false);
      // someone else might've just booked this slot, reload so the picker is accurate
      load();
    } finally {
      setBooking(false);
    }
  }

  const alreadyScheduled = data?.request?.status === "SCHEDULED";

  if (loading) return <Loading label="Ranking mentors…" />;

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-[1600px] space-y-4">
        <ErrorNote>{error || "Request not found."}</ErrorNote>
        <Link to="/admin" className="mq-btn-secondary inline-flex">
          Back to requests
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <div>
        <Link to="/admin" className="text-xs text-ink-500 underline hover:text-ink-50">
          ← Back to requests
        </Link>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {/* Mentee requirement */}
      <section className="mq-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-ink-50">{data.user.name}</h1>
              <StatusBadge status={data.request.status} />
            </div>
            <p className="text-xs text-ink-500">{data.user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-ink-50">
              {CALL_TYPE_LABELS[data.request.callType]}
            </p>
            <p className="text-[11px] text-ink-500">{CALL_TYPE_INTENT[data.request.callType]}</p>
          </div>
        </div>

        {data.request.notes && (
          <p className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-sm leading-relaxed text-ink-400">
            “{data.request.notes}”
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.user.domain && <Tag>{data.user.domain}</Tag>}
          {data.user.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>

        {data.user.description && (
          <p className="mt-3 text-xs leading-relaxed text-ink-500">{data.user.description}</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Ranked mentors */}
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-50">Recommended mentors</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Ranked by profile similarity, {CALL_TYPE_INTENT[data.request.callType].toLowerCase()},
              and shared availability.
              {!data.embeddingAvailable && " (Semantic search unavailable — using rules only.)"}
            </p>
          </div>

          {data.recommended.map((m, i) => (
            <MentorCard
              key={m.mentorId}
              mentor={m}
              rank={i + 1}
              selected={selectedMentor?.mentorId === m.mentorId}
              onSelect={setSelectedMentor}
            />
          ))}

          {data.unavailable.length > 0 && (
            <div className="pt-2">
              <h3 className="mq-label">No shared availability</h3>
              <div className="space-y-3">
                {data.unavailable.map((m) => (
                  <MentorCard key={m.mentorId} mentor={m} disabled onSelect={() => {}} />
                ))}
              </div>
            </div>
          )}

          {data.recommended.length === 0 && data.unavailable.length === 0 && (
            <EmptyState title="No mentors found" hint="Add mentors and their availability first." />
          )}
        </div>

        {/* Overlap + booking */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-ink-50">
              {selectedMentor ? `Shared availability with ${selectedMentor.name}` : "Shared availability"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {overlap
                ? `${overlap.totalSlots} shared hour${overlap.totalSlots === 1 ? "" : "s"} over the next 14 days, in UTC.`
                : "Select a mentor to see when they and the mentee are both free."}
            </p>
          </div>

          {selectedMentor ? (
            <>
              <OverlapPicker
                overlap={overlap}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                loading={overlapLoading}
              />

              <div className="mq-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 text-xs text-ink-500">
                  {alreadyScheduled ? (
                    "This request has already been booked."
                  ) : selectedSlot ? (
                    <>
                      Booking{" "}
                      <span className="font-medium text-ink-50">
                        {formatDateLocal(selectedSlot.startTime.slice(0, 10), "UTC")}{" "}
                        {selectedSlot.startTime.slice(11, 16)}–{selectedSlot.endTime.slice(11, 16)} UTC
                      </span>{" "}
                      with {selectedMentor.name}
                    </>
                  ) : (
                    "Pick a time slot above to book."
                  )}
                </div>
                <button
                  type="button"
                  disabled={!selectedSlot || alreadyScheduled}
                  onClick={() => setConfirmOpen(true)}
                  className="mq-btn-primary"
                >
                  Book call
                </button>
              </div>
            </>
          ) : (
            <EmptyState title="Select a mentor" hint="Pick one from the ranked list to see shared times." />
          )}
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm booking"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} className="mq-btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={confirmBooking} disabled={booking} className="mq-btn-primary">
              {booking ? "Booking…" : "Confirm"}
            </button>
          </>
        }
      >
        {selectedSlot && selectedMentor && (
          <div className="space-y-2 text-sm text-ink-400">
            <p>
              <span className="text-ink-500">Call</span>{" "}
              {CALL_TYPE_LABELS[data.request.callType]}
            </p>
            <p>
              <span className="text-ink-500">Mentee</span> {data.user.name}
            </p>
            <p>
              <span className="text-ink-500">Mentor</span> {selectedMentor.name}
            </p>
            <p>
              <span className="text-ink-500">When</span>{" "}
              {formatDateLocal(selectedSlot.startTime.slice(0, 10), "UTC")}{" "}
              {selectedSlot.startTime.slice(11, 16)}–{selectedSlot.endTime.slice(11, 16)} UTC
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
