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

    // Apply transition only on subsequent navigation
    setIsVisible(false)
    
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 50) // Minimal delay for smooth transition

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div className={`${!isInitialLoad ? 'page-transition' : ''} ${isVisible ? 'fade-in' : ''}`}>
      {children}
    </div>
  )
}
