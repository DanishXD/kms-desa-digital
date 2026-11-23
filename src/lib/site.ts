// Origin situs untuk metadata/SEO. Urutan: env eksplisit → domain Vercel → localhost.
const trimSlash = (url: string) => url.replace(/\/+$/, "");

function withHttps(host: string): string {
  const value = trimSlash(host);
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function siteUrl(): string {
  const explicit = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return trimSlash(explicit);
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return withHttps(production);
  const preview = process.env.VERCEL_URL;
  if (preview) return withHttps(preview);
  return "http://localhost:3000";
}
