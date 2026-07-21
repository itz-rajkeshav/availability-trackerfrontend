import { useEffect, useMemo, useState } from "react";
import MqSelect from "../../components/MqSelect";
import AvailabilityDashboard from "../../components/AvailabilityDashboard";
import { Tag, ErrorNote, Loading } from "../../components/ui/Bits.jsx";
import * as adminApi from "../../api/admin";

// lets an admin look at (and fix) any mentee's availability + profile
export default function AdminPeople() {
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminApi
      .listUsers()
      .then((list) => {
        if (cancelled) return;
        setUsers(list);
        setSelectedId(list[0]?.id ?? "");
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = users.find((u) => u.id === selectedId);

  const viewAs = useMemo(
    () =>
      selected
        ? {
            userId: selected.id,
            name: selected.name,
            email: selected.email,
            timezone: selected.timezone,
            role: "USER",
          }
        : null,
    [selected]
  );

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">Mentees</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            View and correct any mentee’s weekly availability.
          </p>
        </div>
        <MqSelect
          id="user-select"
          label="Mentee"
          value={selectedId}
          onChange={setSelectedId}
          options={users.map((u) => ({ value: u.id, label: u.name, title: u.email }))}
          menuAlign="right"
        />
      </header>

      <ErrorNote>{error}</ErrorNote>

      {selected && (
        <>
          <section className="mq-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-50">{selected.name}</p>
                <p className="text-xs text-ink-500">{selected.email}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selected.domain && <Tag>{selected.domain}</Tag>}
                {(selected.tags ?? []).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
            {selected.description && (
              <p className="mt-3 text-xs leading-relaxed text-ink-400">{selected.description}</p>
            )}
          </section>

          {viewAs && <AvailabilityDashboard role="USER" viewAs={viewAs} embedded />}
        </>
      )}
    </div>
  );
}
