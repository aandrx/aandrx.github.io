'use client'

import './nightfind-2025.css'
import Navigation from '@/components/Navigation'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'
import React from 'react'

// Base URL for R2 bucket
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// Separator image - same as in reference
const SEPARATOR_IMAGE = '/separator.png' // You'll need to add this image

// Images with their folder locations, captions, and orientation
const images: Array<{ folder: string; filename: string; caption?: string; isPortrait?: boolean }> = [
  // From nightfind-2024-10-24-30
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9391-Edit', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9422-Edit', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9425-Edit', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9426-Edit', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9426-Edit-2', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9430-Edit', caption: '', isPortrait: false },
  { folder: 'nightfind-2024-10-24-30', filename: '2DSCF9432-Edit', caption: '', isPortrait: false }
]

export default function Nightfind2025Page() {
  const pathname = usePathname()
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Fade in after mount
    setOpacity(1)
  }, [pathname])

  return (
    <div className="layout nightfind-2025-layout">
      <Navigation />
      <div id="container" className="ie" style={{ opacity, transition: 'opacity 0.3s ease-in-out' }}>
        <div className="post">
          <div className="info">
            <div className="title section">Nightfind 2025</div>
            <div className="extended section">October 24-30, 2024</div>
            <div className="clear"></div>
          </div>
          
          <div className="content">
            {images.map((image, index) => {
              const key = `${image.folder}/${image.filename}`
              const imageWidth = image.isPortrait ? 400 : 800
              const imageHeight = image.isPortrait ? 600 : 533
              
              // Check if folder changed from previous image
              const previousFolder = index > 0 ? images[index - 1].folder : null
              const folderChanged = previousFolder && previousFolder !== image.folder

              return (
                <React.Fragment key={key}>
                  {/* Add separator when folder changes */}
                  {folderChanged && (
                    <figure className="wp-block-image size-full">
                      <div className="wp-caption" style={{ width: 'auto' }}>
                        {/* Placeholder for separator - you can add actual separator image */}
                        <div style={{ width: '388px', height: '37px', background: '#f0f0f0', margin: '0 auto' }} />
                      </div>
                    </figure>
                  )}
                  
                  <figure className={`wp-block-image size-large ${image.isPortrait ? 'is-portrait' : ''}`}>
                    <div className="wp-caption" style={{ width: 'auto' }}>
                      <Image
                        src={`${R2_BASE_URL}/${image.folder}/${image.filename}-1920w.webp`}
                        alt={`Nightfind 2025 ${image.filename}`}
                        width={imageWidth}
                        height={imageHeight}
                        className="wp-image-78 ie"
                        loading="lazy"
                        quality={85}
                        style={{ width: `${imageWidth}px`, height: 'auto' }}
                      />
                      <p className="wp-caption-text">{image.caption || '\u00A0'}</p>
                    </div>
                  </figure>
                </React.Fragment>
              )
            })}
          </div>
        </div>
        <div className="tracer"></div>
      </div>
    </div>
  )
}
