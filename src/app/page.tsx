import Navigation from '@/components/Navigation'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="ie">
          <div className="post">
            <div className="info">
              <div className="title section">Andrew Liu</div>
              <div className="clear"></div>
            </div>
            
            <div className="content">
              <div className="imageElement ie">
                <div className="wp-caption" style={{ width: '573.244px' }}>
                  <Image
                    src="/homepage-image.jpg"
                    alt="Lakeside scene with people and trees"
                    width={1024}
                    height={836}
                    style={{ height: '468px', width: '573.244px' }}
                    className="wp-image-78"
                  />
                </div>
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
