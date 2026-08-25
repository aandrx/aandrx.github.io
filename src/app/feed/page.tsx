'use client'

import './feed.css'
import Navigation from '@/components/Navigation'
import Image from 'next/image'
import DynamicColumns from '@/components/DynamicColumns'
import { useEffect, useRef, useState } from 'react'

type FeedPost = {
  id: number
  images: string[]
  alt: string
}

// Base URL for R2 bucket root
const R2_BASE_URL = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'

// New real carousel set uploaded to R2
const DC_2026_FOLDER = 'fuji-dc-2026-5-10'
const dcImageFilenames = [
  'DSCF9003',
  'DSCF9008',
  'DSCF9013',
  'DSCF9023',
  'DSCF9033',
  'DSCF9035',
  'DSCF9038',
]
const dcImages = dcImageFilenames.map((filename) => `${R2_BASE_URL}/${DC_2026_FOLDER}/${filename}-720w.webp`)

export default function ProjectSixPage() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isColumnsReady, setIsColumnsReady] = useState(false)
  
  // Sample data - in a real app this would come from an API or database.
  // Cut down to a small set for now; add more posts here as needed.
  // Each post supports one or more images, similar to an Instagram carousel post.
  const posts: FeedPost[] = [
    { id: 1, images: ['/placeholder-1.jpg'], alt: 'Post 1' },
    { id: 2, images: ['/placeholder-2.jpg'], alt: 'Post 2' },
    { id: 3, images: ['/placeholder-3.jpg'], alt: 'Post 3' },
    { id: 4, images: ['/homepage-1.jpg'], alt: 'Post 4' },
    { id: 5, images: ['/about-image.jpg'], alt: 'Post 5' },
    { id: 6, images: ['/homepage-image.jpg'], alt: 'Post 6' },
    { id: 7, images: ['/placeholder-4.jpg'], alt: 'Post 7' },
    // Simulated carousel post with multiple images, like an Instagram multi-photo post
    { id: 8, images: ['/homepage-1.jpg', '/about-image.jpg', '/homepage-image.jpg'], alt: 'Post 8 - carousel set' },
    // Real carousel post from the fuji-dc-2026-5-10 set
    { id: 9, images: dcImages, alt: 'Post 9 - DC 2026 carousel' },
  ]

  const openModal = (postId: number) => {
    setSelectedPost(postId)
    setSelectedImageIndex(0)
  }

  const closeModal = () => {
    setSelectedPost(null)
    setSelectedImageIndex(0)
  }

  const selectedPostData = posts.find(post => post.id === selectedPost)
  const modalRef = useRef<HTMLDivElement>(null)

  const goToPreviousImage = () => {
    if (!selectedPostData || selectedPostData.images.length <= 1) {
      return
    }

    setSelectedImageIndex((index) => (index === 0 ? selectedPostData.images.length - 1 : index - 1))
  }

  const goToNextImage = () => {
    if (!selectedPostData || selectedPostData.images.length <= 1) {
      return
    }

    setSelectedImageIndex((index) => (index === selectedPostData.images.length - 1 ? 0 : index + 1))
  }

  // Focus the modal when it opens so arrow keys immediately control the carousel.
  useEffect(() => {
    if (selectedPost !== null) {
      modalRef.current?.focus()
    }
  }, [selectedPost])

  // Arrow keys / Escape work from anywhere while the modal is open. Bound at
  // window level so clicking on the (non-focusable) media area can't drop
  // focus to <body> and silently break keyboard navigation.
  useEffect(() => {
    if (selectedPost === null || !selectedPostData) {
      return
    }

    const handleModalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelectedImageIndex((index) =>
          index === 0 ? selectedPostData.images.length - 1 : index - 1
        )
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setSelectedImageIndex((index) =>
          index === selectedPostData.images.length - 1 ? 0 : index + 1
        )
      } else if (event.key === 'Escape') {
        event.preventDefault()
        setSelectedPost(null)
        setSelectedImageIndex(0)
      }
    }

    window.addEventListener('keydown', handleModalKeyDown)
    return () => window.removeEventListener('keydown', handleModalKeyDown)
  }, [selectedPost, selectedPostData])

  // Exact column count for the Instagram grid, so the container width always
  // matches the real grid width (prevents clipping and preserves right-edge spacing).
  const gridColumns = Math.ceil(posts.length / 3)

  return (
    <div className="layout project-six-layout">
      <Navigation />
      <div
        id="container"
        className="ie"
        style={{
          opacity: isColumnsReady ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          ['--ig-columns' as string]: gridColumns,
        }}
      >
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
              <div className="title section">Feed</div>
              <div className="clear"></div>
            </div>
            
            <div className="content">
              <DynamicColumns 
                columnWidth={200} 
                columnGap={40}
                onRenderComplete={() => setIsColumnsReady(true)}
              >
                <p>The Horizontal Instagram Feed presents a unique take on social media grid layouts. This implementation flows horizontally across the entire page, creating an immersive scrolling experience.</p>
                <p>Instead of traditional scrollbars, the entire page scrolls horizontally to reveal more content. Each square maintains perfect proportions while filling the available height.</p>
                <p>The grid extends infinitely to the right, with the newest content appearing first. As you scroll, you journey through the collection in a cinematic flow.</p>
                <p>Scroll horizontally to explore the full grid, or click on any image to view it in detail.</p>
              </DynamicColumns>
            </div>

            {/* Instagram Grid that spans the full post height */}
            <div className="instagram-grid-full-height">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="instagram-grid-item-full"
                  onClick={() => openModal(post.id)}
                >
                  <div className="instagram-post-overlay">
                    <div className="overlay-content">
                      <span className="post-number">#{post.id}</span>
                    </div>
                  </div>
                  {post.images.length > 1 && (
                    <span className="carousel-indicator" aria-label="Multiple images in this post">
                      ⧉
                    </span>
                  )}
                  <Image
                    src={post.images[0]}
                    alt={post.alt}
                    width={200}
                    height={200}
                    className="instagram-grid-image"
                    priority={post.id <= 12}
                  />
                </div>
              ))}
            </div>

          </div>
          <div className="clear"></div>
        </div>

        {/* Modal for viewing individual posts */}
        {selectedPost && selectedPostData && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
              tabIndex={-1}
            >
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
              <div className="modal-media">
                <div
                  className="modal-slider"
                  style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
                >
                  {selectedPostData.images.map((src, index) => (
                    <div className="modal-slide" key={src + index}>
                      <Image
                        src={src}
                        alt={`${selectedPostData.alt} image ${index + 1}`}
                        fill
                        sizes="(max-width: 800px) 90vw, 800px"
                        className="modal-slide-image"
                      />
                    </div>
                  ))}
                </div>
                {selectedPostData.images.length > 1 && (
                  <>
                    <button className="modal-nav-button modal-nav-prev" onClick={goToPreviousImage} aria-label="Previous image">
                      &#8249;
                    </button>
                    <button className="modal-nav-button modal-nav-next" onClick={goToNextImage} aria-label="Next image">
                      &#8250;
                    </button>
                  </>
                )}
              </div>
              {selectedPostData.images.length > 1 && (
                <div className="modal-status">
                  <div className="modal-progress-track">
                    <div
                      className="modal-progress-indicator"
                      style={{
                        width: `calc(100% / ${selectedPostData.images.length})`,
                        left: `calc(${selectedImageIndex / (selectedPostData.images.length - 1)} * (100% - (100% / ${selectedPostData.images.length})))`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="modal-info">
                <h3>Post #{selectedPostData.id}</h3>
                <p>{selectedPostData.alt}</p>
                {selectedPostData.images.length > 1 && (
                  <p>Image {selectedImageIndex + 1} of {selectedPostData.images.length}</p>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
