'use client'

import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { feedPosts } from '@/lib/feed-posts'
import PortfolioImage from '@/components/PortfolioImage'
import FeedCarousel from '@/components/FeedCarousel'

export default function FeedGallery() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const close = useCallback(() => setSelectedId(null), [])
  const selected = feedPosts.find((post) => post.id === selectedId)
  return (
    <>
      <div className="instagram-grid-full-height">
        {feedPosts.map((post, index) => (
          <button key={post.id} type="button" className="instagram-grid-item-full" onClick={() => setSelectedId(post.id)}
            aria-label={`Open ${post.alt}, ${post.images.length} photos`} aria-haspopup="dialog">
            <span className="instagram-post-overlay"><span className="overlay-content"><span className="post-number">{post.label || post.alt}</span></span></span>
            {post.images.length > 1 && <span className="carousel-indicator" aria-hidden="true">⧉</span>}
            <PortfolioImage src={post.cover} alt={post.alt} mode="thumbnail" className="instagram-grid-image" priority={index === 0} />
          </button>
        ))}
      </div>
      {selected && createPortal(<FeedCarousel key={selected.id} post={selected} onClose={close} />, document.body)}
    </>
  )
}
