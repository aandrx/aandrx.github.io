'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const projects = [
  // { id: 1, title: 'Project One', href: '/works/project-one' },
  // { id: 2, title: 'Project Two', href: '/works/project-two' },
  { id: 4, title: 'Starry Night 2025', href: '/works/starry-night-2025' },
  { id: 5, title: 'Lantern Fest 2026', href: '/works/lantern-fest-2026' },
  // { id: 6, title: 'Project Six', href: '/works/project-six' }
]

const nightfindProjects = [
  { id: 1, title: '2024', href: '/works/nightfind-2024' },
  // { id: 2, title: '2025', href: '/works/nightfind-2025' }
]

export default function Navigation() {
  const pathname = usePathname()
  const [worksExpanded, setWorksExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return pathname?.startsWith('/works/') || false
  })
  const [nightfindExpanded, setNightfindExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return pathname?.startsWith('/works/nightfind-') || false
  })
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [hasNightfindUserInteracted, setHasNightfindUserInteracted] = useState(false)

  // Update state when pathname changes (for navigation between pages)
  useEffect(() => {
    if (pathname?.startsWith('/works/')) {
      setWorksExpanded(true)
    }
    if (pathname?.startsWith('/works/nightfind-')) {
      setNightfindExpanded(true)
    }
  }, [pathname])

  const handleWorksClick = () => {
    setHasUserInteracted(true)
    setWorksExpanded(!worksExpanded)
  }

  const handleNightfindClick = () => {
    setHasNightfindUserInteracted(true)
    setNightfindExpanded(!nightfindExpanded)
  }

  return (
    <div className="sidebar">
      <div className="title" style={{ marginBottom: '40px' }}></div>
      <nav>
        <div>
          <button 
            onClick={handleWorksClick}
            className={`nav-item ${pathname?.startsWith('/works') ? 'active' : ''}`}
          >
            Works
          </button>
          <div 
            className="works-submenu"
            style={{
              maxHeight: worksExpanded ? `${(projects.length + 1 + (nightfindExpanded ? nightfindProjects.length : 0)) * 35}px` : '0',
              opacity: worksExpanded ? 1 : 0,
              transition: hasUserInteracted ? 'max-height 0.6s ease-out, opacity 0.6s ease-out' : 'none'
            }}
          >
            {projects.map((project) => {
              // Use regular <a> tag to force full page refresh for horizontal scroll pages
              if (project.href === '/works/starry-night-2025' || project.href === '/works/lantern-fest-2026') {
                return (
                  <a 
                    key={project.id} 
                    href={project.href}
                    className={pathname === project.href ? 'active' : ''}
                  >
                    {project.title}
                  </a>
                )
              }
              
              return (
                <Link 
                  key={project.id} 
                  href={project.href}
                  className={pathname === project.href ? 'active' : ''}
                >
                  {project.title}
                </Link>
              )
            })}
            
            {/* Nested Nightfind dropdown */}
            <button 
              onClick={handleNightfindClick}
              className={pathname?.startsWith('/works/nightfind-') ? 'active' : ''}
              style={{ textAlign: 'left' }}
            >
              Nightfind
            </button>
            <div 
              style={{
                maxHeight: nightfindExpanded ? `${nightfindProjects.length * 35}px` : '0',
                opacity: nightfindExpanded ? 1 : 0,
                overflow: 'hidden',
                transition: hasNightfindUserInteracted ? 'max-height 0.6s ease-out, opacity 0.6s ease-out' : 'none'
              }}
            >
              {nightfindProjects.map((project) => {
                return (
                  <a 
                    key={project.id} 
                    href={project.href}
                    className={pathname === project.href ? 'active' : ''}
                    style={{ paddingLeft: '20px' }}
                  >
                    {project.title}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
        
        <Link href="/feed" className={`nav-item ${pathname === '/feed' ? 'active' : ''}`}>
          Feed
        </Link>
        
        <Link href="/about" className={`nav-item ${pathname === '/about' ? 'active' : ''}`}>
          About
        </Link>
        
        <Link href="/contact" className={`nav-item ${pathname === '/contact' ? 'active' : ''}`}>
          Contact
        </Link>
      </nav>
    </div>
  )
}
