"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Send,
  Download,
  ExternalLink,
  Loader2,
  Search,
  ImagePlus,
  PenLine,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/format";

const MAX_IMAGE_KB = 400;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Upload logo + signature images that get printed on every certificate PDF. */
function BrandingPanel() {
  const [logo, setLogo] = useState("");
  const [signature, setSignature] = useState("");
  const [signatoryName, setSignatoryName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setLogo(data.settings?.certLogo ?? "");
        setSignature(data.settings?.certSignature ?? "");
        setSignatoryName(data.settings?.certSignatoryName ?? "");
        setLoaded(true);
      });
  }, []);

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Please upload a PNG or JPG image.");
      return;
    }
    if (file.size > MAX_IMAGE_KB * 1024) {
      setError(`Image too large — keep it under ${MAX_IMAGE_KB} KB.`);
      return;
    }
    set(await readFileAsDataUrl(file));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certLogo: logo,
        certSignature: signature,
        certSignatoryName: signatoryName,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Save failed — please try again.");
      return;
    }
    setSaved(true);
  }

  if (!loaded) return null;

  const slot = (
    label: string,
    icon: React.ReactNode,
    value: string,
    set: (v: string) => void,
    hint: string
  ) => (
    <div className="flex-1 rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        {value && (
          <button
            className="btn-sm bg-red-500/10 text-red-400 hover:bg-red-500/20"
            onClick={() => {
              set("");
              setSaved(false);
            }}
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>
      <div className="mt-3 flex h-20 items-center justify-center rounded-lg bg-white p-2">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-slate-400">No image yet</span>
        )}
      </div>
      <label className="btn-sm mt-3 w-full cursor-pointer justify-center bg-white/5 text-slate-300 hover:bg-white/10">
        {icon} Upload {label}
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => pickImage(e, set)}
        />
      </label>
      <p className="mt-2 text-[11px] text-muted">{hint}</p>
    </div>
  );

  return (
    <div className="card">
      <h2 className="font-semibold">Certificate Branding</h2>
      <p className="mt-1 text-xs text-muted">
        Your logo and signature are printed on every certificate PDF (light design, with the AI-tool
        badges included automatically). PNG with transparent background works best.
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        {slot("Logo", <ImagePlus size={13} />, logo, setLogo, "Shown at the top center of the certificate.")}
        {slot(
          "Signature",
          <PenLine size={13} />,
          signature,
          setSignature,
          "Sits above the signatory line, bottom right."
        )}
        <div className="flex-1 rounded-xl border border-white/10 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Signatory Name</span>
          <input
            className="input mt-3"
            value={signatoryName}
            onChange={(e) => {
              setSignatoryName(e.target.value);
              setSaved(false);
            }}
            placeholder="Chrixlin.tech Academy"
          />
          <p className="mt-2 text-[11px] text-muted">Printed under the signature line.</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button className="btn-cta !px-5 !py-2 text-sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save Branding
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 size={13} /> Saved — applies to all certificate downloads instantly
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

interface Row {
  id: string;
  studentName: string;
  studentEmail: string;
  batchName: string;
  courseTitle: string;
  status: string;
  certificate: {
    certificateNumber: string;
    verificationCode: string;
    issuedDate: string;
  } | null;
}

export default function CertificatesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [verifyNo, setVerifyNo] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/certificates");
    const data = await res.json();
    setRows(data.registrations ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function issue(registrationId: string) {
    if (!confirm("Approve completion and issue the certificate? The student is emailed automatically."))
      return;
    setBusyId(registrationId);
    const res = await fetch("/api/admin/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error ?? "Failed");
    setBusyId("");
    load();
  }

  async function resend(registrationId: string) {
    setBusyId(registrationId);
    const res = await fetch("/api/admin/certificates/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId }),
    });
    const data = await res.json();
    alert(res.ok ? `Email status: ${data.emailStatus}` : (data.error ?? "Failed"));
    setBusyId("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Certificates</h1>
          <p className="text-sm text-muted">
            Approve completion to auto-generate the certificate, PDF and email.
          </p>
        </div>
        {/* quick verify */}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (verifyNo.trim()) window.open(`/certificate/${verifyNo.trim().toUpperCase()}`, "_blank");
          }}
        >
          <input
            className="input w-56"
            placeholder="CHX-2026-000001"
            value={verifyNo}
            onChange={(e) => setVerifyNo(e.target.value)}
          />
          <button className="btn-outline !px-4 !py-2 text-sm">
            <Search size={14} /> Verify
          </button>
        </form>
      </div>

      <BrandingPanel />

      <div className="card overflow-x-auto !p-0">
        <table className="w-full min-w-[840px]">
          <thead>
            <tr>
              <th className="th">Student</th>
              <th className="th">Batch</th>
              <th className="th">Course Status</th>
              <th className="th">Certificate</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="td text-muted" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="td text-muted" colSpan={5}>
                  No paid students yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="td">
                    <div className="font-medium">{r.studentName}</div>
                    <div className="text-xs text-muted">{r.studentEmail}</div>
                  </td>
                  <td className="td">{r.batchName}</td>
                  <td className="td">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "COMPLETED"
                          ? "bg-gold/15 text-gold"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="td">
                    {r.certificate ? (
                      <div>
                        <div className="font-mono text-xs">{r.certificate.certificateNumber}</div>
                        <div className="text-[11px] text-muted">
                          Issued {formatDate(r.certificate.issuedDate)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Not issued</span>
                    )}
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      {r.certificate ? (
                        <>
                          <a
                            className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                            href={`/api/certificates/${r.certificate.certificateNumber}/pdf`}
                          >
                            <Download size={12} /> PDF
                          </a>
                          <a
                            className="btn-sm bg-white/5 text-slate-300 hover:bg-white/10"
                            href={`/certificate/${r.certificate.certificateNumber}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={12} /> Verify Page
                          </a>
                          <button
                            className="btn-sm bg-electric/10 text-electric hover:bg-electric/20"
                            onClick={() => resend(r.id)}
                            disabled={busyId === r.id}
                          >
                            {busyId === r.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            Resend
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn-sm bg-gold/15 text-gold hover:bg-gold/25"
                          onClick={() => issue(r.id)}
                          disabled={busyId === r.id}
                        >
                          {busyId === r.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <BadgeCheck size={12} />
                          )}
                          Approve & Issue
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
