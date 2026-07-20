"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Users, ShieldCheck, Loader2 } from "lucide-react";
import type { PublicBatch, PublicCourse } from "@/lib/types";
import { formatDate, inr } from "@/lib/format";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type OrderResponse = {
  pendingId: string;
  order: { id: string; amount: number; currency: string };
  mock: boolean;
  keyId: string;
  student: { name: string; email: string; phone: string };
  error?: string;
};

const steps = ["Batch", "Your Details", "Payment"];

export default function EnrollFlow({
  batch,
  course,
  amount,
}: {
  batch: PublicBatch;
  course: PublicCourse;
  amount: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "India",
    profession: "",
    experience: "Beginner",
  });

  const seatsLeft = Math.max(batch.capacity - batch.seatsFilled, 0);

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: batch.id, ...form }),
      });
      const data: OrderResponse = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Registration failed");
      setOrderData(data);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPayment(orderId: string, paymentId: string, signature: string) {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Verification failed");
    router.push(`/enroll/success/${data.registrationId}`);
  }

  async function payMock() {
    if (!orderData) return;
    setBusy(true);
    setError("");
    try {
      await verifyPayment(orderData.order.id, `pay_mock_${Date.now()}`, "mock_signature");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  async function payRazorpay() {
    if (!orderData) return;
    setBusy(true);
    setError("");
    try {
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
          document.body.appendChild(s);
        });
      }
      const rzp = new window.Razorpay!({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Chrixlin.tech AI Academy",
        description: course.title,
        order_id: orderData.order.id,
        prefill: {
          name: orderData.student.name,
          email: orderData.student.email,
          contact: orderData.student.phone,
        },
        theme: { color: "#FF6B00" },
        handler: (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          verifyPayment(resp.razorpay_order_id, resp.razorpay_payment_id, resp.razorpay_signature).catch(
            (err) => {
              setError(err instanceof Error ? err.message : "Verification failed");
              setBusy(false);
            }
          );
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? "bg-gold text-navy"
                  : i === step
                    ? "bg-cta text-white"
                    : "bg-white/10 text-muted"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "text-white" : "text-muted"}`}>{s}</span>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-white/10" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Step 1 — batch summary */}
      {step === 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-semibold">{batch.batchName}</h2>
          <div className="mt-4 space-y-2.5 text-sm text-muted">
            <div className="flex items-center gap-2.5">
              <Calendar size={15} className="text-electric" />
              {formatDate(batch.startDate)} → {formatDate(batch.endDate)}
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={15} className="text-electric" /> {course.durationDays} days • Live classes
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={15} className="text-electric" />
              <b className="text-white">{seatsLeft}</b> seats remaining
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
            <span className="text-sm text-muted">Course fee</span>
            <span>
              {amount < course.price && (
                <span className="mr-2 text-sm text-muted line-through">{inr(course.price)}</span>
              )}
              <span className="text-2xl font-bold text-gold">{inr(amount)}</span>
            </span>
          </div>
          <button className="btn-cta mt-6 w-full" onClick={() => setStep(1)} disabled={seatsLeft === 0}>
            {seatsLeft === 0 ? "Batch Full" : "Continue"}
          </button>
        </div>
      )}

      {/* Step 2 — student details */}
      {step === 1 && (
        <form onSubmit={submitDetails} className="card mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Full Name *</label>
              <input
                className="input"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
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
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Phone (WhatsApp) *</label>
              <input
                className="input"
                required
                minLength={7}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="label">Country *</label>
              <input
                className="input"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Profession</label>
              <select
                className="input"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
              >
                <option value="">Select…</option>
                <option>IT Professional</option>
                <option>Non-IT Professional</option>
                <option>Freelancer</option>
                <option>Business Owner</option>
                <option>Student</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">AI Experience</label>
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
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-outline flex-1" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn-cta flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Continue to Payment
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — payment */}
      {step === 2 && orderData && (
        <div className="card mt-6 text-center">
          <ShieldCheck size={36} className="mx-auto text-gold" />
          <h2 className="mt-3 text-lg font-semibold">Secure Payment</h2>
          <p className="mt-1 text-sm text-muted">
            {batch.batchName} • {course.title}
          </p>
          <div className="mt-4 text-4xl font-extrabold text-white">{inr(amount)}</div>

          {orderData.mock ? (
            <>
              <div className="mt-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-xs text-gold">
                Dev mode: Razorpay keys are not configured, so this is a <b>simulated payment</b>.
                Add real keys in <code>.env</code> to enable live checkout.
              </div>
              <button className="btn-cta mt-5 w-full" onClick={payMock} disabled={busy}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                Pay {inr(amount)} (Simulated)
              </button>
            </>
          ) : (
            <button className="btn-cta mt-6 w-full" onClick={payRazorpay} disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null}
              Pay {inr(amount)} with Razorpay
            </button>
          )}
          <p className="mt-3 text-xs text-muted">
            UPI • Cards • Net Banking • Wallets — receipt emailed instantly
          </p>
        </div>
      )}
    </div>
  );
}
