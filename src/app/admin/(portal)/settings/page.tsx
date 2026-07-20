"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Save,
  BellRing,
  Layers,
  TimerReset,
  AlertTriangle,
  Mail,
  CreditCard,
  Clock,
  Copy,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";

type Settings = Record<string, string>;

interface SystemStatus {
  email: { configured: boolean; sent: number; logged: number; failed: number };
  payments: { live: boolean };
  cron: { secretSet: boolean; lastRunAt: string | null; healthy: boolean; endpoint: string };
  appUrl: { value: string; looksLocal: boolean };
  emailFrom: string;
}

/** Fires a real email through Resend so delivery can be verified in one click. */
function TestEmailForm() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ status: string; error?: string | null } | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/admin/system/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    setResult(await res.json());
    setBusy(false);
  }

  return (
    <form onSubmit={send} className="mt-4 rounded-xl bg-navy p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">Send a test email</div>
      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          type="email"
          required
          placeholder="you@gmail.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button className="btn-cta !px-4 !py-2 text-sm" disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send Test
        </button>
      </div>
      {result &&
        (result.status === "SENT" ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle2 size={13} /> Sent — check the inbox (and spam folder on first send).
          </p>
        ) : result.status === "SKIPPED_NO_KEY" ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle size={13} /> No RESEND_API_KEY set — the email was logged, not sent.
          </p>
        ) : (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-red-400">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" /> Failed: {result.error ?? "unknown error"}
          </p>
        ))}
    </form>
  );
}

interface Field {
  key: string;
  label: string;
  hint?: string;
  suffix?: string;
}

/** One saveable group of settings. */
function Section({
  title,
  icon: Icon,
  description,
  fields,
  settings,
  onSaved,
  children,
}: {
  title: string;
  icon: React.ElementType;
  description: string;
  fields: Field[];
  settings: Settings;
  onSaved: () => void;
  children?: React.ReactNode;
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
    <form onSubmit={save} className="card">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric/15 text-electric">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <div className="flex items-center gap-2">
              <input
                className="input"
                value={values[f.key] ?? ""}
                onChange={(e) => {
                  setValues({ ...values, [f.key]: e.target.value });
                  setSaved(false);
                }}
              />
              {f.suffix && <span className="shrink-0 text-xs text-muted">{f.suffix}</span>}
            </div>
            {f.hint && <p className="mt-1 text-[11px] text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>

      {children}

      <div className="mt-5 flex items-center gap-3">
        <button className="btn-cta !px-5 !py-2 text-sm" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={13} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

function StatusRow({
  ok,
  icon: Icon,
  label,
  detail,
  warning,
}: {
  ok: boolean;
  icon: React.ElementType;
  label: string;
  detail: string;
  warning?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 p-4">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          ok ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
        }`}
      >
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {label}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              ok ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {ok ? "READY" : "ACTION NEEDED"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">{detail}</p>
        {!ok && warning && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {warning}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const [s, sys] = await Promise.all([
      fetch("/api/admin/settings").then((r) => r.json()),
      fetch("/api/admin/system").then((r) => r.json()),
    ]);
    setSettings(s.settings ?? {});
    setStatus(sys);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!settings || !status) return <p className="text-sm text-muted">Loading settings…</p>;

  const h1 = parseInt(settings.reminderHours1 ?? "0", 10) || 0;
  const h2 = parseInt(settings.reminderHours2 ?? "0", 10) || 0;
  const describe = (h: number) =>
    h <= 0 ? "off" : h === 1 ? "1 hour before" : h < 24 ? `${h} hours before` : h === 24 ? "1 day before" : `${Math.round(h / 24)} days before`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">
          How the platform behaves — reminders, batch automation and the offer timer.
          Page text, FAQs and testimonials live in <a href="/admin/cms" className="text-electric hover:underline">CMS</a>.
        </p>
      </div>

      {/* --- Reminder emails --------------------------------------------- */}
      <Section
        title="Reminder Emails"
        icon={BellRing}
        description="Automatic emails to paid students before their batch starts."
        settings={settings}
        onSaved={load}
        fields={[
          {
            key: "reminderHours1",
            label: "First reminder",
            suffix: "hours before",
            hint: "Typically 24 — the day-before nudge.",
          },
          {
            key: "reminderHours2",
            label: "Second reminder",
            suffix: "hours before",
            hint: "Typically 1 — the final get-ready nudge.",
          },
        ]}
      >
        <div className="mt-4 rounded-xl bg-navy p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Current schedule
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className={h1 > 0 ? "text-green-400" : "text-muted"}>●</span>
              Reminder 1 — <b className="text-white">{describe(h1)}</b>
            </li>
            <li className="flex items-center gap-2">
              <span className={h2 > 0 ? "text-green-400" : "text-muted"}>●</span>
              Reminder 2 — <b className="text-white">{describe(h2)}</b>
            </li>
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            Set a field to 0 to switch that reminder off. Each email includes the class link and the
            batch WhatsApp group invite.
          </p>
        </div>
      </Section>

      {/* --- Offer timer --------------------------------------------------- */}
      <Section
        title="Offer Timer & Call to Action"
        icon={TimerReset}
        description="The countdown and button text shown on the landing page."
        settings={settings}
        onSaved={load}
        fields={[
          { key: "ctaText", label: "Button text", hint: "e.g. Enroll Now, Register Now" },
          {
            key: "offerTimerMinutes",
            label: "Countdown length",
            suffix: "minutes",
            hint: "Each visitor gets their own timer. 0 hides it.",
          },
          { key: "offerTimerLabel", label: "Countdown label" },
        ]}
      />

      {/* --- Batch automation ---------------------------------------------- */}
      <Section
        title="Batch Automation"
        icon={Layers}
        description="How future batches are created and sized, so you never run out of open seats."
        settings={settings}
        onSaved={load}
        fields={[
          {
            key: "parallelBatches",
            label: "Future batches kept open",
            hint: "New batches are created automatically to maintain this many.",
          },
          { key: "defaultCapacity", label: "Seats per batch" },
          { key: "batchStaggerDays", label: "Gap between batches", suffix: "days" },
          { key: "firstBatchLeadDays", label: "Lead time for a new batch", suffix: "days" },
        ]}
      />

      {/* --- System status -------------------------------------------------- */}
      <div className="card">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
            <Clock size={18} />
          </span>
          <div>
            <h2 className="font-semibold">System Status</h2>
            <p className="mt-0.5 text-xs text-muted">
              Whether the pieces that send email, take payment and run automation are wired up.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <StatusRow
            ok={status.email.configured}
            icon={Mail}
            label="Email delivery"
            detail={
              status.email.configured
                ? `Resend connected, sending as ${status.emailFrom} — ${status.email.sent} sent, ${status.email.failed} failed.`
                : `Not connected — ${status.email.logged} email(s) recorded but never delivered.`
            }
            warning="Set RESEND_API_KEY in Vercel. Until then, no student receives anything — welcome emails, reminders and certificates are only written to the log."
          />
          <StatusRow
            ok={status.payments.live}
            icon={CreditCard}
            label="Payments"
            detail={
              status.payments.live
                ? "Razorpay live — real payments are being taken."
                : "Simulated mode — checkout completes without charging."
            }
            warning="Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel. Right now anyone can enroll for free."
          />
          <StatusRow
            ok={status.cron.secretSet && status.cron.healthy}
            icon={BellRing}
            label="Reminder scheduler"
            detail={
              status.cron.lastRunAt
                ? `Last ran ${formatDateTime(status.cron.lastRunAt)}.`
                : "Has never run."
            }
            warning={
              !status.cron.secretSet
                ? "CRON_SECRET is not set in Vercel, so the endpoint rejects every call and no reminder will ever send."
                : "No run in the last 3 hours. Schedule the endpoint below to run hourly."
            }
          />
          {status.appUrl.looksLocal && (
            <StatusRow
              ok={false}
              icon={AlertTriangle}
              label="Public URL"
              detail={`Set to ${status.appUrl.value}`}
              warning="NEXT_PUBLIC_APP_URL still points at localhost, so certificate and email links will break for students. Set it to your live domain in Vercel."
            />
          )}
        </div>

        <TestEmailForm />

        <div className="mt-5 rounded-xl bg-navy p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Scheduler endpoint — call hourly
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-slate-300">
              {status.cron.endpoint}
            </code>
            <button
              className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
              onClick={() => {
                navigator.clipboard.writeText(status.cron.endpoint);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Copy size={12} /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Send header <code className="text-slate-300">Authorization: Bearer &lt;CRON_SECRET&gt;</code>.
            Vercel&apos;s Hobby plan only allows one cron run per day, which is too slow for a
            1-hour reminder — use a free hourly scheduler such as cron-job.org instead.
          </p>
        </div>
      </div>
    </div>
  );
}
