import './contact.css'
import Navigation from '@/components/Navigation'

export default function ContactPage() {
  return (
    <div className="layout">
      <Navigation />
      <div id="container" className="contact-container ie">
        <div className="post contact-post">
          <div className="info">
            <div className="title section">Contact</div>
            <div className="clear"></div>
          </div>

          <div className="content">
            <p>
              <strong>Tel:</strong> +15094056458
            </p>
            
            <p>
              <strong>Email:</strong> andrxwliu@gmail.com / aliu458@gatech.edu
            </p>
            
            <p>
              <strong>Instagram:</strong> andweez
            </p>

            <p>
              <strong>GitHub:</strong> aandrx
            </p>
          </div>
        </div>

        <div className="tracer"></div>
        <div className="clear"></div>
      </div>
    </div>
  )
}
