"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Download, Pencil, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  profession: string;
  experience: string;
  active: boolean;
  createdAt: string;
  registrationId: string | null;
  registrationStatus: string;
  paymentStatus: string;
  batchName: string;
}

const STATUSES = ["REGISTERED", "PAID", "STARTED", "COMPLETED", "CANCELLED"];

const statusColor: Record<string, string> = {
  REGISTERED: "bg-white/10 text-slate-300",
  PAID: "bg-green-500/15 text-green-400",
  STARTED: "bg-electric/15 text-electric",
  COMPLETED: "bg-gold/15 text-gold",
  CANCELLED: "bg-red-500/15 text-red-400",
  NONE: "bg-white/5 text-muted",
};

export default function StudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/students?${params}`);
    const data = await res.json();
    setRows(data.students ?? []);
    setLoading(false);
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/admin/students/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        phone: editing.phone,
        country: editing.country,
        profession: editing.profession,
        experience: editing.experience,
        active: editing.active,
        ...(editing.registrationId ? { registrationStatus: editing.registrationStatus } : {}),
      }),
    });
    setSaving(false);
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted">{rows.length} students</p>
        </div>
        <a href="/api/admin/students/export" className="btn-outline !px-4 !py-2 text-sm">
          <Download size={15} /> Export CSV / Excel
        </a>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input !pl-9"
            placeholder="Search name, email or phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="th">Student</th>
              <th className="th">Contact</th>
              <th className="th">Profession</th>
              <th className="th">Batch</th>
              <th className="th">Status</th>
              <th className="th">Joined</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td text-muted" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="td text-muted" colSpan={7}>
                  No students found.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className={`hover:bg-white/[0.02] ${!s.active ? "opacity-50" : ""}`}>
                  <td className="td">
                    <div className="font-medium">{s.name}</div>
                    {!s.active && <span className="text-[10px] text-red-400">DEACTIVATED</span>}
                  </td>
                  <td className="td">
                    <div>{s.email}</div>
                    <div className="text-xs text-muted">{s.phone}</div>
                  </td>
                  <td className="td">
                    <div>{s.profession || "—"}</div>
                    <div className="text-xs text-muted">{s.experience}</div>
                  </td>
                  <td className="td">{s.batchName}</td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[s.registrationStatus] ?? statusColor.NONE}`}
                    >
                      {s.registrationStatus}
                    </span>
                  </td>
                  <td className="td text-xs">{formatDate(s.createdAt)}</td>
                  <td className="td">
                    <button
                      className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                      onClick={() => setEditing({ ...s })}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={saveEdit} className="card w-full max-w-md !bg-navy-light">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Student</h2>
              <button type="button" onClick={() => setEditing(null)} className="cursor-pointer text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input
                    className="input"
                    value={editing.phone}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input
                    className="input"
                    value={editing.country}
                    onChange={(e) => setEditing({ ...editing, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Profession</label>
                  <input
                    className="input"
                    value={editing.profession}
                    onChange={(e) => setEditing({ ...editing, profession: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Experience</label>
                  <input
                    className="input"
                    value={editing.experience}
                    onChange={(e) => setEditing({ ...editing, experience: e.target.value })}
                  />
                </div>
              </div>
              {editing.registrationId && (
                <div>
                  <label className="label">Course Status</label>
                  <select
                    className="input"
                    value={editing.registrationStatus}
                    onChange={(e) => setEditing({ ...editing, registrationStatus: e.target.value })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                />
                Active student
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-outline flex-1 !py-2 text-sm" onClick={() => setEditing(null)}>
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
