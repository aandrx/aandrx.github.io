'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(true) // Start visible for immediate content
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    // Skip transition on initial load
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return
    }

    // Apply transition to entire layout (including sidebar) on navigation
    setIsVisible(false)
    
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 150) // Quick fade for smooth navigation

    return () => clearTimeout(timer)
  }, [pathname, isInitialLoad])

  return (
    <div className={`${!isInitialLoad ? 'page-transition' : ''} ${isVisible ? 'fade-in' : ''}`}>
      {children}
    </div>
  )
}
