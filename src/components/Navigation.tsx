'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const projects = [
  { id: 1, title: 'Project One', href: '/works/project-one' },
  { id: 2, title: 'Project Two', href: '/works/project-two' },
  { id: 3, title: 'Project Three', href: '/works/project-three' },
  { id: 4, title: 'Starry Night 2025', href: '/works/project-four' },
  { id: 5, title: 'Project Five', href: '/works/project-five' },
  { id: 6, title: 'Project Six', href: '/works/project-six' }
]

export default function Navigation() {
  const pathname = usePathname()
  const [worksExpanded, setWorksExpanded] = useState(() => {
    // Initialize state based on current path to avoid animation on load
    return pathname?.startsWith('/works/') || false
  })
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Update state when pathname changes (for navigation between pages)
  useEffect(() => {
    if (pathname?.startsWith('/works/')) {
      setWorksExpanded(true)
    }
  }, [pathname])

  const handleWorksClick = () => {
    setHasUserInteracted(true)
    setWorksExpanded(!worksExpanded)
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
              maxHeight: worksExpanded ? `${projects.length * 35}px` : '0',
              opacity: worksExpanded ? 1 : 0,
              transition: hasUserInteracted ? 'max-height 0.6s ease-out, opacity 0.6s ease-out' : 'none'
            }}
          >
            {projects.map((project) => (
              <Link key={project.id} href={project.href}>
                {project.title}
              </Link>
            ))}
          </div>
        </div>
        
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
