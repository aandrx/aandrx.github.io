import Navigation from '@/components/Navigation'

export default function ContactPage() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="home-header">
          <h1 className="home-name">Contact</h1>
        </div>
        <div className="content-area">
          <div className="page-content">
            <p>
              <strong>Tel:</strong> +1 (234) 567-890
            </p>
            
            <p>
              <strong>Email:</strong> hello@yourname.com
            </p>
            
            <p>
              <strong>Instagram:</strong> @yourhandle
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
