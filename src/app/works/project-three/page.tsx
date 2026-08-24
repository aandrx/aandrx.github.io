'use client'

import './project-three.css'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

// Image folders to use
const imageFolders = [
  'nightfind-2024-09-24-25',
  'nightfind-2024-10-11-31-6',
  'nightfind-2024-10-24-30'
]

// Base URL for R2 bucket
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// Image filenames - placeholder to fix TypeScript errors
const imageFilenames: string[] = [
  // Add your image filenames here without extensions
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
        imageFilenames.map(async (filename) => {
          // Try to load from the first folder - you may need to adjust this logic
          // if images are spread across different folders
          const dimension = await loadSingleImageDimension(imageFolders[0], filename)
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
    <div className="layout project-three-layout">
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
              <div className="title section">Project Three</div>
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
                <p>Add your project description here.</p>
                <p>You can add multiple paragraphs to describe your project.</p>
                <p>Update the content and the image filenames array above.</p>
              </DynamicColumns>
            </div>

            {/* Images from R2 bucket */}
            {imageFilenames.map((filename) => {
              const dimensions = imageDimensions[filename]

              // Only render if dimensions are available
              if (!dimensions) {
                console.debug(`No dimensions available for ${filename}`)
                return null
              }

              return (
                <div
                  key={filename}
                  className="imageElement ie"
                >
                  <div className="wp-caption">
                    <Image
                      src={`${R2_BASE_URL}/${imageFolders[0]}/${filename}-720w.webp`}
                      alt={`Project Three ${filename}`}
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
