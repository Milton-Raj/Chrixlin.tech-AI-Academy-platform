import { prisma } from "@/lib/db";

/**
 * All admin-editable site content and configuration lives in the Setting
 * key/value table so the landing page updates without code changes (CMS).
 */
export const SETTING_DEFAULTS: Record<string, string> = {
  // Hero / CMS text
  heroHeadline: "Master AI, Automation & Digital Growth Skills in Just 15 Days",
  heroSubheadline:
    "Learn ChatGPT, Claude AI, Gemini, Perplexity, n8n, Make, AI Agents, Automation Systems and Business Workflows through live training, real-world projects and certification.",
  heroBadge: "Live Cohort • Limited Seats",

  // Call-to-action + offer countdown (admin controlled)
  ctaText: "Enroll Now",
  offerTimerMinutes: "15", // per-visitor countdown; 0 hides the timer
  offerTimerLabel: "Hurry! Offer price expires in",

  // Certificate branding (logo/signature stored as data-URL images)
  certLogo: "",
  certSignature: "",
  certSignatoryName: "Chrixlin.tech Academy",

  // Trust counters (admin controlled)
  statsStudents: "1200",
  statsProjects: "3400",
  statsCertificates: "950",
  statsWorkshops: "85",

  // Pre-batch reminder emails — hours before start. Set either to 0 to disable.
  reminderHours1: "24",
  reminderHours2: "1",

  // Written by the cron endpoint so the admin can see the scheduler is alive.
  cronLastRunAt: "",

  // Batch automation
  parallelBatches: "2", // future batches always kept open
  defaultCapacity: "25",
  batchStaggerDays: "7", // gap between parallel batch start dates
  firstBatchLeadDays: "7", // if no future batch exists, first one starts this many days out

  // Contact
  contactEmail: "hello@chrixlin.tech",
  contactWhatsapp: "+91 90000 00000",
  socialLinkedin: "https://linkedin.com/company/chrixlin",
  socialInstagram: "https://instagram.com/chrixlin.tech",
  socialYoutube: "https://youtube.com/@chrixlin",
  socialTwitter: "https://x.com/chrixlin",
};

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const map: Settings = { ...SETTING_DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSettings(values: Record<string, string>) {
  const entries = Object.entries(values);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
}

export function settingInt(settings: Settings, key: string, fallback: number): number {
  const n = parseInt(settings[key] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}
