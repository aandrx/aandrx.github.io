import Navigation from '@/components/Navigation'

export default function HomePage() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="home-header">
          <h1 className="home-name">Ziyi Le</h1>
        </div>
        <div className="home-image-container">
          <img 
            src="/homepage-image.jpg" 
            alt="Lakeside scene with people and trees" 
            className="home-image"
          />
        </div>
      </div>
    </div>
  )
}
