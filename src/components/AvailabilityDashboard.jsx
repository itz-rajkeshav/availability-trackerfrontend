import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import * as availabilityApi from "../api/availability";
import {
  getViewWeekDates,
  formatDateLocal,
  formatTimeLocal,
  formatTimeRange,
  slotToUTC,
  isPastDate,
  isPastDateTime,
} from "../utils/time";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (GMT+0)" },
  { value: "IST", label: "IST (GMT+5:30)" },
];

const ROLE_HEADINGS = {
  USER: "User Dashboard",
  MENTOR: "Mentor Dashboard",
};

export default function AvailabilityDashboard({ role = "USER" }) {
  const { user } = useAuth();
  const [displayTimezone, setDisplayTimezone] = useState(user?.timezone || "UTC");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current Mon–Sun week
  const [data, setData] = useState({ dates: [], availability: {} });
  const [loading, setLoading] = useState(!user); // only show loading if no user yet
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [error, setError] = useState("");
  const dragRef = useRef({ active: false, paintValue: false, visited: new Set() });

  useEffect(() => {
    const endDrag = () => {
      dragRef.current.active = false;
      dragRef.current.visited = new Set();
    };
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  const fetchWeekly = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const weekDates = getViewWeekDates(weekOffset);
      const res = await availabilityApi.getWeekly({ weekStart: weekDates[0] });
      setData(res);
      // DO NOT call setToggles({}) here
    } catch (e) {
      setError(e.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [weekOffset, user?.id]);

  useEffect(() => {
    setToggles({});
  }, [weekOffset]);

  useEffect(() => {
    if (user) fetchWeekly();
  }, [fetchWeekly]);

  const isSlotEnabled = (dateStr, hour) => {
    const key = `${dateStr}-${hour}`;
    if (toggles[key] !== undefined) return toggles[key];
    const slots = data.availability[dateStr] || [];
    const { startTime } = slotToUTC(dateStr, hour);
    return slots.some((s) => s.startTime.slice(0, 13) === startTime.slice(0, 13));
  };

  const isSlotDisabled = (dateStr, hour) => {
    if (isPastDate(dateStr)) return true;
    const utcTodayStr = new Date().toISOString().slice(0, 10);
    if (dateStr === utcTodayStr) {
      const { startTime } = slotToUTC(dateStr, hour);
      return isPastDateTime(startTime);
    }
    return false;
  };

  const gridDates = getViewWeekDates(weekOffset);
  const gridStart = gridDates[0];

  const slotKey = (dateStr, hour) => `${dateStr}-${hour}`;

  const startDrag = (dateStr, hour) => {
    if (isSlotDisabled(dateStr, hour)) return;
    const paintValue = !isSlotEnabled(dateStr, hour);
    const key = slotKey(dateStr, hour);
    dragRef.current = { active: true, paintValue, visited: new Set([key]) };
    setToggles((prev) => ({ ...prev, [key]: paintValue }));
  };

  const continueDrag = (dateStr, hour) => {
    const drag = dragRef.current;
    if (!drag.active || isSlotDisabled(dateStr, hour)) return;
    const key = slotKey(dateStr, hour);
    if (drag.visited.has(key)) return;
    drag.visited.add(key);
    setToggles((prev) => ({ ...prev, [key]: drag.paintValue }));
  };

  const toggleColumn = (dateStr) => {
    const actionable = HOURS.filter((h) => !isSlotDisabled(dateStr, h));
    if (actionable.length === 0) return;
    const allOn = actionable.every((h) => isSlotEnabled(dateStr, h));
    const next = !allOn;
    setToggles((prev) => {
      const updated = { ...prev };
      for (const h of actionable) updated[`${dateStr}-${h}`] = next;
      return updated;
    });
  };

  const toggleRow = (hour) => {
    const actionable = gridDates.filter((d) => !isSlotDisabled(d, hour));
    if (actionable.length === 0) return;
    const allOn = actionable.every((d) => isSlotEnabled(d, hour));
    const next = !allOn;
    setToggles((prev) => {
      const updated = { ...prev };
      for (const d of actionable) updated[`${d}-${hour}`] = next;
      return updated;
    });
  };

  const isColumnAllEnabled = (dateStr) => {
    const actionable = HOURS.filter((h) => !isSlotDisabled(dateStr, h));
    return actionable.length > 0 && actionable.every((h) => isSlotEnabled(dateStr, h));
  };

  const isRowAllEnabled = (hour) => {
    const actionable = gridDates.filter((d) => !isSlotDisabled(d, hour));
    return actionable.length > 0 && actionable.every((d) => isSlotEnabled(d, hour));
  };

  const hasActionableColumn = (dateStr) => HOURS.some((h) => !isSlotDisabled(dateStr, h));
  const hasActionableRow = (hour) => gridDates.some((d) => !isSlotDisabled(d, hour));

  const saveBatch = async () => {
    setSaving(true);
    setError("");
    const slots = [];
    gridDates.forEach((dateStr) => {
      HOURS.forEach((hour) => {
        const key = `${dateStr}-${hour}`;
        if (toggles[key] === undefined) return;
        const enabled = toggles[key];
        const { startTime, endTime } = slotToUTC(dateStr, hour);
        slots.push({
          date: dateStr,
          startTime,
          endTime,
          enabled,
        });
      });
    });
    if (slots.length === 0) {
      setSaving(false);
      return;
    }
    try {
      await availabilityApi.saveBatch(slots);
      await fetchWeekly();
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(toggles).length > 0;

  const prevWeek = () => {
    if (weekOffset === 0) return; // do not navigate into the past
    setWeekOffset((prev) => Math.max(0, prev - 1));
  };
  const nextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const cancelChanges = () => {
    setToggles({});
  };

  const formatTimeOptionLabel = (utcHourIndex) => {
    const startISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex, 0)).toISOString();
    const endISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex + 1, 0)).toISOString();
    const start = formatTimeLocal(startISO, displayTimezone);
    const end = formatTimeLocal(endISO, displayTimezone);
    return formatTimeRange(`${start} – ${end}`);
  };

  const heading = ROLE_HEADINGS[role] ?? ROLE_HEADINGS.USER;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-500">Availability</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink-50">{heading}</h1>
          <p className="mt-0.5 text-sm text-ink-500">Set when you&apos;re available for sessions.</p>
        </div>
        <div className="w-full sm:w-44 sm:shrink-0">
          <label className="mq-label">Timezone</label>
          <select
            value={displayTimezone}
            onChange={(e) => setDisplayTimezone(e.target.value)}
            className="mq-input"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <section className="mq-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink-50">Weekly grid</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              Click or drag to toggle. Day/time labels select a full row or column.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 lg:flex-1">
            <button
              type="button"
              onClick={prevWeek}
              disabled={weekOffset === 0}
              className="mq-btn-icon"
              aria-label="Previous week"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="min-w-[10rem] text-center text-sm font-medium text-ink-400">
              {formatDateLocal(gridStart, displayTimezone)}
              <span className="mx-1.5 text-ink-600">–</span>
              {formatDateLocal(gridDates[6], displayTimezone)}
            </span>
            <button type="button" onClick={nextWeek} className="mq-btn-icon" aria-label="Next week">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button type="button" onClick={cancelChanges} disabled={!hasChanges} className="mq-btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={saveBatch}
              disabled={saving || !hasChanges}
              className="mq-btn-primary"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>

        <div className="mq-scroll max-h-[60vh] overflow-auto">
          {loading ? (
            <div className="p-16 text-center text-sm text-ink-500">Loading…</div>
          ) : (
            <table className="w-full table-fixed border-collapse select-none">
              <colgroup>
                <col style={{ width: "11rem" }} />
                {gridDates.map((d) => (
                  <col key={d} />
                ))}
              </colgroup>
              <thead className="sticky top-0 z-10 bg-navy-800/80 backdrop-blur-md">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-ink-500 whitespace-nowrap">
                    Time
                  </th>
                  {gridDates.map((d) => {
                    const colActive = isColumnAllEnabled(d);
                    const colActionable = hasActionableColumn(d);
                    return (
                      <th key={d} className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleColumn(d)}
                          disabled={!colActionable}
                          title={colActionable ? "Toggle all slots this day" : undefined}
                          className={`
                            w-full rounded-md px-1 py-1.5 text-xs font-semibold transition
                            ${!colActionable
                              ? "cursor-not-allowed text-ink-600"
                              : "cursor-pointer hover:bg-white/[0.04]"}
                            ${colActionable && colActive ? "text-emerald-400" : ""}
                            ${colActionable && !colActive ? "text-ink-50" : ""}
                          `}
                        >
                          {formatDateLocal(d, displayTimezone)}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {HOURS.map((hour) => {
                  const rowActive = isRowAllEnabled(hour);
                  const rowActionable = hasActionableRow(hour);
                  return (
                  <tr key={hour}>
                    <td className="px-1 py-1 align-middle">
                      <button
                        type="button"
                        onClick={() => toggleRow(hour)}
                        disabled={!rowActionable}
                        title={rowActionable ? "Toggle all slots this hour" : undefined}
                        className={`
                          w-full rounded-md px-2 py-1.5 text-left text-xs font-medium whitespace-nowrap transition
                          ${!rowActionable
                            ? "cursor-not-allowed text-ink-600"
                            : "cursor-pointer hover:bg-white/[0.04]"}
                          ${rowActionable && rowActive ? "text-emerald-400" : ""}
                          ${rowActionable && !rowActive ? "text-ink-400" : ""}
                        `}
                      >
                        {formatTimeOptionLabel(hour)}
                      </button>
                    </td>
                    {gridDates.map((dateStr) => {
                      const enabled = isSlotEnabled(dateStr, hour);
                      const disabled = isSlotDisabled(dateStr, hour);
                      return (
                        <td key={dateStr} className="p-0.5 align-middle">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              startDrag(dateStr, hour);
                            }}
                            onMouseEnter={() => continueDrag(dateStr, hour)}
                            disabled={disabled}
                            aria-label={
                              disabled
                                ? "Past slot"
                                : enabled
                                  ? "Available, click to remove"
                                  : "Unavailable, click to mark available"
                            }
                            className={`
                              mq-slot
                              ${!disabled ? "cursor-pointer" : ""}
                              ${disabled ? "mq-slot-past cursor-not-allowed" : ""}
                              ${!disabled && enabled ? "mq-slot-on" : ""}
                              ${!disabled && !enabled ? "mq-slot-off" : ""}
                            `}
                          />
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
