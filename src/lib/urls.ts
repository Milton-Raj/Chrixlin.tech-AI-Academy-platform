/**
 * Public base URL without a trailing slash. NEXT_PUBLIC_APP_URL is often
 * entered with one (Vercel's UI even suggests it), which produced links like
 * https://site.app//certificate/... in emails and PDFs.
 */
export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
