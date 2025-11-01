'use client'

import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'

interface ProjectPageProps {
  title: string
  children: React.ReactNode
}

export default function ProjectPage({ title, children }: Readonly<ProjectPageProps>) {
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Small delay to ensure content is mounted
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="home-header">
          <h1 className="home-name">{title}</h1>
        </div>
        <div className="content-area">
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
