import Image from 'next/image'
import Link from 'next/link'
import type { FeedPost } from '@/lib/feed-data'
import FeedTop from '../feed-top'
import '../feed.css'
import './feed-article.css'

type Props = {
  post: FeedPost
  next?: FeedPost
}

export default function FeedArticle({ post, next }: Props) {
  return (
    <main className="feed-page feed-article" data-feed-article={post.slug}>
      <FeedTop />

      <article className="feed-article-main">
        <header className="feed-article-head">
          <h1>{post.title}</h1>
          <p className="feed-article-date"><time dateTime={post.dateTime}>{post.date}</time></p>
        </header>

        {post.image ? (
          <figure className="feed-figure">
            <Image
              src={post.image}
              alt={post.imageAlt ?? post.title}
              width={post.imageWidth ?? 1600}
              height={post.imageHeight ?? 1067}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>From the Museum collection.</figcaption>
          </figure>
        ) : null}

        <div className="feed-body">
          {post.body.map((paragraph, index) => (
            <p key={`${post.slug}-${index}`}>{paragraph}</p>
          ))}
        </div>

        {post.links?.length ? (
          <div className="feed-related" aria-label="Related links">
            <span>Related</span>
            {post.links.map((link) => link.href.startsWith('http')
              ? <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
              : <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </div>
        ) : null}

        <footer className="feed-article-foot">
          <Link href="/feed/">← Feed</Link>
          {next ? (
            <Link href={`/feed/${next.slug}/`}>Next: {next.title} →</Link>
          ) : (
            <Link href="/">Work →</Link>
          )}
        </footer>
      </article>
    </main>
  )
}
