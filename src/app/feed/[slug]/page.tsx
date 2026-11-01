import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FEED_POSTS, getFeedPost, getNextFeedPost } from '@/lib/feed-data'
import FeedArticle from './feed-article'

type Props = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return FEED_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getFeedPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} · Andrew Liu`,
    description: post.body[0],
  }
}

export default async function FeedArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getFeedPost(slug)
  if (!post) notFound()

  return <FeedArticle post={post} next={getNextFeedPost(slug)} />
}
