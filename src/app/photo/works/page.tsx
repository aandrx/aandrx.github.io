'use client'

import Link from 'next/link'
import Navigation from '@/components/Navigation'
import PortfolioImage from '@/components/PortfolioImage'
import { useState, useEffect } from 'react'

const projects = [
  {
    id: 1,
    title: 'Wingspan',
    image: 'fuji-gt-2024-11-12-17-3/DSCF3711-Edit-Edit',
    alt: 'Wingspan collection cover',
    href: '/photo/works/wingspan'
  },
  {
    id: 2,
    title: 'Nightfind 2026',
    image: 'nightfind-2024-10-24-30/DSCF9391-Edit',
    alt: 'Nightfind 2026 collection cover',
    href: '/photo/works/nightfind-2026'
  },
  {
    id: 3,
    title: 'Nightfind 2025',
    image: 'fuji-gt-2025-1-15-31/DSCF9903-Edit',
    alt: 'Nightfind 2025 collection cover',
    href: '/photo/works/nightfind-2025'
  },
  {
    id: 4,
    title: 'Nightfind 2024',
    image: 'nightfind-2024-09-24-25/DSCF7571-Edit',
    alt: 'Nightfind 2024 collection cover',
    href: '/photo/works/nightfind-2024'
  },
  {
    id: 5,
    title: 'Starry Night 2026',
    image: 'starrynight-2026-10-15/DSCF3413-Edit',
    alt: 'Starry Night 2026 collection cover',
    href: '/photo/works/starry-night-2026'
  },
  {
    id: 6,
    title: 'Lantern Fest 2026',
    image: 'lantern-fest-2026-03-15/DSCF8346-Edit',
    alt: 'Lantern Fest 2026 collection cover',
    href: '/photo/works/lantern-fest-2026'
  },
  {
    id: 7,
    title: 'Starry Night 2025',
    image: 'starrynight-2025-10-16/DSCF5995-Edit',
    alt: 'Starry Night 2025 collection cover',
    href: '/photo/works/starry-night-2025'
  }
]

export default function WorksPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
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
          <h1 className="home-name">Works</h1>
        </div>
        <div className="content-area">
          <div className="project-grid">
            {projects.map((project, index) => (
              <Link key={project.id} href={project.href} className="project-item">
                <PortfolioImage
                  src={project.image}
                  alt={project.alt}
                  mode="thumbnail"
                  priority={index < 2}
                />
                <h3 className="project-title">{project.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
