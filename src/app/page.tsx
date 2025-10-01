import './home.css'
import Navigation from '@/components/Navigation'

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
          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '573.244px' }}>
              <img 
                decoding="async"
                fetchPriority="high"
                width={1024}
                height={836}
                src="/homepage-image.jpg" 
                alt="Lakeside scene with people and trees" 
                className="wp-image-78"
                style={{ height: '468px', width: '573.244px' }}
              />
            </div>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
