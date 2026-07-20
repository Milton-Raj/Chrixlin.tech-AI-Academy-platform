import crypto from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { certificateEmail, sendEmail } from "@/lib/email";
import { formatDate } from "@/lib/format";

/**
 * Certificate automation (spec: CERTIFICATE AUTOMATION).
 * When a registration is marked complete: generate unique number
 * (CHX-YYYY-NNNNNN), verification code, PDF (rendered on demand — nothing
 * written to disk, so it works on Vercel serverless), email the student,
 * and expose the public verification page /certificate/[number].
 */

export async function nextCertificateNumber(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: "certificate" },
    update: { value: { increment: 1 } },
    create: { name: "certificate", value: 1 },
  });
  const year = new Date().getFullYear();
  return `CHX-${year}-${String(counter.value).padStart(6, "0")}`;
}

/** Issue (or return the existing) certificate for a paid registration. */
export async function issueCertificate(registrationId: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { student: true, batch: { include: { course: true } }, certificate: true },
  });
  if (!registration) throw new Error("Registration not found");
  if (registration.certificate) return registration.certificate;
  if (registration.paymentStatus !== "PAID") throw new Error("Registration is not paid");

  const certificateNumber = await nextCertificateNumber();
  const verificationCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const certificate = await prisma.certificate.create({
    data: {
      studentId: registration.studentId,
      registrationId: registration.id,
      certificateNumber,
      verificationCode,
      courseTitle: registration.batch.course.title,
    },
  });

  await prisma.registration.update({
    where: { id: registration.id },
    data: { status: "COMPLETED" },
  });

  const email = certificateEmail({
    studentName: registration.student.name,
    courseTitle: registration.batch.course.title,
    certificateNumber,
  });
  await sendEmail({
    to: registration.student.email,
    subject: email.subject,
    html: email.html,
    type: "CERTIFICATE",
    registrationId: registration.id,
  });

  return certificate;
}

/** Tools shown as badge chips on the certificate. */
const CERT_TOOLS = ["ChatGPT", "Claude AI", "Gemini", "Perplexity", "n8n", "Make", "AI Agents"];

export interface CertificateBranding {
  logo?: string; // data-URL image (PNG/JPG), uploaded in Admin → Certificates
  signature?: string; // data-URL image
  signatoryName?: string;
}

function dataUrlToImage(dataUrl: string): { bytes: Uint8Array; isPng: boolean } | null {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(dataUrl.trim());
  if (!m) return null;
  return { bytes: Uint8Array.from(Buffer.from(m[2], "base64")), isPng: m[1].toLowerCase() === "png" };
}

/** Render the certificate as a landscape A4 PDF — light (white/gold) design. */
export async function renderCertificatePdf(
  d: {
    studentName: string;
    courseTitle: string;
    certificateNumber: string;
    verificationCode: string;
    issuedDate: Date;
  },
  branding: CertificateBranding = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const navy = rgb(0.059, 0.09, 0.165); // #0F172A
  const gold = rgb(0.85, 0.55, 0.04); // slightly deeper gold for light background
  const blue = rgb(0.145, 0.388, 0.922); // #2563EB
  const white = rgb(1, 1, 1);
  const gray = rgb(0.42, 0.45, 0.5); // #6B7280
  const chipBg = rgb(0.945, 0.961, 0.976); // #F1F5F9
  const chipBorder = rgb(0.796, 0.835, 0.882); // #CBD5E1

  // Light background + double gold border
  page.drawRectangle({ x: 0, y: 0, width, height, color: white });
  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: gold, borderWidth: 2.5 });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: gold, borderWidth: 0.75 });

  const centerText = (text: string, y: number, font = helvetica, size = 14, color = navy) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };

  // Header — uploaded logo, or brand wordmark with tagline
  let drewLogo = false;
  const logoImage = branding.logo ? dataUrlToImage(branding.logo) : null;
  if (logoImage) {
    try {
      const img = logoImage.isPng ? await doc.embedPng(logoImage.bytes) : await doc.embedJpg(logoImage.bytes);
      const scale = Math.min(220 / img.width, 56 / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: (width - w) / 2, y: height - 58 - h, width: w, height: h });
      drewLogo = true;
    } catch {
      // fall through to the text wordmark
    }
  }
  if (!drewLogo) {
    centerText("CHRIXLIN.TECH", height - 88, helveticaBold, 26, gold);
    centerText("P R E M I U M   A I   A C A D E M Y", height - 104, helvetica, 9, gray);
  }

  centerText("CERTIFICATE OF COMPLETION", height - 160, helveticaBold, 30, navy);
  centerText("This certificate is proudly presented to", height - 196, helvetica, 12, gray);

  centerText(d.studentName, height - 244, timesItalic, 42, gold);
  page.drawLine({
    start: { x: width / 2 - 180, y: height - 258 },
    end: { x: width / 2 + 180, y: height - 258 },
    thickness: 1,
    color: gold,
  });

  centerText("for successfully completing the course", height - 284, helvetica, 12, gray);
  centerText(d.courseTitle, height - 312, helveticaBold, 19, navy);
  centerText(`Completed on ${formatDate(d.issuedDate)}`, height - 338, helvetica, 11, gray);

  // Tool badges row
  centerText("TOOLS  &  SKILLS  COVERED", height - 380, helveticaBold, 8, gray);
  const chipSize = 9;
  const chipPadX = 10;
  const chipH = 20;
  const chipGap = 8;
  const chipWidths = CERT_TOOLS.map(
    (t) => helveticaBold.widthOfTextAtSize(t, chipSize) + chipPadX * 2
  );
  const totalW = chipWidths.reduce((a, b) => a + b, 0) + chipGap * (CERT_TOOLS.length - 1);
  let chipX = (width - totalW) / 2;
  const chipY = height - 412;
  CERT_TOOLS.forEach((tool, i) => {
    page.drawRectangle({
      x: chipX,
      y: chipY,
      width: chipWidths[i],
      height: chipH,
      color: chipBg,
      borderColor: chipBorder,
      borderWidth: 0.75,
    });
    page.drawText(tool, {
      x: chipX + chipPadX,
      y: chipY + (chipH - chipSize) / 2 + 1,
      size: chipSize,
      font: helveticaBold,
      color: navy,
    });
    chipX += chipWidths[i] + chipGap;
  });

  // Footer left — certificate number & verification
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/certificate/${d.certificateNumber}`;
  page.drawText(`Certificate No: ${d.certificateNumber}`, { x: 60, y: 78, size: 11, font: helveticaBold, color: navy });
  page.drawText(`Verification Code: ${d.verificationCode}`, { x: 60, y: 62, size: 9, font: helvetica, color: gray });
  page.drawText(`Verify at: ${verifyUrl}`, { x: 60, y: 48, size: 9, font: helvetica, color: blue });

  // Footer right — signature image (if uploaded) above the signatory line
  const signatoryName = branding.signatoryName?.trim() || "Chrixlin.tech Academy";
  const sigNameW = helveticaBold.widthOfTextAtSize(signatoryName, 12);
  const sigLineW = Math.max(sigNameW, 150);
  const sigRight = width - 60;
  const sigImage = branding.signature ? dataUrlToImage(branding.signature) : null;
  if (sigImage) {
    try {
      const img = sigImage.isPng ? await doc.embedPng(sigImage.bytes) : await doc.embedJpg(sigImage.bytes);
      const scale = Math.min(150 / img.width, 44 / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      page.drawImage(img, { x: sigRight - sigLineW / 2 - w / 2, y: 90, width: w, height: h });
    } catch {
      // ignore bad image and fall through to plain signature block
    }
  }
  page.drawLine({
    start: { x: sigRight - sigLineW, y: 86 },
    end: { x: sigRight, y: 86 },
    thickness: 1,
    color: gray,
  });
  page.drawText(signatoryName, { x: sigRight - sigNameW, y: 70, size: 12, font: helveticaBold, color: navy });
  const authLabel = "Authorized Signatory";
  const authW = helvetica.widthOfTextAtSize(authLabel, 9);
  page.drawText(authLabel, { x: sigRight - authW, y: 56, size: 9, font: helvetica, color: gray });

  return doc.save();
}
