import type { MetadataRoute } from 'next'
import { FEED_POSTS } from '@/lib/feed-data'
import { SITE_URL } from '@/lib/site'

const works = [
  'wingspan',
  'nightfind-2026',
  'nightfind-2025',
  'nightfind-2024',
  'starry-night-2026',
  'lantern-fest-2026',
  'starry-night-2025',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/feed/`, changeFrequency: 'weekly', priority: 0.8 },
    ...FEED_POSTS.map((post) => ({ url: `${SITE_URL}/feed/${post.slug}/`, changeFrequency: 'yearly' as const, priority: 0.6 })),
    { url: `${SITE_URL}/photo/`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/photo/feed/`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/photo/about/`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/photo/contact/`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/photo/works/`, changeFrequency: 'monthly', priority: 0.7 },
    ...works.map((slug) => ({ url: `${SITE_URL}/photo/works/${slug}/`, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ]
}
