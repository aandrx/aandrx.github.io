'use client'

import Navigation from '@/components/Navigation'
import Image from 'next/image'
import { useState } from 'react'

export default function ProjectSixPage() {
  const [selectedPost, setSelectedPost] = useState<number | null>(null)
  
  // Sample data - in a real app this would come from an API or database
  const posts = [
    { id: 1, src: '/placeholder-1.jpg', alt: 'Post 1' },
    { id: 2, src: '/placeholder-2.jpg', alt: 'Post 2' },
    { id: 3, src: '/placeholder-3.jpg', alt: 'Post 3' },
    { id: 4, src: '/placeholder-4.jpg', alt: 'Post 4' },
    { id: 5, src: '/placeholder-5.jpg', alt: 'Post 5' },
    { id: 6, src: '/placeholder-6.jpg', alt: 'Post 6' },
    { id: 7, src: '/homepage-1.jpg', alt: 'Post 7' },
    { id: 8, src: '/about-image.jpg', alt: 'Post 8' },
    { id: 9, src: '/homepage-image.jpg', alt: 'Post 9' },
    { id: 10, src: '/placeholder-1.jpg', alt: 'Post 10' },
    { id: 11, src: '/placeholder-2.jpg', alt: 'Post 11' },
    { id: 12, src: '/placeholder-3.jpg', alt: 'Post 12' },
    { id: 13, src: '/placeholder-4.jpg', alt: 'Post 13' },
    { id: 14, src: '/placeholder-5.jpg', alt: 'Post 14' },
    { id: 15, src: '/placeholder-6.jpg', alt: 'Post 15' },
    // Add more columns for better scrolling
    { id: 16, src: '/homepage-image.jpg', alt: 'Post 16' },
    { id: 17, src: '/about-image.jpg', alt: 'Post 17' },
    { id: 18, src: '/placeholder-1.jpg', alt: 'Post 18' },
    { id: 19, src: '/placeholder-2.jpg', alt: 'Post 19' },
    { id: 20, src: '/placeholder-3.jpg', alt: 'Post 20' },
    { id: 21, src: '/placeholder-4.jpg', alt: 'Post 21' },
    { id: 22, src: '/placeholder-5.jpg', alt: 'Post 22' },
    { id: 23, src: '/placeholder-6.jpg', alt: 'Post 23' },
    { id: 24, src: '/homepage-1.jpg', alt: 'Post 24' },
    { id: 25, src: '/about-image.jpg', alt: 'Post 25' },
    { id: 26, src: '/homepage-image.jpg', alt: 'Post 26' },
    { id: 27, src: '/placeholder-1.jpg', alt: 'Post 27' },
    { id: 28, src: '/placeholder-2.jpg', alt: 'Post 28' },
    { id: 29, src: '/placeholder-3.jpg', alt: 'Post 29' },
    { id: 30, src: '/placeholder-4.jpg', alt: 'Post 30' },
  ]

  const openModal = (postId: number) => {
    setSelectedPost(postId)
  }

  const closeModal = () => {
    setSelectedPost(null)
  }

  const selectedPostData = posts.find(post => post.id === selectedPost)

  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="ie project-six-container">
          <div className="post">
            <div className="info">
              <div className="title section">Horizontal Instagram Feed</div>
              <div className="clear"></div>
            </div>
            
            <div className="content" style={{ width: '240px', float: 'left' }}>
              <div className="first-column">
                <p>The Horizontal Instagram Feed presents a unique take on social media grid layouts. This implementation flows horizontally across the entire page, creating an immersive scrolling experience.</p>
                <br />
                <p>Instead of traditional scrollbars, the entire page scrolls horizontally to reveal more content. Each square maintains perfect proportions while filling the available height.</p>
                <br />
                <p>The grid extends infinitely to the right, with the newest content appearing first. As you scroll, you journey through the collection in a cinematic flow.</p>
                <br />
                <p>Scroll horizontally to explore the full grid, or click on any image to view it in detail.</p>
              </div>
              <br style={{ clear: 'both' }} />
            </div>

            {/* Horizontal Instagram Grid adapted to fit content height */}
            <div className="project-six-grid-container">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="project-six-grid-item"
                  onClick={() => openModal(post.id)}
                >
                  <div className="instagram-post-overlay">
                    <div className="overlay-content">
                      <span className="post-number">#{post.id}</span>
                    </div>
                  </div>
                  <Image
                    src={post.src}
                    alt={post.alt}
                    width={600}
                    height={600}
                    className="project-six-grid-image"
                    priority={post.id <= 6} // Prioritize first 6 images
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
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
              <div className="modal-image-container">
                <Image
                  src={selectedPostData.src}
                  alt={selectedPostData.alt}
                  width={600}
                  height={600}
                  className="modal-image"
                />
              </div>
              <div className="modal-info">
                <h3>Post #{selectedPostData.id}</h3>
                <p>{selectedPostData.alt}</p>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
