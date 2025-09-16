import Navigation from '@/components/Navigation'

export default function NotFound() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="content-area">
          <div className="text-content">
            <p><strong>404 - Page not found</strong></p>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
