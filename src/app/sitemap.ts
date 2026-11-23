import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { listInnovations, listInnovators, listVillages } from "@/server/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = ["", "/innovations", "/innovators", "/villages", "/assessment", "/login", "/register"].map((p) => ({ url: `${base}${p}`, lastModified: new Date() }));
  try {
    const [innovations, villages, innovators] = await Promise.all([listInnovations({ publishedOnly: true, perPage: 200 }), listVillages(), listInnovators()]);
    return [
      ...staticPages,
      ...innovations.items.map((i) => ({ url: `${base}/innovations/${i.slug}`, lastModified: new Date(i.updatedAt) })),
      ...villages.map((v) => ({ url: `${base}/villages/${v.id}`, lastModified: new Date() })),
      ...innovators.map((n) => ({ url: `${base}/innovators/${n.id}`, lastModified: new Date() })),
    ];
  } catch { return staticPages; }
}
