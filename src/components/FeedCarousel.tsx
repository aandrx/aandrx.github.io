'use client'

import { KeyboardEvent, PointerEvent, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { FeedPost } from '@/lib/feed-posts'
import { getPortfolioAsset } from '@/lib/portfolio-images'
import PortfolioImage from '@/components/PortfolioImage'

export default function FeedCarousel({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ offset: 0, index: 0 })
  const positionRef = useRef(position)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [trackWidth, setTrackWidth] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const drag = useRef<{ x: number; offset: number; active: boolean }>({ x: 0, offset: 0, active: false })
  const scrub = useRef(false)
  const wheel = useRef({ amount: 0, last: 0 })
  const measuredTargets = useRef<number[]>([])
  const assets = post.images.map(getPortfolioAsset)

  // Slide geometry changes on resize, not on every pointer movement or load.
  const targets = useCallback(() => measuredTargets.current, [])
  const maxOffset = useCallback(() => Math.max(0, (trackRef.current?.scrollWidth ?? 0) - (viewportRef.current?.clientWidth ?? 0)), [])
  const update = useCallback((offset: number, index: number) => {
    const next = { offset: Math.max(0, Math.min(maxOffset(), offset)), index }
    positionRef.current = next
    setPosition(next)
  }, [maxOffset])
  const jumpTo = useCallback((index: number) => {
    const points = targets()
    const target = Math.min(points.length - 1, Math.max(0, index))
    if (target >= 0) update(points[target], target)
  }, [targets, update])
  const moveBy = useCallback((direction: number) => jumpTo(positionRef.current.index + direction), [jumpTo])
  const nearest = useCallback((offset: number) => {
    const points = targets()
    const max = maxOffset()
    if (offset >= max && max > 0) { jumpTo(points.length - 1); return }
    let best = 0
    points.forEach((point, index) => {
      if (Math.abs(point - offset) < Math.abs(points[best] - offset)) best = index
    })
    jumpTo(best)
  }, [targets, maxOffset, jumpTo])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const measure = () => {
      measuredTargets.current = Array.from(track.children).map((slide) => (slide as HTMLElement).offsetLeft - 8)
      setViewportWidth(viewport.clientWidth)
      setTrackWidth(track.scrollWidth)
      jumpTo(positionRef.current.index)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    return () => observer.disconnect()
  }, [jumpTo])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const roots = [document.documentElement, document.body]
    const overflow = roots.map((el) => ({ value: el.style.getPropertyValue('overflow'), priority: el.style.getPropertyPriority('overflow') }))
    roots.forEach((el) => el.style.setProperty('overflow', 'hidden', 'important'))
    // Isolate the background from keyboard and assistive-technology navigation.
    const background = document.getElementById('feed-background')
    const wasInert = background?.inert ?? false
    if (background) background.inert = true
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      roots.forEach((el, index) => {
        if (overflow[index].value) el.style.setProperty('overflow', overflow[index].value, overflow[index].priority)
        else el.style.removeProperty('overflow')
      })
      if (background) background.inert = wasInert
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      const magnitude = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (!magnitude) return
      event.preventDefault()
      const now = Date.now()
      if (now - wheel.current.last < 100) return
      wheel.current.amount += magnitude * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1)
      if (Math.abs(wheel.current.amount) < 240) return
      moveBy(wheel.current.amount < 0 ? -1 : 1)
      wheel.current = { amount: 0, last: now }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [moveBy])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
    if (event.key === 'Tab') {
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]') ?? []).filter((el) => el.getClientRects().length && !el.closest('[inert]'))
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      return
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
      moveBy(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      jumpTo(event.key === 'Home' ? 0 : post.images.length - 1)
    }
  }
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return
    drag.current = { x: event.clientX, offset: positionRef.current.offset, active: true }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    update(drag.current.offset - (event.clientX - drag.current.x), positionRef.current.index)
  }
  const pointerEnd = () => {
    if (!drag.current.active) return
    drag.current.active = false
    setDragging(false)
    nearest(positionRef.current.offset)
  }
  const scrubTo = (clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect()
    if (rect?.width) nearest(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) * maxOffset())
  }
  const scrubEnd = () => { scrub.current = false; setScrubbing(false) }
  const max = Math.max(0, trackWidth - viewportWidth)
  const fraction = max ? position.offset / max : 0
  const indicatorWidth = trackWidth ? Math.min(1, viewportWidth / trackWidth) : 1
  const points = targets()

  return (
    <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`modal-content${dragging ? ' dragging' : ''}${scrubbing ? ' scrubbing' : ''}`} onKeyDown={onKeyDown}>
        <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label="Close photo carousel">×</button>
        <div className={`modal-media${post.images.length === 1 ? ' modal-media-single' : ''}`} ref={viewportRef} onPointerDown={pointerDown} onPointerMove={pointerMove}
          onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
          <div ref={trackRef} className={`modal-strip${post.images.length === 1 ? ' modal-strip-single' : ''}`} style={{ transform: `translateX(${-position.offset}px)` }}>
            {post.images.map((src, index) => {
              const asset = assets[index]
              const start = points[index] ?? 0
              const end = start + (points[index + 1] !== undefined ? points[index + 1] - start : viewportRef.current?.clientHeight ?? 520)
              // Initial SSR/client frame starts with the first group. Once measured,
              // retain one-half viewport of lookahead on both sides of the visible window.
              const enabled = viewportWidth === 0 ? index < 3 : end >= position.offset - viewportWidth / 2 && start <= position.offset + viewportWidth * 1.5
              const visible = viewportWidth === 0 ? index < 3 : end > position.offset && start < position.offset + viewportWidth
              return (
                <div className="modal-strip-slide" key={src} aria-hidden={!visible} ref={(element) => { if (element) element.inert = !visible }} style={{ aspectRatio: `${asset.width} / ${asset.height}` }}>
                  <PortfolioImage src={src} alt={`${post.alt} image ${index + 1}`} mode="carousel" enabled={enabled}
                    priority={index === position.index} className="modal-slide-image" draggable={false}
                    onDragStart={(event) => event.preventDefault()} revealDelay={index < 3 ? index * 35 : 0} />
                </div>
              )
            })}
          </div>
        </div>
        {post.images.length > 1 && (
          <div ref={progressRef} className="modal-status" role="slider" tabIndex={0} aria-label="Choose photo"
            aria-valuemin={1} aria-valuemax={post.images.length} aria-valuenow={position.index + 1}
            aria-valuetext={`Photo ${position.index + 1} of ${post.images.length}`}
            onPointerDown={(event) => { scrub.current = true; setScrubbing(true); event.currentTarget.setPointerCapture(event.pointerId); scrubTo(event.clientX) }}
            onPointerMove={(event) => { if (scrub.current) scrubTo(event.clientX) }} onPointerUp={scrubEnd} onPointerCancel={scrubEnd}>
            <div className="modal-progress-track"><div className="modal-progress-indicator" style={{ width: `${indicatorWidth * 100}%`, left: `${fraction * (1 - indicatorWidth) * 100}%` }} /></div>
          </div>
        )}
        <span className="visually-hidden" role="status" aria-live="polite">Photo {position.index + 1} of {post.images.length}</span>
        <div className="modal-details">
          <div className="modal-details-title">
            <span className="modal-details-dot" aria-hidden="true" style={{ background: assets[position.index].color }} />
            <span className="modal-details-title-box" id={titleId}>{post.alt}</span>
          </div>
          <div className="modal-details-cell">Personal</div>
          <div className="modal-details-cell">{post.images.length}</div>
          <div className="modal-details-colors" role="img" aria-label={`Post colours: ${post.colors.join(', ')}`}>{post.colors.map((color, index) => <span key={index} className="modal-details-color" style={{ background: color }} />)}</div>
        </div>
      </div>
    </div>
  )
}
