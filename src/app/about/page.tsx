'use client'

import './about.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function AboutPage() {
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
      <div id="container" className="about-container ie" style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="post">
          <div className="info">
            <div className="title section">About</div>
            <div className="clear"></div>
          </div>
          
          <div className="content">
            <figure className="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-1 is-layout-flex wp-block-gallery-is-layout-flex" style={{ marginBottom: '40px' }}>
              <figure className="wp-block-image size-large">
                <div className="wp-caption" style={{ width: 'auto' }}>
                  <Image 
                    src="/about-image.jpg" 
                    alt="Portrait photo" 
                    className="about-image ie"
                    width={760}
                    height={507}
                    priority
                    style={{ width: '760px', height: 'auto' }}
                  />
                </div>
              </figure>
            </figure>

            <p>
              <strong>Andrew Liu</strong>, born in 2006 in Richland, Washington, is an independent photographer currently based in Hangzhou. In 2024, Andrew participated in <em>Multi-Exposure: New Narrative in Photography</em> and <em>Redefine: Contemporary Portrait Photography</em>, and his photobook <em>New Comer</em> was published by Imageless Publishing. In the same year, he held a solo exhibition of his <em>New Comer</em> series at Place M in Tokyo. In 2023, he was honored with the Leica Oskar Barnack Newcomer Award and exhibited his work in the <em>Light and Shadows</em> exhibition as part of the Leica Oskar Barnack Award series.
            </p>

            <p>
              In 2024, Andrew participated in <em>Them</em>, a segment of the <em>Local Action</em> exhibitions at the Jimei·Arles International Photography Festival. That same year, his work was shortlisted for the Young Portfolio collection award by the Kiyosato Museum of Art in Japan. In 2021, he was shortlisted for the BarTur Photography Award.
            </p>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
