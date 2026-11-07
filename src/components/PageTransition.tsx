'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

const RESTORE_TIMEOUT_MS = 3000

function getEntryKey(pathname: string) {
  const state = window.history.state && typeof window.history.state === 'object' ? window.history.state : {}
  if (typeof state.__scrollKey === 'string') return state.__scrollKey
  const key = window.crypto?.randomUUID?.() ?? `${pathname}:${performance.now()}`
  window.history.replaceState({ ...state, __scrollKey: key }, '')
  return key
}

export default function PageTransition({ children }: Readonly<PageTransitionProps>) {
  const pathname = usePathname()
  const initialPathname = useRef(pathname)
  const hasNavigated = useRef(false)
  const scrollPositions = useRef(new Map<string, number>())
  const restoringEntry = useRef(false)
  const restoreTarget = useRef<number | null>(null)
  const restorePath = useRef<string | null>(null)
  const currentPathname = useRef(pathname)
  const [restoreToken, setRestoreToken] = useState(0)

  if (pathname !== initialPathname.current) hasNavigated.current = true
  currentPathname.current = pathname

  useEffect(() => {
    const save = () => {
      if (restoringEntry.current) return
      const key = getEntryKey(pathname)
      scrollPositions.current.set(key, window.scrollY)
    }
    save()
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [pathname])

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname
      const key = getEntryKey(path)
      // Same-page hash history is owned by the browser. Only restore when the
      // history entry changes the route.
      if (path === currentPathname.current) return
      const target = scrollPositions.current.get(key)
      restoringEntry.current = target !== undefined
      restorePath.current = target === undefined ? null : path
      restoreTarget.current = target ?? null
      setRestoreToken((value) => value + 1)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    const target = restoreTarget.current
    if (target === null || restorePath.current !== pathname) {
      restoringEntry.current = false
      restoreTarget.current = null
      restorePath.current = null
      return
    }
    let frame = 0
    let completed = false
    const deadline = performance.now() + RESTORE_TIMEOUT_MS
    const restore = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      if (maxScroll >= target || performance.now() >= deadline) {
        window.scrollTo(0, Math.min(target, maxScroll))
        restoringEntry.current = false
        restoreTarget.current = null
        restorePath.current = null
        completed = true
        return
      }
      frame = window.requestAnimationFrame(restore)
    }
    frame = window.requestAnimationFrame(restore)
    return () => {
      window.cancelAnimationFrame(frame)
      if (!completed) {
        restoringEntry.current = false
        restoreTarget.current = null
        restorePath.current = null
      }
    }
  }, [pathname, restoreToken])

  return (
    <div key={pathname} className={`page-transition${hasNavigated.current ? '' : ' is-initial'}`}>
      {children}
    </div>
  )
}
