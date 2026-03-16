'use client'

import './nightfind-2024.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'
import React from 'react'

// Image folders to use
const imageFolders = [
  'nightfind-2024-09-24-25',
  'nightfind-2024-10-11-31-6',
  'nightfind-2024-10-24-30'
]

// Base URL for R2 bucket
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// Images with their folder locations
const images = [
  // From nightfind-2024-09-24-25
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7571-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7572-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7760-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7839-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7908-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7963-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7974-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF7975-Edit' },
  { folder: 'nightfind-2024-09-24-25', filename: 'DSCF8012-Edit-2' },
  // From nightfind-2024-10-11-31-6
  { folder: 'nightfind-2024-10-11-31-6', filename: 'DSCF3371-Edit' },
  { folder: 'nightfind-2024-10-11-31-6', filename: 'DSCF3386-Edit' },
  { folder: 'nightfind-2024-10-11-31-6', filename: 'DSCF3387-Edit-2' },
  // From nightfind-2024-10-24-30
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9391-Edit' },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9422-Edit' },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9425-Edit' },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9426-Edit' },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9426-Edit-2' },
  { folder: 'nightfind-2024-10-24-30', filename: 'DSCF9430-Edit' },
  { folder: 'nightfind-2024-10-24-30', filename: '2DSCF9432-Edit' }
]

// Helper function to load a single image dimension
const loadSingleImageDimension = (folder: string, filename: string): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    img.onerror = () => resolve(null)
    img.src = `${R2_BASE_URL}/${folder}/${filename}-720w.webp`
  })
}

export default function ProjectThreePage() {
  const pathname = usePathname()
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  // Preload images to get dimensions before rendering
  useEffect(() => {
    // Reset state when navigating to this page
    setImagesLoaded(false)
    setIsColumnsReady(false)
    setImageDimensions({})

    const loadImageDimensions = async () => {
      const dimensions: Record<string, { width: number; height: number }> = {}

      const results = await Promise.all(
        images.map(async (image) => {
          const dimension = await loadSingleImageDimension(image.folder, image.filename)
          return { image, dimension }
        })
      )

      // Build dimensions object from results
      for (const { image, dimension } of results) {
        if (dimension) {
          dimensions[`${image.folder}/${image.filename}`] = dimension
        }
      }

      setImageDimensions(dimensions)
      setImagesLoaded(true)
    }

    loadImageDimensions()
  }, [pathname]) // Re-run when pathname changes

  return (
    <div className="layout nightfind-2024-layout">
      <Navigation />
      <div id="container" className="ie" style={{ opacity: isColumnsReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        {!isColumnsReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px',
            color: '#666',
            zIndex: 10
          }}>
            ...
          </div>
        )}

        {imagesLoaded && (
          <div className="post">
            <div className="info">
              <div className="title section">Nightfind 2024</div>
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
                <p>Where I first started with working with nighttime photography.</p>
                <p>Watching for exposure, thinking about composition, modifying settings, and steadying my hands.</p>
                <p>It began as a soft practice for capturing the beauty of the night, but quickly became more routine as I hurried back to my dorm after late classes, or night-grind sessions. Today, this directly embodies what I hope to capture through my lens.</p>
                <p>September 24-25, 2024</p>
              </DynamicColumns>
            </div>

            {/* Images from R2 bucket */}
            {images.map((image, index) => {
              const key = `${image.folder}/${image.filename}`
              const dimensions = imageDimensions[key]
              
              // Check if folder changed from previous image
              const previousFolder = index > 0 ? images[index - 1].folder : null
              const folderChanged = previousFolder && previousFolder !== image.folder

              // Only render if dimensions are available
              if (!dimensions) {
                Sentry.logger.debug(`No dimensions available for ${key}`)
                return null
              }

              return (
                <React.Fragment key={key}>
                  {/* Add separator when folder changes */}
                  {folderChanged && (
                    <div
                      className="imageElement ie"
                      style={{
                        width: '80px',
                        height: 'calc(100vh - 240px)',
                        marginRight: '40px',
                        display: 'inline-block',
                        verticalAlign: 'top'
                      }}
                    />
                  )}
                  <div
                    className="imageElement ie"
                  >
                    <div className="wp-caption">
                      <Image
                        src={`${R2_BASE_URL}/${image.folder}/${image.filename}-720w.webp`}
                        alt={`Nightfind 2024 ${image.filename}`}
                        width={dimensions.width}
                        height={dimensions.height}
                        className="wp-image-78"
                        loading="lazy"
                        quality={85}
                      />
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
        <div className="tracer"></div>
      </div>
    </div>
  )
}
