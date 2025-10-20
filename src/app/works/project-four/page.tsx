'use client'

import './project-four.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import DynamicColumns from '@/components/DynamicColumns'
import { useState } from 'react'

const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev/starrynight-2025-10-16'

// Just list the filenames - dimensions will be detected automatically
const imageFilenames = [
  'DSCF5995-Edit',
  'DSCF6168-Edit',
  'DSCF6315-Edit-2',
  'DSCF6348-Edit',
  'DSCF6036-Edit',
  'DSCF6205-Edit',
  'DSCF5997-Edit',
  'DSCF6167-Edit',
  'DSCF6204-Edit',
  'DSCF5994-Edit',
  'DSCF6286-Edit',
  'DSCF6308-Edit',
  'DSCF6335-Edit',
  'DSCF6377-Edit',
]

// Column height for all images
const COLUMN_HEIGHT = 468

export default function ProjectFourPage() {
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  
  return (
    <div className="layout project-four-layout">
      <Navigation />
      <div id="container" className="ie" style={{ opacity: isColumnsReady ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}>
        {!isColumnsReady && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            color: '#666',
            zIndex: 10
          }}>
            Preparing content...
          </div>
        )}
        
        <div className="post">
          <div className="info">
            <div className="title section">Starry Night 2025</div>
            <div className="clear"></div>
          </div>
          
          <div className="content">
            <DynamicColumns 
              columnWidth={200} 
              columnGap={40}
              onRenderComplete={() => setIsColumnsReady(true)}
            >
              <p>I spent little time with my parents throughout my whole growth, less communication, long being alienated, thereby giving rise to a sense of staying in middle of nowhere. Every time when confronted with the built-in family issue, I would intend to shun away instinctively.</p>
              <p>In March 2020, I moved to Hangzhou to get rid of the anxieties as well as for career. There, I got well paid and gained inner peace eventually, but later the routine of job bored me beyond bearing.</p>
              <p>Out of the basic instinct as a photographer, I decided to explore the similar void of mind state among young people like me scattered in different cities, to see their faces as well as check over my deep self-doubt. Therefore, I post my personal photo project "New Comer" in Weibo, twitter-like social media in mainland China, and received more than 40 applicants.</p>
              <p>Before shooting, I predicted their inner drives to different cities: career, money, emotion issue, or just escaping family. In the process of shooting and communicating with them, I found my predictions well fit, but the point is that even I share a lot with most of them, I am still touched by every each individual, his or her willingness to thrive, trying to gain redemption in ways positive, or negative.</p>
              <p>October 16, 2025</p>
            </DynamicColumns>
          </div>

          {/* Images from R2 bucket - starrynight folder */}
          {imageFilenames.map((filename) => {
            return (
              <div 
                key={filename} 
                className="imageElement ie"
              >
                <div className="wp-caption">
                  <Image
                    src={`${R2_BASE_URL}/${filename}-720w.webp`}
                    alt={`Starry Night ${filename}`}
                    width={720}
                    height={COLUMN_HEIGHT}
                    style={{ height: '468px', width: 'auto' }}
                    className="wp-image-78"
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement
                      const naturalWidth = img.naturalWidth
                      const naturalHeight = img.naturalHeight
                      const aspectRatio = naturalWidth / naturalHeight
                      const calculatedWidth = Math.round(COLUMN_HEIGHT * aspectRatio)
                      
                      // Update the container and image widths
                      const imageElement = img.closest('.imageElement') as HTMLElement
                      const wpCaption = img.closest('.wp-caption') as HTMLElement
                      
                      if (imageElement) imageElement.style.width = `${calculatedWidth}px`
                      if (wpCaption) wpCaption.style.width = `${calculatedWidth}px`
                      img.style.width = `${calculatedWidth}px`
                      
                      console.log(`${filename}: ${naturalHeight > naturalWidth ? 'Portrait' : 'Landscape'} - Width: ${calculatedWidth}px (${naturalWidth}x${naturalHeight})`)
                    }}
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
