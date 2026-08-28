'use client'

import './feed.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import DynamicColumns from '@/components/DynamicColumns'
import { useCallback, useEffect, useRef, useState } from 'react'

type FeedPost = {
  id: number
  images: string[]
  alt: string
  // Short hover label in "Place | year" form (falls back to alt if unset).
  label?: string
}

// Base URL for R2 bucket root
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// New real carousel set uploaded to R2
const DC_2026_FOLDER = 'fuji-dc-2026-5-10'
const dcImageFilenames = [
  'DSCF9003',
  'DSCF9008',
  'DSCF9013',
  'DSCF9023',
  'DSCF9033',
  'DSCF9035',
  'DSCF9038',
]
const dcImages = dcImageFilenames.map((filename) => `${R2_BASE_URL}/${DC_2026_FOLDER}/${filename}-720w.webp`)

// Sony July 4, 2024 set
const SONY_JULY4_FOLDER = 'sony-july4-2024-7-4'
const sonyJuly4Images = ['DSC00858-Edit', 'DSC00876-Edit-Edit-2'].map(
  (filename) => `${R2_BASE_URL}/${SONY_JULY4_FOLDER}/${filename}-720w.webp`,
)

// Oregon, Cannon Beach 2024 set (images 1, 3, 4; second image moved to front)
const OREGON_CANNON_FOLDER = 'oregon-cannon-beach-2024-3-6'
const oregonCannonImages = ['DSC09716-2', 'DSC09715', 'DSC09720'].map(
  (filename) => `${R2_BASE_URL}/${OREGON_CANNON_FOLDER}/${filename}-720w.webp`,
)

// Sample data - in a real app this would come from an API or database.
// Cut down to a small set for now; add more posts here as needed.
// Each post supports one or more images, similar to an Instagram carousel post.
const posts: FeedPost[] = [
  // Newest first, oldest last.
  { id: 9, images: dcImages, alt: 'DC | May 2026', label: 'DC | 2026' },
  { id: 10, images: sonyJuly4Images, alt: 'July 4th | 2024' },
  { id: 11, images: oregonCannonImages, alt: 'Cannon Beach, Oregon | 2024', label: 'Oregon | 2024' },
]

// Load the intrinsic width/height of a remote image so slides can be sized to
// their real proportions (no letterboxing in the multi-image filmstrip).
const loadImageRatio = (src: string): Promise<{ w: number; h: number } | null> => {
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export default function ProjectSixPage() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  // Currently-selected feed filter (demo only - not wired up yet).
  const [activeFilter, setActiveFilter] = useState('Latest')
  // Bumped after a window resize settles, so the feed content remounts and
  // re-layouts cleanly after a mobile <-> desktop switch (avoids getting stuck).
  const [resizeNonce, setResizeNonce] = useState(0)
  // Fades the feed content in/out when crossing the mobile<->desktop breakpoint.
  const [contentVisible, setContentVisible] = useState(true)
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openModal = (postId: number) => {
    setSelectedPost(postId)
  }

  const closeModal = () => {
    setSelectedPost(null)
  }

  const selectedPostData = posts.find(post => post.id === selectedPost)
  const modalRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startClientX: number; startViewOffset: number; lastX: number; active: boolean }>({
    startClientX: 0,
    startViewOffset: 0,
    lastX: 0,
    active: false,
  })

  // Intrinsic ratios for each image in the open post, keyed by src. Used to size
  // slides to the image's real proportions so no letterboxing occurs in the
  // multi-image filmstrip (even spacing, uniform gap).
  const [imageRatios, setImageRatios] = useState<Record<string, { w: number; h: number }>>({})
  // Top dominant colours across the whole post (most prominent first), used for
  // the details-bar swatches (from /api/post-colors; R2 pixel reads are CORS-blocked).
  const [topColors, setTopColors] = useState<string[]>([])
  // Each image's dominant colour, aligned to the post's image list - drives the
  // active-colour dot as the carousel is navigated.
  const [perImageColors, setPerImageColors] = useState<string[]>([])
  // The image currently in view; drives the active dot's colour. Reset on open.
  const [activeIndex, setActiveIndex] = useState(0)
  // Current horizontal offset (px) applied to the track as `translateX(-x)`.
  const [viewOffset, setViewOffset] = useState(0)
  // True while the user is dragging the track (disables the ease transition).
  const [isDragging, setIsDragging] = useState(false)
  // Scroll progress of the carousel, used to drive the bold indicator bar.
  const [scrollProgress, setScrollProgress] = useState({ fraction: 0, width: 0 })
  // Whether the current post's images have been measured. The strip stays hidden
  // (then fades in) until slide widths are final, so the first image never
  // renders mis-aligned and then "jumps" once dimensions load.
  const [mediaReady, setMediaReady] = useState(false)
  // Throttle so each big wheel input advances exactly one image.
  const lastMoveRef = useRef(0)
  // Accumulated wheel scroll; advances only after a full threshold is reached.
  const wheelAccumRef = useRef(0)
  // Source-of-truth index for navigation (mirrored in the activeIndex state).
  const currentIndexRef = useRef(0)

  // Refresh the progress bar from the current offset.
  const refreshProgress = useCallback((x: number) => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setScrollProgress({
      fraction: max > 0 ? Math.min(1, Math.max(0, x / max)) : 0,
      width: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 0,
    })
  }, [])

  // Each image's horizontal resting position (the translateX amount that brings
  // that slide to the left edge with the 8px border inset).
  const slideTargets = useCallback(() => {
    const track = trackRef.current
    const slides = track ? Array.from(track.querySelectorAll<HTMLElement>('.modal-strip-slide')) : []
    return slides.map((s) => s.offsetLeft - 8)
  }, [])

  // Hard-limit the offset so the track can never scroll past the end of the
  // last image - the final image stays at the right edge instead of being
  // pulled to the front and leaving empty space on the right.
  const clampOffset = useCallback((x: number) => {
    const el = scrollRef.current
    const max = el ? Math.max(0, el.scrollWidth - el.clientWidth) : 0
    return Math.min(max, Math.max(0, x))
  }, [])

  // Move one step in `dir` (1 = next, -1 = previous). Position is derived from
  // the tracked index, so it can only ever rest on an image - never between.
  const moveBy = useCallback((dir: 1 | -1) => {
    const targets = slideTargets()
    if (targets.length === 0) return
    const target = Math.min(targets.length - 1, Math.max(0, currentIndexRef.current + dir))
    currentIndexRef.current = target
    setActiveIndex(target)
    const x = clampOffset(targets[target])
    setViewOffset(x)
    refreshProgress(x)
  }, [refreshProgress, slideTargets, clampOffset])

  // Snap to the image nearest an arbitrary offset (used on drag release), so
  // the carousel always rests cleanly on an image.
  const snapToNearest = useCallback((x: number) => {
    const targets = slideTargets()
    if (targets.length === 0) return
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < targets.length; i++) {
      const d = Math.abs(x - targets[i])
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    currentIndexRef.current = best
    setActiveIndex(best)
    const tx = clampOffset(targets[best])
    setViewOffset(tx)
    refreshProgress(tx)
  }, [refreshProgress, slideTargets, clampOffset])

  // Pointer drag-to-scroll. Pointer capture keeps the drag smooth and prevents
  // native image dragging / text selection while pulling the track sideways.
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mediaReady) return
    const el = scrollRef.current
    if (!el) return
    dragRef.current = {
      startClientX: event.clientX,
      startViewOffset: viewOffset,
      lastX: viewOffset,
      active: true,
    }
    setIsDragging(true)
    el.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const dx = event.clientX - dragRef.current.startClientX
    const nx = clampOffset(dragRef.current.startViewOffset - dx)
    dragRef.current.lastX = nx
    setViewOffset(nx)
    refreshProgress(nx)
  }

  const handlePointerEnd = () => {
    if (!dragRef.current.active) return
    const x = dragRef.current.lastX
    dragRef.current.active = false
    setIsDragging(false)
    snapToNearest(x)
  }

  // Click on the progress bar to jump to the image nearest that point.
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    const track = event.currentTarget
    if (!el) return
    const rect = track.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    snapToNearest(frac * max)
  }

  // Focus the modal and reset the carousel to the start when it opens.
  useEffect(() => {
    if (selectedPost !== null) {
      modalRef.current?.focus()
      setTopColors([])
      setPerImageColors([])
      setActiveIndex(0)
      setViewOffset(0)
      setIsDragging(false)
      setMediaReady(false)
      currentIndexRef.current = 0
      wheelAccumRef.current = 0
    }
  }, [selectedPost])

  // Measure image proportions and load the post's dominant colours; only then
  // reveal the filmstrip so the opening frame is already final.
  useEffect(() => {
    if (selectedPost === null || !selectedPostData) {
      return
    }

    let cancelled = false
    const srcs = selectedPostData.images

    const load = async () => {
      const isRemote = (s: string) => /^https:\/\//.test(s)
      const remote = srcs.filter(isRemote)
      const local = srcs.filter((s) => !isRemote(s))

      const ratioMap: Record<string, { w: number; h: number }> = {}
      // Local files need no network - measure directly and fast.
      const localEntries = await Promise.all(
        local.map(async (src) => [src, await loadImageRatio(src)] as const),
      )
      for (const [src, ratio] of localEntries) {
        if (ratio) {
          ratioMap[src] = ratio
        }
      }

      let data: {
        colors?: string[]
        perImage?: string[]
        ratios?: Record<string, { w: number; h: number }>
      } = {}
      if (remote.length > 0) {
        try {
          const res = await fetch('/api/post-colors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: remote }),
          })
          data = await res.json()
        } catch {
          // non-fatal - colours fall back to grey
        }
      }

      if (cancelled) return

      for (const src of remote) {
        if (data?.ratios?.[src]) {
          ratioMap[src] = data.ratios[src]
        }
      }
      setImageRatios(ratioMap)

      if (Array.isArray(data?.colors)) {
        setTopColors(data.colors)
      }
      if (Array.isArray(data?.perImage)) {
        // perImage is aligned to the remote list order; re-align to the full list.
        const colorBySrc: Record<string, string> = {}
        remote.forEach((src, i) => {
          const c = data.perImage?.[i]
          if (c) {
            colorBySrc[src] = c
          }
        })
        setPerImageColors(srcs.map((s) => colorBySrc[s] || ''))
      }

      if (!cancelled) {
        setMediaReady(true)
        setViewOffset(0)
        setActiveIndex(0)
        currentIndexRef.current = 0
        requestAnimationFrame(() => refreshProgress(0))
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [selectedPost, selectedPostData, refreshProgress])

  // Re-measure once the strip is actually laid out so the progress bar starts
  // showing the first image instead of a full-width fill. A double rAF runs
  // after the browser commits the slide layout.
  useEffect(() => {
    if (!mediaReady) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refreshProgress(viewOffset)
      })
    })
  }, [mediaReady, refreshProgress, viewOffset])

  // Mouse-wheel / Shift navigation: one image per scroll, throttled so it feels
  // stepped and "lazy" (no high-sensitivity sweep). Bound natively with
  // { passive: false } so we can prevent page scrolling behind the modal.
  useEffect(() => {
    const el = scrollRef.current
    if (selectedPost === null || !el) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      const now = Date.now()
      const dx = event.deltaX
      const dy = event.deltaY
      const magnitude = Math.abs(dy) >= Math.abs(dx) ? dy : dx
      if (magnitude === 0) return
      event.preventDefault()
      // Short debounce so a single wheel detent can't double-trigger.
      if (now - lastMoveRef.current < 100) return
      // Accumulate scroll; only advance once the user has scrolled a full
      // threshold (~2x a normal wheel notch), then reset - so it needs roughly
      // double the scroll input to move to the next image.
      wheelAccumRef.current += magnitude
      if (Math.abs(wheelAccumRef.current) < 240) return
      moveBy(wheelAccumRef.current < 0 ? -1 : 1)
      wheelAccumRef.current = 0
      lastMoveRef.current = now
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [selectedPost, moveBy])

  // Arrow keys step between images (same path as wheel); Escape closes.
  useEffect(() => {
    if (selectedPost === null) {
      return
    }

    const handleModalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        moveBy(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        moveBy(1)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setSelectedPost(null)
      }
    }

    window.addEventListener('keydown', handleModalKeyDown)
    return () => window.removeEventListener('keydown', handleModalKeyDown)
  }, [selectedPost, moveBy])

  // Exact column count for the Instagram grid, so the container width always
  // matches the real grid width (prevents clipping and preserves right-edge spacing).
  const gridColumns = Math.ceil(posts.length / 3)

  // After a window resize settles, remount the feed content so the horizontal
  // grid and text columns re-layout cleanly after a mobile <-> desktop switch.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const c = document.getElementById('container')
        if (c) void c.offsetHeight // force reflow so dvh/absolute positions settle
      }, 220)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Firefox's Alt-menu bar changes the viewport height WITHOUT a window resize;
  // listen to visualViewport so the layout re-measures and re-flows (fixes
  // content stuck "too high" after the menu bar shows/hides) instead of only
  // resolving on a manual refresh.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let t: ReturnType<typeof setTimeout>
    const onVvResize = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const c = document.getElementById('container')
        if (c) void c.offsetHeight // force reflow so dvh/absolute positions settle
      }, 220)
    }
    vv.addEventListener('resize', onVvResize)
    return () => {
      clearTimeout(t)
      vv.removeEventListener('resize', onVvResize)
    }
  }, [])

  // Cross the mobile<->desktop breakpoint: fade the feed out, let it re-layout,
  // then fade back in. Mirrors the reference's short page-fade and prevents the
  // layout from appearing "stuck" after switching sizes.
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
      // Going back to the wide layout: reset scroll so a scroll position from a
      // tall mobile scroll doesn't leave the wide layout's top/left cut off.
      if (!mq.matches) resetScroll()
      setContentVisible(false)
      setResizeNonce((n) => n + 1)
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = setTimeout(() => {
        // Re-assert scroll after the re-layout settles, so nothing stays offset.
        if (!mq.matches) resetScroll()
        requestAnimationFrame(() => requestAnimationFrame(() => setContentVisible(true)))
      }, 350)
    }
    mq.addEventListener('change', onBreakpoint)
    return () => {
      mq.removeEventListener('change', onBreakpoint)
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current)
    }
  }, [])

  // Stop Firefox from restoring (and sticking) a stored scroll offset on reload,
  // and always land at the top - otherwise the Feed top can stay clipped even
  // after a refresh.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <div className="layout project-six-layout">
      <Navigation />
      <div
        id="container"
        className="ie"
        style={{
          opacity: isColumnsReady && contentVisible ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          ['--ig-columns' as string]: gridColumns,
        }}
      >
        {!isColumnsReady && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            color: '#666',
            zIndex: 10
          }}>
            Preparing content...
          </div>
        )}
          <div className="post" key={resizeNonce}>
            <div className="info">
              <div className="title section">Feed</div>
              {/* Desktop filter buttons - sit in the title band with the Feed title. */}
              <div className="feed-filters feed-filters-desktop" aria-label="Filter feed">
                {(['Latest', 'Personal', 'Commercial', 'School'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`feed-filter feed-filter--${f.toLowerCase()}${activeFilter === f ? ' feed-filter--active' : ''}`}
                    title={f}
                    aria-label={f}
                    onClick={() => setActiveFilter(f)}
                  />
                ))}
              </div>
              <div className="clear"></div>
            </div>
            
            <div className="content">
              <DynamicColumns 
                columnWidth={200} 
                columnGap={40}
                onRenderComplete={() => {
                  setIsColumnsReady(true)
                  // The grid sits in-flow after the text; track its left edge so the
                  // title-band filter buttons stay aligned with the grid as the text
                  // columnizes (more columns on zoom pushes the grid right).
                  requestAnimationFrame(() => {
                    const grid = document.querySelector('.instagram-grid-full-height') as HTMLElement | null
                    const post = document.querySelector('.post') as HTMLElement | null
                    if (grid && post) {
                      // Grid's offset from the post's left edge (filters share post left).
                      document.documentElement.style.setProperty(
                        '--grid-left',
                        `${Math.round(grid.getBoundingClientRect().left - post.getBoundingClientRect().left)}px`
                      )
                    }
                  })
                }}
              >
                <p>The Horizontal Instagram Feed presents a unique take on social media grid layouts. This implementation flows horizontally across the entire page, creating an immersive scrolling experience.</p>
                <p>Instead of traditional scrollbars, the entire page scrolls horizontally to reveal more content. Each square maintains perfect proportions while filling the available height.</p>
                <p>The grid extends infinitely to the right, with the newest content appearing first. As you scroll, you journey through the collection in a cinematic flow.</p>
                <p>Scroll horizontally to explore the full grid, or click on any image to view it in detail.</p>
              </DynamicColumns>
            </div>

            {/* Mobile filter buttons - under the text, above the grid (hidden on desktop). */}
            <div className="feed-filters feed-filters-mobile" aria-label="Filter feed">
              {(['Latest', 'Personal', 'Commercial', 'School'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`feed-filter feed-filter--${f.toLowerCase()}${activeFilter === f ? ' feed-filter--active' : ''}`}
                  title={f}
                  aria-label={f}
                  onClick={() => setActiveFilter(f)}
                />
              ))}
            </div>

            {/* Instagram Grid that spans the full post height */}
            <div className="instagram-grid-full-height">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="instagram-grid-item-full"
                  onClick={() => openModal(post.id)}
                >
                  <div className="instagram-post-overlay">
                    <div className="overlay-content">
                      <span className="post-number">{post.label || post.alt}</span>
                    </div>
                  </div>
                  {post.images.length > 1 && (
                    <span className="carousel-indicator" aria-label="Multiple images in this post">
                      ⧉
                    </span>
                  )}
                  <Image
                    src={post.images[0]}
                    alt={post.alt}
                    width={200}
                    height={200}
                    className="instagram-grid-image"
                    priority={post.id <= 12}
                  />
                </div>
              ))}
            </div>

          </div>
          <div className="clear"></div>
        </div>

        {/* Modal for viewing individual posts */}
        {selectedPost && selectedPostData && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className={isDragging ? 'modal-content dragging' : 'modal-content'}
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
              tabIndex={-1}
            >
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
              {selectedPostData.images.length > 1 ? (
                <div
                  className="modal-media"
                  ref={scrollRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  style={{ opacity: mediaReady ? 1 : 0 }}
                >
                  {mediaReady && (
                    <div
                      ref={trackRef}
                      className="modal-strip"
                      style={{ transform: `translateX(${-viewOffset}px)` }}
                    >
                      {selectedPostData.images.map((src, index) => {
                        const ratio = imageRatios[src]
                        return (
                          <div
                            className="modal-strip-slide"
                            key={src + index}
                            style={{ aspectRatio: ratio ? `${ratio.w} / ${ratio.h}` : '4 / 3' }}
                          >
                            <Image
                              src={src}
                              alt={`${selectedPostData.alt} image ${index + 1}`}
                              fill
                              sizes="(max-width: 800px) 90vw, 800px"
                              className="modal-slide-image"
                              draggable={false}
                              onDragStart={(e) => e.preventDefault()}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="modal-media modal-media-single">
                  <div className="modal-single">
                    <Image
                      src={selectedPostData.images[0]}
                      alt={selectedPostData.alt}
                      fill
                      sizes="(max-width: 800px) 90vw, 800px"
                      className="modal-single-image"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                </div>
              )}

              {selectedPostData.images.length > 1 && (
                <div className="modal-status" onClick={handleProgressClick} title="Jump to image" aria-label="Jump to image">
                  <div className="modal-progress-track">
                    <div
                      className="modal-progress-indicator"
                      style={{
                        width: `${scrollProgress.width * 100}%`,
                        left: `calc(${scrollProgress.fraction} * (100% - ${scrollProgress.width * 100}%))`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="modal-details">
                <div className="modal-details-title">
                  <span
                    className="modal-details-dot"
                    aria-hidden="true"
                    style={{ background: perImageColors[activeIndex] || '#45573b' }}
                  />
                  <span className="modal-details-title-box">{selectedPostData.alt}</span>
                </div>
                <div className="modal-details-cell">Personal</div>
                <div className="modal-details-cell">
                  {selectedPostData.images.length}
                </div>
                <div className="modal-details-colors" aria-label="Post colours">
                  {(topColors.length
                    ? topColors
                    : Array.from({ length: Math.min(5, selectedPostData.images.length) }, () => '#e0e0e0')
                  ).map((color, index) => (
                    <span key={index} className="modal-details-color" style={{ background: color }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
