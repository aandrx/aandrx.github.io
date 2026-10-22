'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const HORIZONTAL_LAYOUTS = '.portfolio-gallery-layout, .project-six-layout, .project-five-layout'

export default function HorizontalWheelScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (!document.querySelector(HORIZONTAL_LAYOUTS)) return

    const scroller = document.scrollingElement as HTMLElement | null
    if (!scroller) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobile = window.matchMedia('(max-width: 768px)')
    let target = scroller.scrollLeft
    let current = target
    let frame = 0
    let animating = false

    const maxScroll = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth)
    const clamp = (value: number) => Math.max(0, Math.min(maxScroll(), value))

    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      animating = false
    }

    const animate = () => {
      const difference = target - current
      if (Math.abs(difference) < 0.5) {
        current = target
        scroller.scrollLeft = current
        animating = false
        frame = 0
        return
      }
      current += difference * 0.22
      scroller.scrollLeft = current
      frame = requestAnimationFrame(animate)
    }

    const start = () => {
      if (frame) return
      current = scroller.scrollLeft
      animating = true
      frame = requestAnimationFrame(animate)
    }

    const canScrollVertically = (node: Element, deltaY: number) => {
      for (let element = node as HTMLElement | null; element && element !== document.body; element = element.parentElement) {
        const style = getComputedStyle(element)
        if (!/(auto|scroll)/.test(style.overflowY)) continue
        const room = deltaY > 0
          ? element.scrollHeight - element.clientHeight - element.scrollTop
          : element.scrollTop
        if (room > 1) return true
      }
      return false
    }

    const onWheel = (event: WheelEvent) => {
      if (mobile.matches) return
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return
      if (maxScroll() <= 0) return

      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      if (horizontal) {
        stop()
        target = current = scroller.scrollLeft
        return
      }

      const delta = event.deltaY * (
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1
      )
      if (!delta) return

      const element = event.target instanceof Element ? event.target : null
      if (element?.closest('[role="dialog"]')) return
      if (element && canScrollVertically(element, delta)) return

      event.preventDefault()
      target = clamp(target + delta)

      if (reducedMotion.matches) {
        stop()
        current = target
        scroller.scrollLeft = target
        return
      }

      start()
    }

    const onScroll = () => {
      if (animating) {
        if (Math.abs(scroller.scrollLeft - current) > 2) {
          stop()
          target = current = scroller.scrollLeft
        }
        return
      }
      target = current = scroller.scrollLeft
    }

    const onResize = () => {
      target = clamp(target)
      if (!animating) current = scroller.scrollLeft
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [pathname])

  return null
}
