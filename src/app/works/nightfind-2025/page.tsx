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

// Update this folder when you publish a new Nightfind 2025 set
const NIGHTFIND_2025_FOLDER = 'nightfind-2024-10-24-30'

// Replace these with your new R2 filenames (without -720w.webp)
const imageFilenames = [
  'DSCF9391-Edit',
  'DSCF9422-Edit',
  'DSCF9425-Edit',
  'DSCF9426-Edit',
  'DSCF9426-Edit-2',
  'DSCF9430-Edit',
  'DSCF9432-Edit',
]

const loadSingleImageDimension = (filename: string): Promise<{ width: number; height: number } | null> => {
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    img.onerror = () => resolve(null)
    img.src = `${R2_BASE_URL}/${NIGHTFIND_2025_FOLDER}/${filename}-720w.webp`
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
        imageFilenames.map(async (filename) => {
          const dimension = await loadSingleImageDimension(filename)
          return { filename, dimension }
        }),
      )

      for (const { filename, dimension } of results) {
        if (dimension) {
          dimensions[filename] = dimension
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
              <p>2025</p>
            </DynamicColumns>
          </div>

          {imagesLoaded &&
            imageFilenames.map((filename) => {
              const dimensions = imageDimensions[filename]

              if (!dimensions) {
                console.debug(`No dimensions available for ${filename}`)
                return null
              }

              return (
                <div key={filename} className="imageElement ie">
                  <div className="wp-caption">
                    <Image
                      src={`${R2_BASE_URL}/${NIGHTFIND_2025_FOLDER}/${filename}-720w.webp`}
                      alt={`Nightfind 2025 ${filename}`}
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
