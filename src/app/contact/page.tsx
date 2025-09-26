import Navigation from '@/components/Navigation'

export default function ContactPage() {
  return (
    <div className="layout contact-page">
      <Navigation />
      <div className="main-content contact-content">
        <div className="home-header">
          <h1 className="home-name">Contact</h1>
        </div>
        <div className="content-area">
          <div className="page-content">
            <p>
              <strong>Tel:</strong> +1 (509) 405-6458
            </p>
            
            <p>
              <strong>Email:</strong> andrxwliu@gmail.com / aliu458@gatech.edu
            </p>
            
            <p>
              <strong>Instagram:</strong> @andweez
            </p>

            <p>
              <strong>GitHub:</strong> @aandrx
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
