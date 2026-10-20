'use client'

import { CSSProperties, ImgHTMLAttributes, useEffect, useRef, useState } from 'react'
import { getPortfolioAsset, imageKey, imageSizes } from '@/lib/portfolio-images'
import './portfolio-image.css'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'loading'> & {
  src: string
  alt: string
  priority?: boolean
  mode?: 'gallery' | 'carousel' | 'thumbnail'
  enabled?: boolean
  revealDelay?: number
}

export default function PortfolioImage({
  src, alt, priority = false, mode = 'gallery', enabled, revealDelay = 0,
  sizes, style, onLoad, onError, ...props
}: Props) {
  const asset = getPortfolioAsset(src)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [nearby, setNearby] = useState(priority)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const eligible = enabled ?? (priority || nearby)
  const small = asset.variants.find((v) => v.size === 720) ?? asset.variants[0]
  const candidates = mode === 'thumbnail' ? [small] : asset.variants
  const source = candidates[0]
  const retry = attempt ? `&retry=${attempt}` : ''

  useEffect(() => {
    if (enabled !== undefined || priority || nearby) return
    const el = wrapperRef.current
    if (!el) return
    if (!('IntersectionObserver' in window)) { setNearby(true); return }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setNearby(true)
        observer.disconnect()
      }
    }, { rootMargin: `${Math.round(window.innerHeight / 2)}px ${Math.round(window.innerWidth / 2)}px` })
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, priority, nearby])

  // An eagerly server-rendered image can finish before hydration attaches its
  // load handler. Treat that cached/early success exactly like a later load.
  useEffect(() => {
    const image = imageRef.current
    if (eligible && image?.complete) {
      if (image.naturalWidth > 0) setLoaded(true)
      else setFailed(true)
    }
  }, [eligible, attempt, src])

  useEffect(() => {
    if (!eligible || loaded || failed) return
    const deadline = setTimeout(() => setFailed(true), 30_000)
    return () => clearTimeout(deadline)
  }, [eligible, loaded, failed, attempt])

  return (
    <span
      ref={wrapperRef}
      className={`portfolio-photo portfolio-photo-${mode}${loaded ? ' photo-ready' : ''}${failed ? ' photo-failed' : ''}`}
      data-image-key={imageKey(src)}
      tabIndex={-1}
      role="group"
      aria-label={alt}
      aria-busy={eligible && !loaded && !failed}
      style={{ aspectRatio: `${asset.width} / ${asset.height}`, '--photo-delay': `${revealDelay}ms` } as CSSProperties}
    >
      {(eligible || loaded) && !failed && (
        // R2 supplies the responsive variants; Next's global optimizer is intentionally bypassed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...props}
          ref={imageRef}
          src={source.src + retry}
          srcSet={mode === 'thumbnail' ? undefined : candidates.map((v) => `${v.src}${retry} ${v.width}w`).join(', ')}
          sizes={mode === 'thumbnail' ? undefined : sizes ?? imageSizes(asset, mode)}
          width={asset.width}
          height={asset.height}
          alt={alt}
          style={style}
          loading="eager"
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={(event) => { setLoaded(true); onLoad?.(event) }}
          onError={(event) => { setFailed(true); setLoaded(false); onError?.(event) }}
        />
      )}
      {failed && (mode === 'thumbnail' ? <span className="photo-retry">Photo unavailable. Open post</span> : (
        <button type="button" className="photo-retry" onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (document.activeElement === e.currentTarget) wrapperRef.current?.focus({ preventScroll: true })
            setFailed(false)
            setAttempt((n) => n + 1)
          }}
          aria-label={`Retry loading ${alt}`}>
          Photo unavailable. Retry
        </button>
      ))}
    </span>
  )
}
