import { useCallback, useEffect, useState } from "react";
import Modal from "../../components/ui/Modal.jsx";
import { Tag, EmptyState, ErrorNote, Loading } from "../../components/ui/Bits.jsx";
import * as meetingsApi from "../../api/meetings";
import { CALL_TYPE_LABELS } from "../../constants/taxonomy.js";
import { formatDateLocal, formatTimeRange } from "../../utils/time";

// booked calls, past and upcoming. no cron job cleaning up old ones here on purpose -
// past bookings are useful history, not clutter to delete
export default function AdminMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      setMeetings(await meetingsApi.listMeetings());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmCancel() {
    setCancelling(true);
    setError("");
    try {
      await meetingsApi.deleteMeeting(toCancel.id);
      setToCancel(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.endTime) >= now);
  const past = meetings.filter((m) => new Date(m.endTime) < now);

  const Row = ({ m, isPast }) => (
    <li className={`mq-card p-4 ${isPast ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-50">{m.title}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            {formatDateLocal(m.startTime.slice(0, 10), "UTC")}{" "}
            {formatTimeRange(m.startTime, m.endTime, "UTC")} UTC
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.callType && <Tag>{CALL_TYPE_LABELS[m.callType]}</Tag>}
            {m.user && <Tag>Mentee: {m.user.name}</Tag>}
            {m.mentor && <Tag>Mentor: {m.mentor.name}</Tag>}
          </div>
        </div>
        {!isPast && (
          <button type="button" onClick={() => setToCancel(m)} className="mq-btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </li>
  );

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink-50">Booked calls</h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Cancelling a call re-opens its request for matching.
        </p>
      </header>

      <ErrorNote>{error}</ErrorNote>

      {meetings.length === 0 ? (
        <EmptyState
          title="No calls booked yet"
          hint="Open a pending request to see recommended mentors and book a shared slot."
        />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mq-label">Upcoming ({upcoming.length})</h2>
            {upcoming.length === 0 ? (
              <p className="text-xs text-ink-500">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((m) => (
                  <Row key={m.id} m={m} isPast={false} />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="mq-label">Past ({past.length})</h2>
              <ul className="space-y-3">
                {past.map((m) => (
                  <Row key={m.id} m={m} isPast />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <Modal
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        title="Cancel this call?"
        footer={
          <>
            <button type="button" onClick={() => setToCancel(null)} className="mq-btn-secondary">
              Keep it
            </button>
            <button type="button" onClick={confirmCancel} disabled={cancelling} className="mq-btn-primary">
              {cancelling ? "Cancelling…" : "Cancel call"}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink-400">
          {toCancel?.title} will be removed and its request returned to the pending queue.
        </p>
      </Modal>
    </div>
  );
}
