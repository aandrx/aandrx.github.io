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
  const [dragging, setDragging] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const [wheeling, setWheeling] = useState(false)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; offset: number; active: boolean }>({ x: 0, offset: 0, active: false })
  const scrub = useRef(false)
  const wheelFrame = useRef(0)
  const wheelIdle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wheelTarget = useRef(0)
  const wheelCurrent = useRef(0)
  const wheelStartIndex = useRef(0)
  const wheelDirection = useRef(0)
  const wheelSettling = useRef(false)
  const wheelingRef = useRef(false)
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
  const nearestIndex = useCallback((offset: number) => {
    const points = targets()
    const max = maxOffset()
    if (offset >= max && max > 0) return Math.max(0, points.length - 1)
    let best = 0
    points.forEach((point, index) => {
      if (Math.abs(point - offset) < Math.abs(points[best] - offset)) best = index
    })
    return best
  }, [targets, maxOffset])
  const nearest = useCallback((offset: number) => {
    jumpTo(nearestIndex(offset))
  }, [nearestIndex, jumpTo])

  const wheelSnapIndex = useCallback((offset: number) => {
    const points = targets()
    if (!points.length) return 0
    const startIndex = Math.max(0, Math.min(points.length - 1, wheelStartIndex.current))
    const start = points[startIndex]
    const nearest = nearestIndex(offset)
    if (wheelDirection.current > 0) {
      const nextIndex = Math.min(points.length - 1, startIndex + 1)
      const gap = points[nextIndex] - start
      if (gap > 0 && offset > start + gap * 0.25) return Math.max(nearest, nextIndex)
    } else if (wheelDirection.current < 0) {
      const previousIndex = Math.max(0, startIndex - 1)
      const gap = start - points[previousIndex]
      if (gap > 0 && offset < start - gap * 0.25) return Math.min(nearest, previousIndex)
    }
    return nearest
  }, [nearestIndex, targets])

  const paintTrack = useCallback((offset: number) => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (!track) return
    track.style.setProperty('--modal-offset', `${offset}px`)
    const indicator = indicatorRef.current
    if (!indicator || !viewport) return
    const max = Math.max(0, track.scrollWidth - viewport.clientWidth)
    const width = track.scrollWidth ? Math.min(1, viewport.clientWidth / track.scrollWidth) : 1
    const fraction = max ? offset / max : 0
    indicator.style.width = `${width * 100}%`
    indicator.style.left = `${fraction * (1 - width) * 100}%`
  }, [])

  const currentTrackOffset = useCallback(() => {
    const track = trackRef.current
    const transform = track ? getComputedStyle(track).transform : ''
    if (transform && transform !== 'none') {
      try { return -new DOMMatrixReadOnly(transform).m41 } catch { /* use state fallback */ }
    }
    return positionRef.current.offset
  }, [])

  const stepWheel = useCallback(() => {
    wheelFrame.current = 0
    const target = wheelTarget.current
    const difference = target - wheelCurrent.current
    const factor = wheelSettling.current ? 0.12 : 0.24
    wheelCurrent.current = Math.abs(difference) < 0.4
      ? target
      : wheelCurrent.current + difference * factor
    paintTrack(wheelCurrent.current)
    const index = nearestIndex(wheelCurrent.current)
    if (index !== positionRef.current.index) {
      const points = targets()
      update(points[index] ?? 0, index)
    }
    if (wheelSettling.current && Math.abs(target - wheelCurrent.current) < 0.4) {
      wheelCurrent.current = target
      paintTrack(target)
      const points = targets()
      const settledIndex = wheelSnapIndex(target)
      update(points[settledIndex] ?? 0, settledIndex)
      wheelSettling.current = false
      wheelingRef.current = false
      setWheeling(false)
      return
    }
    if (Math.abs(target - wheelCurrent.current) >= 0.4) {
      wheelFrame.current = requestAnimationFrame(stepWheel)
    }
  }, [nearestIndex, paintTrack, targets, update, wheelSnapIndex])

  const settleWheel = useCallback(() => {
    if (!wheelingRef.current) return
    const points = targets()
    const index = wheelSnapIndex(wheelTarget.current)
    wheelSettling.current = true
    wheelTarget.current = Math.max(0, Math.min(maxOffset(), points[index] ?? wheelCurrent.current))
    if (!wheelFrame.current) wheelFrame.current = requestAnimationFrame(stepWheel)
  }, [maxOffset, stepWheel, targets, wheelSnapIndex])

  const cancelWheel = useCallback(() => {
    if (wheelIdle.current) {
      clearTimeout(wheelIdle.current)
      wheelIdle.current = null
    }
    cancelAnimationFrame(wheelFrame.current)
    wheelFrame.current = 0
    wheelSettling.current = false
    if (!wheelingRef.current) return
    wheelingRef.current = false
    const points = targets()
    const index = nearestIndex(wheelCurrent.current)
    update(points[index] ?? 0, index)
    setWheeling(false)
  }, [nearestIndex, targets, update])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const measure = () => {
      measuredTargets.current = Array.from(track.children).map((slide) => (slide as HTMLElement).offsetLeft - 8)
      setViewportWidth(viewport.clientWidth)
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

  useLayoutEffect(() => {
    if (!wheeling) paintTrack(position.offset)
  }, [paintTrack, position.offset, viewportWidth, wheeling])

  useEffect(() => {
    const el = viewportRef.current
    if (!el || post.images.length < 2) return
    const onWheel = (event: WheelEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return
      const magnitude = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (!magnitude) return
      event.preventDefault()

      if (!wheelingRef.current) {
        wheelingRef.current = true
        wheelSettling.current = false
        setWheeling(true)
        wheelStartIndex.current = positionRef.current.index
        wheelCurrent.current = currentTrackOffset()
        wheelTarget.current = wheelCurrent.current
        paintTrack(wheelCurrent.current)
      } else if (wheelSettling.current) {
        wheelSettling.current = false
        wheelStartIndex.current = positionRef.current.index
        wheelTarget.current = wheelCurrent.current
      }

      const delta = magnitude * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1) * 1.6
      wheelDirection.current = delta > 0 ? 1 : delta < 0 ? -1 : 0
      wheelTarget.current = Math.max(0, Math.min(maxOffset(), wheelTarget.current + delta))
      if (wheelIdle.current) clearTimeout(wheelIdle.current)
      wheelIdle.current = setTimeout(() => {
        wheelIdle.current = null
        settleWheel()
      }, 140)
      if (!wheelFrame.current) wheelFrame.current = requestAnimationFrame(stepWheel)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      if (wheelIdle.current) {
        clearTimeout(wheelIdle.current)
        wheelIdle.current = null
      }
      cancelAnimationFrame(wheelFrame.current)
      wheelFrame.current = 0
      wheelingRef.current = false
    }
  }, [currentTrackOffset, maxOffset, paintTrack, post.images.length, settleWheel, stepWheel])

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
      cancelWheel()
      moveBy(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1)
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      cancelWheel()
      jumpTo(event.key === 'Home' ? 0 : post.images.length - 1)
    }
  }
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button')) return
    cancelWheel()
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
  const points = targets()

  return (
    <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`modal-content${dragging ? ' dragging' : ''}${scrubbing ? ' scrubbing' : ''}${wheeling ? ' wheeling' : ''}`} onKeyDown={onKeyDown}>
        <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label="Close photo carousel">×</button>
        <div className={`modal-media${post.images.length === 1 ? ' modal-media-single' : ''}`} ref={viewportRef} onPointerDown={pointerDown} onPointerMove={pointerMove}
          onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
          <div ref={trackRef} className={`modal-strip${post.images.length === 1 ? ' modal-strip-single' : ''}`}>
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
            onPointerDown={(event) => { cancelWheel(); scrub.current = true; setScrubbing(true); event.currentTarget.setPointerCapture(event.pointerId); scrubTo(event.clientX) }}
            onPointerMove={(event) => { if (scrub.current) scrubTo(event.clientX) }} onPointerUp={scrubEnd} onPointerCancel={scrubEnd}>
            <div className="modal-progress-track"><div ref={indicatorRef} className="modal-progress-indicator" /></div>
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
