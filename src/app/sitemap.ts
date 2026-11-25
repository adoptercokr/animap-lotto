import type { MetadataRoute } from 'next';
import { REGIONS, AREAS } from '@/lib/seoData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lotto.animap.co.kr';
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guide`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const regionPages: MetadataRoute.Sitemap = REGIONS.map((r) => ({
    url: `${baseUrl}/region/${r.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const areaPages: MetadataRoute.Sitemap = AREAS.map((a) => ({
    url: `${baseUrl}/area/${a.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...regionPages, ...areaPages];
}
