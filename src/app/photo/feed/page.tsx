'use client'

import './feed.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import FeedGallery from '@/components/FeedGallery'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

const FeedIntroduction = memo(function FeedIntroduction({ onReady }: { onReady: () => void }) {
  return (
    <DynamicColumns columnWidth={200} columnGap={40} onRenderComplete={onReady}>
      <p>The Horizontal Instagram Feed presents a unique take on social media grid layouts. This implementation flows horizontally across the entire page, creating an immersive scrolling experience.</p>
      <p>Instead of traditional scrollbars, the entire page scrolls horizontally to reveal more content. Each square maintains perfect proportions while filling the available height.</p>
      <p>The grid extends infinitely to the right, with the newest content appearing first. As you scroll, you journey through the collection in a cinematic flow.</p>
      <p>Scroll horizontally to explore the full grid, or click on any image to view it in detail.</p>
    </DynamicColumns>
  )
})

function FeedFilters({ mobile = false, activeFilter, onSelect }: { mobile?: boolean; activeFilter: string; onSelect: (filter: string) => void }) {
  // These controls retain their existing demo-only behavior.
  return (
    <div className={`feed-filters feed-filters-${mobile ? 'mobile' : 'desktop'}`} aria-label="Filter feed">
      {(['Latest', 'Personal', 'Commercial', 'School'] as const).map((filter) => (
        <button key={filter} type="button" title={filter} aria-label={filter} aria-pressed={filter === activeFilter}
          className={`feed-filter feed-filter--${filter.toLowerCase()}${filter === activeFilter ? ' feed-filter--active' : ''}`}
          onClick={() => onSelect(filter)} />
      ))}
    </div>
  )
}

export default function FeedPage() {
  const [activeFilter, setActiveFilter] = useState('Latest')
  const [contentVisible, setContentVisible] = useState(true)
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const alignFilters = useCallback(() => {
    const grid = document.querySelector('.instagram-grid-full-height')
    const post = document.querySelector('.post')
    if (grid && post) document.documentElement.style.setProperty('--grid-left', `${Math.round(grid.getBoundingClientRect().left - post.getBoundingClientRect().left)}px`)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const resetScroll = () => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.documentElement.scrollLeft = 0
      document.body.scrollTop = 0
      document.body.scrollLeft = 0
    }
    const onBreakpoint = () => {
      if (!mq.matches) resetScroll()
      setContentVisible(false)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
      fadeTimer.current = setTimeout(() => {
        if (!mq.matches) resetScroll()
        setContentVisible(true)
        alignFilters()
      }, 350)
    }
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    resetScroll()
    mq.addEventListener('change', onBreakpoint)
    window.addEventListener('resize', alignFilters)
    window.visualViewport?.addEventListener('resize', alignFilters)
    return () => {
      window.history.scrollRestoration = previous
      mq.removeEventListener('change', onBreakpoint)
      window.removeEventListener('resize', alignFilters)
      window.visualViewport?.removeEventListener('resize', alignFilters)
      if (fadeTimer.current) clearTimeout(fadeTimer.current)
    }
  }, [alignFilters])

  return (
    <div className="layout project-six-layout" id="feed-background">
      <Navigation />
      <div id="container" className="ie" style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="post">
          <div className="info">
            <div className="title section">Feed</div>
            <FeedFilters activeFilter={activeFilter} onSelect={setActiveFilter} />
            <div className="clear" />
          </div>
          <div className="content"><FeedIntroduction onReady={alignFilters} /></div>
          <FeedFilters mobile activeFilter={activeFilter} onSelect={setActiveFilter} />
          <FeedGallery />
        </div>
        <div className="clear" />
      </div>
    </div>
  )
}
