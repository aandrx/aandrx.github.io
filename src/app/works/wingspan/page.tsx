'use client'

import './wingspan.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

// Base URL for R2 bucket root
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

type WingspanImage = {
  src: string
  alt: string
}

type WingspanImageSet = {
  folder: string
  filenames: string[]
}

// Keep image groups by source folder so it's easy to append new shoots.
const imageSets: WingspanImageSet[] = [
  {
    folder: 'fuji-gt-2024-11-12-17-3',
    filenames: [
      'DSCF3711-Edit-Edit',
      'DSCF3723-Edit-Edit',
    ],
  },
  {
    folder: 'fuji-plane-2025-1-4',
    filenames: ['DSCF9847-Edit'],
  },
  {
    folder: 'fuji-nyc-2026-6-5-6',
    filenames: [
      'DSCF9061-Edit',
      'DSCF9063-Edit',
    ],
  },
  {
    folder: 'fuji-gt-2026-1-9',
    filenames: ['DSCF6988-Edit'],
  },
]

const images: WingspanImage[] = imageSets.flatMap(({ folder, filenames }) =>
  filenames.map((filename) => ({
    src: `${R2_BASE_URL}/${folder}/${filename}-720w.webp`,
    alt: `Wingspan ${folder} ${filename}`,
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

export default function WingspanPage() {
  const pathname = usePathname()
  const [isColumnsReady, setIsColumnsReady] = useState(images.length === 0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  useEffect(() => {
    setImagesLoaded(false)
    setIsColumnsReady(images.length === 0)
    setImageDimensions({})

    const loadImageDimensions = async () => {
      const dimensions: Record<string, { width: number; height: number }> = {}

      const results = await Promise.all(
        images.map(async (image) => {
          const dimension = await loadSingleImageDimension(image.src)
          return { image, dimension }
        })
      )

      for (const { image, dimension } of results) {
        if (dimension) {
          dimensions[image.src] = dimension
        }
      }

      setImageDimensions(dimensions)
      setImagesLoaded(true)

      // With an empty placeholder list, render text/content immediately.
      if (images.length === 0) {
        setIsColumnsReady(true)
      }
    }

    loadImageDimensions()
  }, [pathname])

  return (
    <div className="layout wingspan-layout">
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
            zIndex: 10,
          }}>
            ...
          </div>
        )}

        <div className="post">
          <div className="info">
            <div className="title section">Wingspan</div>
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
              <p>Wingspan begins in transit, in those in-between hours when terminals blur into runways and every window becomes a moving frame. The work follows motion more than destination, tracing the quiet choreography of departures, crossings, and returns.</p>
              <p>These photographs were made across separate trips, but they share the same impulse: to hold onto brief alignments of weather, light, and distance before they dissolve. Aircraft, streets, and open sky each become different ways of measuring time.</p>
              <p>What interests me most is the tension between scale and intimacy. A plane can dominate the horizon one moment, then vanish into a line of cloud, while a face in a station or a reflection in a window can carry the same sense of vastness.</p>
              <p>As the sequence moves forward, the images shift from grounded scenes toward wider air and city views, building a rhythm of lift, drift, and return. Together they read like fragments of one long route, stitched from places that were never meant to stay still.</p>
              <p>November 2024, January 2025, June 2026, January 2026</p>
            </DynamicColumns>
          </div>

          {images.map((image) => {
            const dimensions = imageDimensions[image.src]
            const width = dimensions?.width ?? 1024
            const height = dimensions?.height ?? 836

            if (!dimensions) {
              console.debug(`No dimensions available for ${image.src}`)
            }

            return (
              <div key={image.src} className="imageElement ie">
                <div className="wp-caption">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={width}
                    height={height}
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
