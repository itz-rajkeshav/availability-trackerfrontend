// small presentational bits shared across the three dashboards

import { REQUEST_STATUS_LABELS } from "../../constants/taxonomy.js";

export function Tag({ children, active = false, accent = false, onClick, title }) {
  const cls = ["mq-chip", active && "mq-chip-active", accent && "mq-chip-accent"]
    .filter(Boolean)
    .join(" ");
  if (!onClick) {
    return (
      <span className={cls} title={title}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }) {
  const cls = {
    PENDING: "mq-badge-pending",
    SCHEDULED: "mq-badge-scheduled",
    CANCELLED: "mq-badge-cancelled",
  }[status];
  return <span className={`mq-badge ${cls}`}>{REQUEST_STATUS_LABELS[status] ?? status}</span>;
}

export function EmptyState({ title, hint, icon = null }) {
  return (
    <div className="mq-card flex flex-col items-center justify-center p-12 text-center">
      {icon}
      <p className="text-sm font-medium text-ink-400">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
      {children}
    </div>
  );
}

export function SuccessNote({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
      {children}
    </div>
  );
}

export function Loading({ label = "Loading…" }) {
  return <div className="mq-card p-16 text-center text-sm text-ink-500">{label}</div>;
}

// tag picker, options come from a fixed list rather than free text
export function TagPicker({ options, value = [], onChange, disabled = false }) {
  const selected = new Set(value);
  const toggle = (tag) => {
    if (disabled) return;
    const next = new Set(selected);
    next.has(tag) ? next.delete(tag) : next.add(tag);
    onChange(options.filter((o) => next.has(o)));
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((tag) => (
        <Tag
          key={tag}
          active={selected.has(tag)}
          onClick={disabled ? undefined : () => toggle(tag)}
        >
          {tag}
        </Tag>
      ))}
    </div>
  );
}
