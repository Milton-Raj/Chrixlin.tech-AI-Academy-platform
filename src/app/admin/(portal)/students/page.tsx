"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Download,
  Pencil,
  X,
  Loader2,
  UserPlus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/format";

interface BatchOption {
  id: string;
  batchName: string;
  startDate: string;
  status: string;
}

const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "UPI", "CARD", "NETBANKING", "OTHER"];

const emptyNew = {
  name: "",
  email: "",
  phone: "",
  country: "India",
  profession: "",
  experience: "Beginner",
  batchId: "",
  amount: 999,
  method: "UPI",
  transactionId: "",
  notes: "",
  sendWelcomeEmail: true,
};

/** Manual enrollment for students who paid offline (cash, bank transfer, UPI). */
function AddStudentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ ...emptyNew });
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/batches")
      .then((r) => r.json())
      .then((data) => {
        const open = (data.batches ?? []).filter((b: BatchOption) =>
          ["OPEN", "RUNNING", "PAUSED"].includes(b.status)
        );
        setBatches(open);
        if (open[0]) setForm((f) => ({ ...f, batchId: open[0].id }));
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/students/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add student");
      return;
    }
    setDone(data.emailStatus);
    onAdded();
  }

  if (done !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="card w-full max-w-md !bg-navy-light text-center">
          <CheckCircle2 size={44} className="mx-auto text-green-400" />
          <h2 className="mt-3 text-lg font-semibold">Student added</h2>
          <p className="mt-1 text-sm text-muted">
            {done === "SENT"
              ? "Welcome email sent with their batch and class link."
              : done === "SKIPPED_NO_KEY"
                ? "Welcome email logged (no Resend API key set in this environment)."
                : done === "FAILED"
                  ? "Student saved, but the welcome email failed to send."
                  : "Student saved. No welcome email was requested."}
          </p>
          <button className="btn-cta mt-5 w-full !py-2 text-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10">
      <form onSubmit={submit} className="card w-full max-w-lg !bg-navy-light">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Add Student</h2>
            <p className="text-xs text-muted">For students who paid offline or over the phone.</p>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-muted hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input
                className="input"
                required
                minLength={7}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                className="input"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Profession</label>
              <input
                className="input"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Experience</label>
              <select
                className="input"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Batch *</label>
                <select
                  className="input"
                  required
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                >
                  {batches.length === 0 && <option value="">No active batches</option>}
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchName} — {formatDate(b.startDate)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Amount Paid (₹) *</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  className="input"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Reference / Txn ID</label>
                <input
                  className="input"
                  placeholder="UTR, receipt no."
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="label">Notes</label>
              <textarea
                className="input min-h-16"
                placeholder="Anything worth recording about this enrollment"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.sendWelcomeEmail}
                onChange={(e) => setForm({ ...form, sendWelcomeEmail: e.target.checked })}
              />
              Send welcome email with receipt and live class link
            </label>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-outline flex-1 !py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-cta flex-1 !py-2 text-sm" disabled={saving || batches.length === 0}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Add Student
          </button>
        </div>
      </form>
    </div>
  );
}

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
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<StudentRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
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

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await fetch(`/api/admin/students/${deleting.id}`, { method: "DELETE" });
    setDeleteBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Could not delete student");
      return;
    }
    setDeleting(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-sm text-muted">{rows.length} students</p>
        </div>
        <div className="flex gap-3">
          <a href="/api/admin/students/export" className="btn-outline !px-4 !py-2 text-sm">
            <Download size={15} /> Export CSV / Excel
          </a>
          <button className="btn-cta !px-4 !py-2 text-sm" onClick={() => setAdding(true)}>
            <UserPlus size={15} /> Add Student
          </button>
        </div>
      </div>

      {adding && <AddStudentModal onClose={() => setAdding(false)} onAdded={load} />}

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
                    <div className="flex gap-1.5">
                      <button
                        className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                        onClick={() => setEditing({ ...s })}
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        className="btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        onClick={() => setDeleting(s)}
                        title="Delete student"
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

      {/* Delete confirmation modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-md !bg-navy-light">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Delete student?</h2>
                <p className="mt-1 text-sm text-muted">
                  This permanently removes <b className="text-white">{deleting.name}</b> (
                  {deleting.email}) from the database.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-slate-300">
              Their registration, payment records and any certificate are deleted too, and the seat
              they held is released back to the batch. A published certificate&apos;s verification
              link will stop working. This cannot be undone.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="btn-outline flex-1 !py-2 text-sm"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="btn-sm flex-1 justify-center !py-2 !text-sm bg-red-500 text-white hover:brightness-110"
                onClick={confirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

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
