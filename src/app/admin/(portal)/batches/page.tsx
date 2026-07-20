"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Pause, Play, Lock } from "lucide-react";
import { formatDate } from "@/lib/format";

interface BatchRow {
  id: string;
  batchName: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  capacity: number;
  seatsFilled: number;
  status: string;
  autoCreated: boolean;
  registrations: number;
}

const statusColor: Record<string, string> = {
  OPEN: "bg-green-500/15 text-green-400",
  RUNNING: "bg-electric/15 text-electric",
  COMPLETED: "bg-gold/15 text-gold",
  PAUSED: "bg-white/10 text-slate-300",
  CLOSED: "bg-red-500/15 text-red-400",
};

const emptyForm = { id: "", batchName: "", startDate: "", capacity: 25, status: "OPEN" };

export default function BatchesPage() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<typeof emptyForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/batches");
    const data = await res.json();
    setRows(data.batches ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const isEdit = Boolean(form.id);
    const res = await fetch(isEdit ? `/api/admin/batches/${form.id}` : "/api/admin/batches", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchName: form.batchName,
        startDate: form.startDate,
        capacity: Number(form.capacity),
        ...(isEdit ? { status: form.status } : {}),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setForm(null);
    load();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Delete failed");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Batches</h1>
          <p className="text-sm text-muted">
            Schedule and status. Registration counts per batch live on the{" "}
            <a href="/admin" className="text-electric hover:underline">
              dashboard
            </a>
            .
          </p>
        </div>
        <button
          className="btn-cta !px-4 !py-2 text-sm"
          onClick={() => setForm({ ...emptyForm })}
        >
          <Plus size={15} /> New Batch
        </button>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr>
              <th className="th">Batch</th>
              <th className="th">Dates</th>
              <th className="th">Capacity</th>
              <th className="th">Status</th>
              <th className="th">Source</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td text-muted" colSpan={6}>
                  Loading…
                </td>
              </tr>
            ) : (
              rows.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.02]">
                  <td className="td">
                    <div className="font-medium">{b.batchName}</div>
                    <div className="text-xs text-muted">{b.courseTitle}</div>
                  </td>
                  <td className="td text-xs">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </td>
                  <td className="td">{b.capacity} seats</td>
                  <td className="td">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="td text-xs text-muted">{b.autoCreated ? "Auto" : "Manual"}</td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                        onClick={() =>
                          setForm({
                            id: b.id,
                            batchName: b.batchName,
                            startDate: b.startDate.slice(0, 10),
                            capacity: b.capacity,
                            status: b.status,
                          })
                        }
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      {b.status === "OPEN" && (
                        <button
                          className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                          onClick={() => setStatus(b.id, "PAUSED")}
                        >
                          <Pause size={12} /> Pause
                        </button>
                      )}
                      {b.status === "PAUSED" && (
                        <button
                          className="btn-sm bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          onClick={() => setStatus(b.id, "OPEN")}
                        >
                          <Play size={12} /> Open
                        </button>
                      )}
                      {["OPEN", "PAUSED"].includes(b.status) && (
                        <button
                          className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                          onClick={() => setStatus(b.id, "CLOSED")}
                        >
                          <Lock size={12} /> Close
                        </button>
                      )}
                      <button
                        className="btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        onClick={() => remove(b.id, b.batchName)}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={save} className="card w-full max-w-sm !bg-navy-light">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{form.id ? "Edit Batch" : "New Batch"}</h2>
              <button type="button" onClick={() => setForm(null)} className="cursor-pointer text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <label className="label">Batch Name</label>
                <input
                  className="input"
                  required
                  value={form.batchName}
                  onChange={(e) => setForm({ ...form, batchName: e.target.value })}
                  placeholder="Batch 5"
                />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input
                  className="input"
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
                {!form.id && (
                  <p className="mt-1 text-[11px] text-muted">
                    End date is set automatically from the course duration.
                  </p>
                )}
              </div>
              <div>
                <label className="label">Capacity</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  required
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
              {form.id && (
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {["OPEN", "RUNNING", "COMPLETED", "PAUSED", "CLOSED"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-outline flex-1 !py-2 text-sm" onClick={() => setForm(null)}>
                Cancel
              </button>
              <button className="btn-cta flex-1 !py-2 text-sm" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
