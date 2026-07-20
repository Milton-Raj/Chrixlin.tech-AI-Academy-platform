"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Video, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/format";

interface BatchRow {
  id: string;
  batchName: string;
  startDate: string;
  endDate: string;
  status: string;
  seatsFilled: number;
  meeting: {
    provider: string;
    meetingLink: string;
    startDate: string | null;
    expiryDate: string | null;
  } | null;
}

const PROVIDERS = [
  { value: "ZOOM", label: "Zoom" },
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "TEAMS", label: "Microsoft Teams" },
];

function MeetingForm({ batch, onSaved }: { batch: BatchRow; onSaved: () => void }) {
  const [provider, setProvider] = useState(batch.meeting?.provider ?? "ZOOM");
  const [link, setLink] = useState(batch.meeting?.meetingLink ?? "");
  const [start, setStart] = useState(batch.meeting?.startDate?.slice(0, 10) ?? "");
  const [expiry, setExpiry] = useState(batch.meeting?.expiryDate?.slice(0, 10) ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch(`/api/admin/batches/${batch.id}/meeting`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        meetingLink: link,
        startDate: start || null,
        expiryDate: expiry || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setSaved(true);
    onSaved();
  }

  return (
    <form onSubmit={save} className="card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">{batch.batchName}</h2>
          <p className="text-xs text-muted">
            {formatDate(batch.startDate)} → {formatDate(batch.endDate)} • {batch.seatsFilled} students •{" "}
            {batch.status}
          </p>
        </div>
        {batch.meeting && (
          <span className="badge border-green-400/30 bg-green-400/10 text-green-400">
            <Video size={12} /> Link set
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Meeting Provider</label>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Meeting Link</label>
          <input
            className="input"
            type="url"
            required
            placeholder="https://zoom.us/j/…"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Meeting Start Date</label>
          <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">Meeting Expiry Date</label>
          <input className="input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button className="btn-cta !px-4 !py-2 text-sm" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Meeting
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={13} /> Saved — students get this link by email automatically
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </form>
  );
}

export default function MeetingsPage() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/batches");
    const data = await res.json();
    const active = (data.batches ?? []).filter((b: BatchRow) =>
      ["OPEN", "RUNNING", "PAUSED"].includes(b.status)
    );
    setRows(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meeting Management</h1>
        <p className="text-sm text-muted">
          Set the live class link per batch. The system emails it to paid students automatically when the
          batch starts (daily email automation).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">No active batches.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((b) => (
            <MeetingForm key={b.id} batch={b} onSaved={load} />
          ))}
        </div>
      )}
    </div>
  );
}
