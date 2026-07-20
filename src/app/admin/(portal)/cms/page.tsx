"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, CheckCircle2, Plus, Trash2, Save } from "lucide-react";

type Settings = Record<string, string>;

interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  imageUrl: string;
  videoUrl: string;
  type: string;
  rating: number;
  sortOrder: number;
  active: boolean;
}

function SaveButton({ saving, saved, label = "Save" }: { saving: boolean; saved: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button className="btn-cta !px-5 !py-2 text-sm" disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {label}
      </button>
      {saved && (
        <span className="inline-flex items-center gap-1 text-xs text-green-400">
          <CheckCircle2 size={13} /> Saved
        </span>
      )}
    </div>
  );
}

/* --- Settings-backed sections (hero text, counters, contact, automation) --- */
function SettingsSection({
  title,
  hint,
  fields,
  settings,
  onSaved,
}: {
  title: string;
  hint?: string;
  fields: { key: string; label: string; textarea?: boolean }[];
  settings: Settings;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Settings>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const initial: Settings = {};
    for (const f of fields) initial[f.key] = settings[f.key] ?? "";
    setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
    onSaved();
  }

  return (
    <form onSubmit={save} className="card space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.textarea ? "sm:col-span-2" : ""}>
            <label className="label">{f.label}</label>
            {f.textarea ? (
              <textarea
                className="input min-h-20"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <input
                className="input"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <SaveButton saving={saving} saved={saved} />
    </form>
  );
}

/* ----------------------------- FAQ manager ------------------------------ */
function FaqManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/faqs");
    setFaqs((await res.json()).faqs ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setBusy(true);
    await fetch("/api/admin/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "New question?",
        answer: "Answer goes here.",
        sortOrder: faqs.length + 1,
      }),
    });
    setBusy(false);
    load();
  }

  async function save(f: Faq) {
    await fetch(`/api/admin/faqs/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: f.question,
        answer: f.answer,
        sortOrder: Number(f.sortOrder),
        active: f.active,
      }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">FAQs</h2>
        <button className="btn-sm bg-gold/15 text-gold hover:bg-gold/25" onClick={add} disabled={busy}>
          <Plus size={13} /> Add FAQ
        </button>
      </div>
      {faqs.map((f, i) => (
        <div key={f.id} className="rounded-xl border border-white/10 p-4">
          <div className="grid gap-2">
            <input
              className="input font-medium"
              value={f.question}
              onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
            />
            <textarea
              className="input min-h-16 text-sm"
              value={f.answer}
              onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Order
              <input
                className="input !w-16 !py-1"
                type="number"
                value={f.sortOrder}
                onChange={(e) =>
                  setFaqs(faqs.map((x, j) => (j === i ? { ...x, sortOrder: Number(e.target.value) } : x)))
                }
              />
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={f.active}
                onChange={(e) => setFaqs(faqs.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))}
              />
              Visible
            </label>
            <div className="flex-1" />
            <button className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10" onClick={() => save(f)}>
              <Save size={12} /> Save
            </button>
            <button className="btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => remove(f.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- Testimonial manager -------------------------- */
function TestimonialManager() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/testimonials");
    setItems((await res.json()).testimonials ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setBusy(true);
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Student Name", role: "", content: "Their feedback…", sortOrder: items.length + 1 }),
    });
    setBusy(false);
    load();
  }

  async function save(t: Testimonial) {
    await fetch(`/api/admin/testimonials/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        role: t.role,
        content: t.content,
        imageUrl: t.imageUrl,
        videoUrl: t.videoUrl,
        type: t.type as "TEXT" | "IMAGE" | "VIDEO",
        rating: Number(t.rating),
        sortOrder: Number(t.sortOrder),
        active: t.active,
      }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    load();
  }

  const set = (i: number, patch: Partial<Testimonial>) =>
    setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Testimonials</h2>
        <button className="btn-sm bg-gold/15 text-gold hover:bg-gold/25" onClick={add} disabled={busy}>
          <Plus size={13} /> Add Testimonial
        </button>
      </div>
      {items.map((t, i) => (
        <div key={t.id} className="rounded-xl border border-white/10 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Name" value={t.name} onChange={(e) => set(i, { name: e.target.value })} />
            <input className="input" placeholder="Role / city" value={t.role} onChange={(e) => set(i, { role: e.target.value })} />
            <textarea
              className="input min-h-16 sm:col-span-2"
              placeholder="Testimonial text"
              value={t.content}
              onChange={(e) => set(i, { content: e.target.value })}
            />
            <input
              className="input"
              placeholder="Image URL (optional)"
              value={t.imageUrl}
              onChange={(e) => set(i, { imageUrl: e.target.value })}
            />
            <input
              className="input"
              placeholder="Video URL (optional)"
              value={t.videoUrl}
              onChange={(e) => set(i, { videoUrl: e.target.value })}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className="input !w-28 !py-1" value={t.type} onChange={(e) => set(i, { type: e.target.value })}>
              <option value="TEXT">Text</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Rating
              <input
                className="input !w-14 !py-1"
                type="number"
                min={1}
                max={5}
                value={t.rating}
                onChange={(e) => set(i, { rating: Number(e.target.value) })}
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Order
              <input
                className="input !w-16 !py-1"
                type="number"
                value={t.sortOrder}
                onChange={(e) => set(i, { sortOrder: Number(e.target.value) })}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" checked={t.active} onChange={(e) => set(i, { active: e.target.checked })} />
              Visible
            </label>
            <div className="flex-1" />
            <button className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10" onClick={() => save(t)}>
              <Save size={12} /> Save
            </button>
            <button className="btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => remove(t.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Page ---------------------------------- */
export default function CmsPage() {
  const [settings, setSettingsState] = useState<Settings | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    setSettingsState((await res.json()).settings ?? {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!settings) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CMS — Site Content</h1>
        <p className="text-sm text-muted">
          Edit the landing page without code changes. All changes go live immediately.
        </p>
      </div>

      <SettingsSection
        title="Homepage Hero"
        settings={settings}
        onSaved={load}
        fields={[
          { key: "heroHeadline", label: "Headline", textarea: true },
          { key: "heroSubheadline", label: "Subheadline", textarea: true },
          { key: "heroBadge", label: "Badge text" },
        ]}
      />

      <SettingsSection
        title="Call to Action & Offer Timer"
        hint="The countdown runs per visitor (each customer gets their own timer in their browser). Set minutes to 0 to hide it."
        settings={settings}
        onSaved={load}
        fields={[
          { key: "ctaText", label: "CTA button text (e.g. Enroll Now / Register Now)" },
          { key: "offerTimerMinutes", label: "Countdown minutes (0 = off)" },
          { key: "offerTimerLabel", label: "Countdown label" },
        ]}
      />

      <SettingsSection
        title="Trust Counters"
        hint="The animated numbers under the hero."
        settings={settings}
        onSaved={load}
        fields={[
          { key: "statsStudents", label: "Students Trained" },
          { key: "statsProjects", label: "Projects Completed" },
          { key: "statsCertificates", label: "Certifications Issued" },
          { key: "statsWorkshops", label: "Live Workshops" },
        ]}
      />

      <SettingsSection
        title="Reminder Emails"
        hint="Hours before a batch starts to email paid students. Set a field to 0 to switch that reminder off. Requires the hourly cron to be scheduled."
        settings={settings}
        onSaved={load}
        fields={[
          { key: "reminderHours1", label: "First reminder (hours before)" },
          { key: "reminderHours2", label: "Second reminder (hours before)" },
        ]}
      />

      <SettingsSection
        title="Batch Automation"
        hint="How the system auto-creates future batches — no manual batch creation needed."
        settings={settings}
        onSaved={load}
        fields={[
          { key: "parallelBatches", label: "Future batches kept open" },
          { key: "defaultCapacity", label: "Capacity per batch" },
          { key: "batchStaggerDays", label: "Days between batch starts" },
          { key: "firstBatchLeadDays", label: "Lead days for first batch" },
        ]}
      />

      <SettingsSection
        title="Contact & Social"
        settings={settings}
        onSaved={load}
        fields={[
          { key: "contactWhatsapp", label: "WhatsApp number" },
          { key: "contactEmail", label: "Contact email" },
          { key: "socialLinkedin", label: "LinkedIn URL" },
          { key: "socialInstagram", label: "Instagram URL" },
          { key: "socialYoutube", label: "YouTube URL" },
          { key: "socialTwitter", label: "X / Twitter URL" },
        ]}
      />

      <FaqManager />
      <TestimonialManager />
    </div>
  );
}
