import type { MetadataRoute } from 'next'
import { FEED_POSTS } from '@/lib/feed-data'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.andrxwliu.me'

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
    { url: `${baseUrl}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/feed/`, changeFrequency: 'weekly', priority: 0.8 },
    ...FEED_POSTS.map((post) => ({ url: `${baseUrl}/feed/${post.slug}/`, changeFrequency: 'yearly' as const, priority: 0.6 })),
    { url: `${baseUrl}/photo/`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/photo/feed/`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/photo/about/`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/photo/contact/`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/photo/works/`, changeFrequency: 'monthly', priority: 0.7 },
    ...works.map((slug) => ({ url: `${baseUrl}/photo/works/${slug}/`, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ]
}
