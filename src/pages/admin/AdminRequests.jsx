import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MqSelect from "../../components/MqSelect";
import { Tag, StatusBadge, EmptyState, ErrorNote, Loading } from "../../components/ui/Bits.jsx";
import * as adminApi from "../../api/admin";
import { CALL_TYPE_LABELS, CALL_TYPE_INTENT } from "../../constants/taxonomy.js";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// admin's inbox, also the landing page since this is where the work actually starts
export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (next) => {
    setLoading(true);
    setError("");
    try {
      const { requests: r } = await adminApi.listRequests(next);
      setRequests(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [load, status]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">Requests</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Mentees waiting to be matched. Open one to see recommended mentors and shared times.
          </p>
        </div>
        <MqSelect
          id="request-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          menuAlign="right"
        />
      </header>

      <ErrorNote>{error}</ErrorNote>

      {loading ? (
        <Loading />
      ) : requests.length === 0 ? (
        <EmptyState
          title={status === "PENDING" ? "No pending requests" : "Nothing here"}
          hint={
            status === "PENDING"
              ? "When a mentee requests a call it will appear here for matching."
              : "Try a different status filter."
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                to={`/admin/requests/${r.id}`}
                className="mq-card block h-full p-4 transition-colors hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-50">{r.user.name}</p>
                    <p className="truncate text-xs text-ink-500">{r.user.email}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <p className="mt-3 text-sm font-medium text-ink-50">
                  {CALL_TYPE_LABELS[r.callType]}
                </p>
                <p className="text-[11px] text-ink-500">{CALL_TYPE_INTENT[r.callType]}</p>

                {r.notes && (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-400">
                    “{r.notes}”
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {r.user.domain && <Tag>{r.user.domain}</Tag>}
                  {r.user.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>

                <p className="mt-3 border-t border-white/[0.06] pt-2 text-[11px] text-ink-500">
                  {r.meeting
                    ? `Booked with ${r.meeting.mentor?.name}`
                    : `Requested ${timeAgo(r.createdAt)}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
