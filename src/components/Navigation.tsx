'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const projects = [
  // { id: 1, title: 'Project One', href: '/works/project-one' },
  // { id: 2, title: 'Project Two', href: '/works/project-two' },
  { id: 3, title: 'Wingspan', href: '/works/wingspan' },
  // { id: 6, title: 'Project Six', href: '/works/project-six' }
]

const nightfindProjects = [
  { id: 1, title: '2024', href: '/works/nightfind-2024' },
  { id: 2, title: '2025', href: '/works/nightfind-2025' },
  { id: 3, title: '2026', href: '/works/nightfind-2026' },
]

// CSA section - descending (newest on top): Lantern Fest 2026, Starry Night 2025.
const csaProjects = [
  { id: 2, title: 'Lantern Fest 2026', href: '/works/lantern-fest-2026' },
  { id: 1, title: 'Starry Night 2025', href: '/works/starry-night-2025' },
]

// Lenient path check (mirrors Nightfind's startsWith approach) so the CSA
// dropdown stays open on its pages without depending on an exact match.
const isCsaPath = (p: string | null): boolean =>
  !!p &&
  (p === '/works/lantern-fest-2026' ||
    p === '/works/starry-night-2025' ||
    p.startsWith('/works/lantern-fest-') ||
    p.startsWith('/works/starry-night-'))

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
  const [csaExpanded, setCsaExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return isCsaPath(pathname) || false
  })
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [hasNightfindUserInteracted, setHasNightfindUserInteracted] = useState(false)
  const [hasCsaUserInteracted, setHasCsaUserInteracted] = useState(false)

  // Update state when pathname changes (for navigation between pages)
  useEffect(() => {
    if (pathname?.startsWith('/works/')) {
      setWorksExpanded(true)
    }
    if (pathname?.startsWith('/works/nightfind-')) {
      setNightfindExpanded(true)
    }
    if (isCsaPath(pathname)) {
      setCsaExpanded(true)
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

  const handleCsaClick = () => {
    setHasCsaUserInteracted(true)
    setCsaExpanded(!csaExpanded)
  }

  // The works submenu always reserves room for every nested dropdown when open,
  // so toggling a nested dropdown only animates that dropdown - no double
  // height animation that makes collapsing "buffer" / clip in stages.
  const submenuRowCount = projects.length + 1 + nightfindProjects.length + 1 + csaProjects.length
  const submenuMaxHeight = `${submenuRowCount * 35}px`

  const csaActive = isCsaPath(pathname)

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
              maxHeight: worksExpanded ? submenuMaxHeight : '0',
              opacity: worksExpanded ? 1 : 0,
              transition: hasUserInteracted ? 'max-height 0.6s ease-out, opacity 0.6s ease-out' : 'none'
            }}
          >
            {projects.map((project) => {
              // Use regular <a> tag to force full page refresh for horizontal scroll pages
              return (
                <a 
                  key={project.id} 
                  href={project.href}
                  className={pathname === project.href ? 'active' : ''}
                >
                  {project.title}
                </a>
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

            {/* Nested CSA dropdown */}
            <button 
              onClick={handleCsaClick}
              className={csaActive ? 'active' : ''}
              style={{ textAlign: 'left' }}
            >
              CSA
            </button>
            <div 
              style={{
                maxHeight: csaExpanded ? `${csaProjects.length * 35}px` : '0',
                opacity: csaExpanded ? 1 : 0,
                overflow: 'hidden',
                transition: hasCsaUserInteracted ? 'max-height 0.6s ease-out, opacity 0.6s ease-out' : 'none'
              }}
            >
              {csaProjects.map((project) => {
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