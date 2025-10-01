'use client'

import './project-five.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import DynamicColumns from '@/components/DynamicColumns'
import { useState } from 'react'

export default function ProjectFivePage() {
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  return (
    <div className="layout project-five-layout">
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
              <div className="title section">New Comer</div>
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
              </DynamicColumns>
            </div>

            {/* Images positioned to flow horizontally after content */}
            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/test-image.jpg"
                  alt=""
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/test-image-2.jpg"
                  alt=""
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/homepage-image.jpg"
                  alt=""
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-1.jpg"
                  alt="Project Five Image 4"
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-2.jpg"
                  alt="Project Five Image 5"
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "836", height: "1024" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-3.jpg"
                  alt="Project Five Image 6"
                  width={836}
                  height={1024}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-4.jpg"
                  alt="Project Five Image 7"
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "1024", height: "836" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-5.jpg"
                  alt="Project Five Image 8"
                  width={1024}
                  height={836}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            <div className="imageElement ie" {...({ width: "836", height: "1024" } as any)}>
              <div className="wp-caption" style={{ width: '573.244px' }}>
                <Image
                  src="/placeholder-6.jpg"
                  alt="Project Five Image 9"
                  width={836}
                  height={1024}
                  style={{ height: '468px', width: '573.244px' }}
                  className="wp-image-78"
                />
              </div>
            </div>

            {/* Clear floats after all content */}
            <div style={{ clear: 'both' }}></div>

          </div>
          <div className="tracer"></div>
        </div>
    </div>
  )
}
