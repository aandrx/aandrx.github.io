'use client'

import './home.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function HomePage() {
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
      <div id="container" className="ie" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="post">
          <div className="info">
            <div className="title section">Andrew Liu</div>
            <div className="clear"></div>
          </div>
          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '573.244px' }}>
              <Image 
                width={1024}
                height={836}
                src="/homepage-image.jpg" 
                alt="Lakeside scene with people and trees" 
                className="wp-image-78"
                priority
                style={{ height: '468px', width: '573.244px' }}
              />
            </div>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
