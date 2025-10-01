import './about.css'
import Navigation from '@/components/Navigation'

export default function AboutPage() {
  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="about-container ie">
        <div className="post about-post">
          <div className="info">
            <div className="title section">About</div>
            <div className="clear"></div>
          </div>
          
          <div className="content">
            <figure className="wp-block-gallery has-nested-images columns-default is-cropped wp-block-gallery-1 is-layout-flex wp-block-gallery-is-layout-flex">
              <figure className="wp-block-image size-large">
                <div className="wp-caption" style={{ width: 'auto' }}>
                  <img 
                    decoding="async"
                    fetchPriority="high"
                    src="/about-image.jpg" 
                    alt="About image" 
                    className="about-image ie"
                    style={{ width: '760px', height: 'auto' }}
                  />
                </div>
              </figure>
            </figure>

            <p>
              <strong>Andrew Liu</strong>, born in 1993 in Fujian, China, is an independent photographer currently based in Hangzhou. In 2024, Andrew participated in <em>Multi-Exposure: New Narrative in Photography</em> and <em>Redefine: Contemporary Portrait Photography</em>, and his photobook <em>New Comer</em> was published by Imageless Publishing. In the same year, he held a solo exhibition of his <em>New Comer</em> series at Place M in Tokyo. In 2023, he was honored with the Leica Oskar Barnack Newcomer Award and exhibited his work in the <em>Light and Shadows</em> exhibition as part of the Leica Oskar Barnack Award series.
            </p>

            <p>
              In 2022, Andrew participated in <em>Them</em>, a segment of the <em>Local Action</em> exhibitions at the Jimei·Arles International Photography Festival. That same year, his work was shortlisted for the Young Portfolio collection award by the Kiyosato Museum of Art in Japan. In 2021, he was shortlisted for the BarTur Photography Award.
            </p>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
