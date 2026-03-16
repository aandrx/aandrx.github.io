'use client'

import './lantern-fest-2026.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'

const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev/lantern-fest-2026-03-15'

// Just list the filenames - dimensions will be detected automatically
const imageFilenames = [
  'DSCF8346-Edit',
  'DSCF8326-Edit',
  'DSCF8327-Edit',
  'DSCF8328-Edit',
  'DSCF8329-Edit',
  'DSCF8330-Edit',
  'DSCF8336-Edit',
  'DSCF8338-Edit-2',
]

// Helper function to load a single image dimension
const loadSingleImageDimension = (filename: string): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    img.onerror = () => resolve(null)
    img.src = `${R2_BASE_URL}/${filename}-720w.webp`
  })
}

export default function LanternFest2026Page() {
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
        imageFilenames.map(async (filename) => {
          const dimension = await loadSingleImageDimension(filename)
          return { filename, dimension }
        })
      )

      // Build dimensions object from results
      for (const { filename, dimension } of results) {
        if (dimension) {
          dimensions[filename] = dimension
        }
      }

      setImageDimensions(dimensions)
      setImagesLoaded(true)
    }

    loadImageDimensions()
  }, [pathname]) // Re-run when pathname changes

  return (
    <div className="layout lantern-fest-2026-layout">
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
              <div className="title section">Lantern Fest 2026</div>
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
                <p>The lantern festival arrives once a year, marking the first full moon of the lunar new year. Streets fill with light and the air carries the smell of winter giving way, a threshold between what was and what might still be possible.</p>
                <p>I had been living in the same rhythm for months — work, sleep, the same routes between the same places. Something about the festival felt like permission to look up, to move through the city with slower attention and no particular destination.</p>
                <p>What drew me to photograph it was not the spectacle itself but the faces gathered around it: strangers standing close together in the dark, sharing warmth in front of something briefly bright. The lanterns gave everyone a reason to pause.</p>
                <p>I spent the evening moving through crowds without a plan, following light wherever it pooled. There is a particular quality to photographs made in celebration — something between documentation and longing, as though the camera already knows the night is ending.</p>
                <p>March 15, 2026</p>
              </DynamicColumns>
            </div>

            {/* Images from R2 bucket - lantern-fest folder */}
            {imageFilenames.map((filename) => {
              const dimensions = imageDimensions[filename]

              // Only render if dimensions are available
              if (!dimensions) {
                Sentry.logger.debug(`No dimensions available for ${filename}`)
                return null
              }

              return (
                <div
                  key={filename}
                  className="imageElement ie"
                >
                  <div className="wp-caption">
                    <Image
                      src={`${R2_BASE_URL}/${filename}-720w.webp`}
                      alt={`Lantern Fest 2026 ${filename}`}
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
        )}
        <div className="tracer"></div>
      </div>
    </div>
  )
}
