'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const projects = [
  // { id: 1, title: 'Project One', href: '/photo/works/project-one' },
  // { id: 2, title: 'Project Two', href: '/photo/works/project-two' },
  { id: 3, title: 'Wingspan', href: '/photo/works/wingspan' },
  // { id: 6, title: 'Project Six', href: '/photo/works/project-six' }
]

// Nightfind section - descending (newest on top), matching the CSA order.
const nightfindProjects = [
  { id: 3, title: '2026', href: '/photo/works/nightfind-2026' },
  { id: 2, title: '2025', href: '/photo/works/nightfind-2025' },
  { id: 1, title: '2024', href: '/photo/works/nightfind-2024' },
]

// CSA section - descending (newest on top): Starry Night 2026, Lantern Fest 2026, Starry Night 2025.
const csaProjects = [
  { id: 3, title: 'Starry Night 2026', href: '/photo/works/starry-night-2026' },
  { id: 2, title: 'Lantern Fest 2026', href: '/photo/works/lantern-fest-2026' },
  { id: 1, title: 'Starry Night 2025', href: '/photo/works/starry-night-2025' },
]

// Lenient path check (mirrors Nightfind's startsWith approach) so the CSA
// dropdown stays open on its pages without depending on an exact match.
const isCsaPath = (p: string | null): boolean =>
  !!p &&
  (p === '/photo/works/lantern-fest-2026' ||
    p === '/photo/works/starry-night-2025' ||
    p.startsWith('/photo/works/lantern-fest-') ||
    p.startsWith('/photo/works/starry-night-'))

export default function Navigation() {
  const rawPathname = usePathname()
  // Normalize once so exact matches and startsWith checks work with
  // next.config.js trailingSlash: true (root stays '/').
  const pathname = rawPathname && rawPathname !== '/'
    ? rawPathname.replace(/\/+$/, '') || '/'
    : rawPathname
  const [worksExpanded, setWorksExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return pathname === '/photo/works' || pathname?.startsWith('/photo/works/') || false
  })
  const [nightfindExpanded, setNightfindExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return pathname?.startsWith('/photo/works/nightfind-') || false
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
    if (pathname === '/photo/works' || pathname?.startsWith('/photo/works/')) {
      setWorksExpanded(true)
    }
    if (pathname?.startsWith('/photo/works/nightfind-')) {
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
            type="button"
            onClick={handleWorksClick}
            className={`nav-item ${pathname?.startsWith('/photo/works') ? 'active' : ''}`}
            aria-expanded={worksExpanded}
            aria-controls="works-submenu"
          >
            Works
          </button>
          <div 
            id="works-submenu"
            className="works-submenu"
            aria-hidden={!worksExpanded}
            style={{
              maxHeight: worksExpanded ? submenuMaxHeight : '0',
              opacity: worksExpanded ? 1 : 0,
              visibility: worksExpanded ? 'visible' : 'hidden',
              transition: hasUserInteracted
                ? worksExpanded
                  ? 'visibility 0s, max-height 0.6s ease-out, opacity 0.6s ease-out'
                  : 'max-height 0.6s ease-out, opacity 0.6s ease-out, visibility 0s 0.6s'
                : 'none'
            }}
          >
            {projects.map((project) => {
              // Use regular <a> tag to force full page refresh for horizontal scroll pages
              return (
                <a 
                  key={project.id} 
                  href={project.href}
                  className={pathname === project.href ? 'active' : ''}
                  aria-current={pathname === project.href ? 'page' : undefined}
                  tabIndex={worksExpanded ? undefined : -1}
                >
                  {project.title}
                </a>
              )
            })}
            
            {/* Nested Nightfind dropdown */}
            <button 
              type="button"
              onClick={handleNightfindClick}
              className={pathname?.startsWith('/photo/works/nightfind-') ? 'active' : ''}
              style={{ textAlign: 'left' }}
              aria-expanded={worksExpanded && nightfindExpanded}
              aria-controls="nightfind-submenu"
              tabIndex={worksExpanded ? undefined : -1}
            >
              Nightfind
            </button>
            <div 
              id="nightfind-submenu"
              aria-hidden={!nightfindExpanded || !worksExpanded}
              style={{
                maxHeight: nightfindExpanded ? `${nightfindProjects.length * 35}px` : '0',
                opacity: nightfindExpanded ? 1 : 0,
                visibility: nightfindExpanded && worksExpanded ? 'visible' : 'hidden',
                overflow: 'hidden',
                transition: hasNightfindUserInteracted
                  ? nightfindExpanded && worksExpanded
                    ? 'visibility 0s, max-height 0.6s ease-out, opacity 0.6s ease-out'
                    : 'max-height 0.6s ease-out, opacity 0.6s ease-out, visibility 0s 0.6s'
                  : 'none'
              }}
            >
              {nightfindProjects.map((project) => {
                return (
                  <a 
                    key={project.id} 
                    href={project.href}
                    className={pathname === project.href ? 'active' : ''}
                    aria-current={pathname === project.href ? 'page' : undefined}
                    style={{ paddingLeft: '20px' }}
                    tabIndex={worksExpanded && nightfindExpanded ? undefined : -1}
                  >
                    {project.title}
                  </a>
                )
              })}
            </div>

            {/* Nested CSA dropdown */}
            <button 
              type="button"
              onClick={handleCsaClick}
              className={csaActive ? 'active' : ''}
              style={{ textAlign: 'left' }}
              aria-expanded={worksExpanded && csaExpanded}
              aria-controls="csa-submenu"
              tabIndex={worksExpanded ? undefined : -1}
            >
              CSA
            </button>
            <div 
              id="csa-submenu"
              aria-hidden={!csaExpanded || !worksExpanded}
              style={{
                maxHeight: csaExpanded ? `${csaProjects.length * 35}px` : '0',
                opacity: csaExpanded ? 1 : 0,
                visibility: csaExpanded && worksExpanded ? 'visible' : 'hidden',
                overflow: 'hidden',
                transition: hasCsaUserInteracted
                  ? csaExpanded && worksExpanded
                    ? 'visibility 0s, max-height 0.6s ease-out, opacity 0.6s ease-out'
                    : 'max-height 0.6s ease-out, opacity 0.6s ease-out, visibility 0s 0.6s'
                  : 'none'
              }}
            >
              {csaProjects.map((project) => {
                return (
                  <a 
                    key={project.id} 
                    href={project.href}
                    className={pathname === project.href ? 'active' : ''}
                    aria-current={pathname === project.href ? 'page' : undefined}
                    style={{ paddingLeft: '20px' }}
                    tabIndex={worksExpanded && csaExpanded ? undefined : -1}
                  >
                    {project.title}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
        
        <Link href="/photo/feed" className={`nav-item ${pathname === '/photo/feed' ? 'active' : ''}`} aria-current={pathname === '/photo/feed' ? 'page' : undefined}>
          Feed
        </Link>
        
        <Link href="/photo/about" className={`nav-item ${pathname === '/photo/about' ? 'active' : ''}`} aria-current={pathname === '/photo/about' ? 'page' : undefined}>
          About
        </Link>
        
        <Link href="/photo/contact" className={`nav-item ${pathname === '/photo/contact' ? 'active' : ''}`} aria-current={pathname === '/photo/contact' ? 'page' : undefined}>
          Contact
        </Link>
      </nav>
    </div>
  )
}