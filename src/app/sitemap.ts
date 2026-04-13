import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://niejedzie.pl";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/opoznienia`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/cennik`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
