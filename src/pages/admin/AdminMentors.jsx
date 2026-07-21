import { useCallback, useEffect, useState } from "react";
import MqSelect from "../../components/MqSelect";
import AvailabilityDashboard from "../../components/AvailabilityDashboard";
import { Tag, TagPicker, ErrorNote, SuccessNote, Loading } from "../../components/ui/Bits.jsx";
import * as adminApi from "../../api/admin";
import { DOMAINS, MENTOR_TAGS } from "../../constants/taxonomy.js";

const BLANK = { headline: "", description: "", company: "", domain: "", tags: [] };

// mentor metadata is admin-owned, saving here re-embeds the mentor too so
// changes show up in the recommendation ranking right away
export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await adminApi.listMentors();
      setMentors(list);
      setSelectedId((prev) => prev || list[0]?.id || "");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const mentor = mentors.find((m) => m.id === selectedId);
    setForm(
      mentor
        ? {
            headline: mentor.headline || "",
            description: mentor.description || "",
            company: mentor.company || "",
            domain: mentor.domain || "",
            tags: mentor.tags || [],
          }
        : BLANK
    );
    setSaved(false);
  }, [selectedId, mentors]);

  const selected = mentors.find((m) => m.id === selectedId);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await adminApi.updateMentorProfile(selectedId, form);
      setSaved(true);
      await load();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-50">Mentors</h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Tags and descriptions are managed here. Saving re-indexes the mentor for matching.
          </p>
        </div>
        <MqSelect
          id="mentor-select"
          label="Mentor"
          value={selectedId}
          onChange={setSelectedId}
          options={mentors.map((m) => ({ value: m.id, label: m.name, title: m.email }))}
          menuAlign="right"
        />
      </header>

      <ErrorNote>{error}</ErrorNote>
      {saved && <SuccessNote>Saved and re-indexed for recommendations.</SuccessNote>}

      {!selected ? (
        <p className="text-sm text-ink-500">No mentors yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <section className="mq-card space-y-4 p-5">
            <div>
              <p className="text-sm font-semibold text-ink-50">{selected.name}</p>
              <p className="text-xs text-ink-500">{selected.email}</p>
            </div>

            <div>
              <label htmlFor="m-headline" className="mq-label">
                Headline
              </label>
              <input
                id="m-headline"
                className="mq-input"
                value={form.headline}
                onChange={(e) => set("headline")(e.target.value)}
                placeholder="Staff Engineer at Google"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="m-company" className="mq-label">
                  Company
                </label>
                <input
                  id="m-company"
                  className="mq-input"
                  value={form.company}
                  onChange={(e) => set("company")(e.target.value)}
                  placeholder="Google"
                />
              </div>
              <MqSelect
                id="m-domain"
                label="Domain"
                value={form.domain}
                onChange={set("domain")}
                placeholder="Select…"
                options={DOMAINS.map((d) => ({ value: d, label: d }))}
                className="relative w-full min-w-0"
              />
            </div>

            <div>
              <span className="mq-label">Tags</span>
              <TagPicker options={MENTOR_TAGS} value={form.tags} onChange={set("tags")} />
            </div>

            <div>
              <label htmlFor="m-description" className="mq-label">
                Description
              </label>
              <textarea
                id="m-description"
                className="mq-textarea"
                value={form.description}
                onChange={(e) => set("description")(e.target.value)}
                placeholder="What is this mentor genuinely good at? This text is embedded and matched against mentee requests, so specifics matter more than adjectives."
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-ink-500">
                {selected.hasEmbedding ? "Indexed for matching" : "Not yet indexed"}
              </span>
              <button type="button" onClick={save} disabled={saving} className="mq-btn-primary">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-ink-50">Availability</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                {selected.name}’s weekly schedule — editable here if you need to correct it.
              </p>
            </div>
            <AvailabilityDashboard
              role="MENTOR"
              viewAs={{
                mentorId: selected.id,
                name: selected.name,
                email: selected.email,
                timezone: selected.timezone,
                role: "MENTOR",
              }}
              embedded
            />
          </section>
        </div>
      )}
    </div>
  );
}
