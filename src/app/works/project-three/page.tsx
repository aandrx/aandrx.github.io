import Navigation from '@/components/Navigation'

export default function ProjectThreePage() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="home-header">
          <h1 className="home-name">Project Three</h1>
        </div>
        <div className="content-area">
          <div className="page-content">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam congue tortor eget pulvinar lobortis. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nam ac dolor augue.
            </p>
            
            <p>
              Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin pharetra nonummy pede. Mauris et orci. Aenean nec lorem. In porttitor. Donec laoreet nonummy augue.
            </p>
            
            <p>
              Suspendisse dui purus, scelerisque at, vulputate vitae, pretium mattis, nunc. Mauris eget neque at sem venenatis eleifend. Ut nonummy. Fusce aliquet pede non pede. Suspendisse dapibus lorem pellentesque magna.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
