'use client'

import './nightfind-2025.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import React from 'react'

// Base URL for R2 bucket root
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// Keep image groups by source folder, sorted chronologically (all 2025).
const imageSets = [
  {
    folder: 'fuji-gt-2025-1-15-31',
    filenames: [
      'DSCF9903-Edit',
      'DSCF9905-Edit-2-2',
      'DSCF9906-Edit',
      'DSCF9907-Edit-2',
    ],
  },
  {
    folder: 'fuji-gt-2025-8-11-16-17',
    filenames: ['DSCF5835-Edit'],
  },
  {
    folder: 'fuji-gt-2025-9-18',
    filenames: ['DSCF5807-Edit'],
  },
]

const images = imageSets.flatMap(({ folder, filenames }) =>
  filenames.map((filename) => ({
    src: `${R2_BASE_URL}/${folder}/${filename}-720w.webp`,
    alt: `Nightfind 2025 ${filename}`,
  })),
)

const loadSingleImageDimension = (src: string): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export default function Nightfind2025Page() {
  const pathname = usePathname()
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  useEffect(() => {
    setImagesLoaded(false)
    setIsColumnsReady(false)
    setImageDimensions({})

    const loadImageDimensions = async () => {
      setImagesLoaded(false)
      const dimensions: Record<string, { width: number; height: number }> = {}

      const results = await Promise.all(
        images.map(async (image) => {
          const dimension = await loadSingleImageDimension(image.src)
          return { image, dimension }
        }),
      )

      for (const { image, dimension } of results) {
        if (dimension) {
          dimensions[image.src] = dimension
        }
      }

      setImageDimensions(dimensions)
      setImagesLoaded(true)
    }

    loadImageDimensions()
  }, [pathname])

  return (
    <div className="layout nightfind-2025-layout">
      <Navigation />
      <div id="container" className="ie" style={{ opacity: isColumnsReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        {!isColumnsReady && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '24px',
              color: '#666',
              zIndex: 10,
            }}
          >
            ...
          </div>
        )}

        <div className="post">
          <div className="info">
            <div className="title section">Nightfind 2025</div>
            <div className="clear"></div>
          </div>

          <div className="content">
            <DynamicColumns
              columnWidth={200}
              columnGap={40}
              onRenderComplete={() => {
                setIsColumnsReady(true)
              }}
            >
              <p>A continuation of Nightfind, now with sharper contrast and quieter streets.</p>
              <p>Moving between corners of light, waiting for brief moments to settle into frame.</p>
              <p>The routine stayed the same: walk, pause, adjust settings, and follow the night until it opens up.</p>
              <p>2025, January 2025</p>
            </DynamicColumns>
          </div>

          {imagesLoaded &&
            images.map((image) => {
              const dimensions = imageDimensions[image.src]

              if (!dimensions) {
                console.debug(`No dimensions available for ${image.src}`)
                return null
              }

              return (
                <div key={image.src} className="imageElement ie">
                  <div className="wp-caption">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={dimensions.width}
                      height={dimensions.height}
                      className="wp-image-78"
                      loading="lazy"
                      quality={85}
                    />
                  </div>
                </div>
              )
            })}
        </div>
        <div className="tracer"></div>
      </div>
    </div>
  )
}
