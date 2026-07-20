"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { inr, discountPercent } from "@/lib/format";

interface CourseForm {
  title: string;
  description: string;
  durationDays: number;
  price: number;
  offerPrice: number;
  offerText: string;
  offerEndDate: string;
}

export default function PricingPage() {
  const [form, setForm] = useState<CourseForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/course")
      .then((r) => r.json())
      .then((data) => {
        const c = data.course;
        if (c) {
          setForm({
            title: c.title,
            description: c.description,
            durationDays: c.durationDays,
            price: c.price,
            offerPrice: c.offerPrice,
            offerText: c.offerText,
            offerEndDate: c.offerEndDate ? c.offerEndDate.slice(0, 10) : "",
          });
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/admin/course", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        durationDays: Number(form.durationDays),
        price: Number(form.price),
        offerPrice: Number(form.offerPrice),
        offerEndDate: form.offerEndDate || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setSaved(true);
  }

  if (!form) return <p className="text-sm text-muted">Loading…</p>;

  const save67 = discountPercent(Number(form.price), Number(form.offerPrice));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing Management</h1>
        <p className="text-sm text-muted">The landing page updates automatically when you save.</p>
      </div>

      <form onSubmit={save} className="card space-y-4">
        <div>
          <label className="label">Course Title</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-24"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Duration (days)</label>
            <input
              className="input"
              type="number"
              min={1}
              required
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Original Price (₹)</label>
            <input
              className="input"
              type="number"
              min={0}
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Discount Price (₹)</label>
            <input
              className="input"
              type="number"
              min={0}
              required
              value={form.offerPrice}
              onChange={(e) => setForm({ ...form, offerPrice: Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Offer Text</label>
            <input
              className="input"
              placeholder="Early Bird Offer"
              value={form.offerText}
              onChange={(e) => setForm({ ...form, offerText: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Offer End Date</label>
            <input
              className="input"
              type="date"
              value={form.offerEndDate}
              onChange={(e) => setForm({ ...form, offerEndDate: e.target.value })}
            />
          </div>
        </div>

        {/* live preview */}
        <div className="rounded-xl bg-navy p-4">
          <div className="text-xs uppercase tracking-wide text-muted">Landing page preview</div>
          <div className="mt-2 flex items-end gap-3">
            {form.offerPrice < form.price && (
              <span className="price-strike text-lg text-muted">{inr(Number(form.price))}</span>
            )}
            <span className="text-3xl font-extrabold text-white">
              {inr(Number(form.offerPrice < form.price ? form.offerPrice : form.price))}
            </span>
            {save67 > 0 && (
              <span className="rounded-full bg-cta/15 px-2 py-1 text-xs font-bold text-cta">
                Save {save67}%
              </span>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex items-center gap-3">
          <button className="btn-cta !px-6 !py-2.5 text-sm" disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Pricing
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs text-green-400">
              <CheckCircle2 size={13} /> Saved — live on the landing page
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
