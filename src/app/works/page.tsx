'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'

const projects = [
  {
    id: 1,
    title: 'Project One',
    image: '/placeholder-1.jpg',
    href: '/works/project-one'
  },
  {
    id: 2,
    title: 'Project Two',
    image: '/placeholder-2.jpg',
    href: '/works/project-two'
  },
  {
    id: 3,
    title: 'Project Three',
    image: '/placeholder-3.jpg',
    href: '/works/project-three'
  },
  {
    id: 4,
    title: 'Project Four',
    image: '/placeholder-4.jpg',
    href: '/works/project-four'
  },
  {
    id: 5,
    title: 'Project Five',
    image: '/placeholder-5.jpg',
    href: '/works/project-five'
  },
  {
    id: 6,
    title: 'Project Six',
    image: '/placeholder-6.jpg',
    href: '/works/project-six'
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
            {projects.map((project) => (
              <Link key={project.id} href={project.href} className="project-item">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={400}
                  height={300}
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
