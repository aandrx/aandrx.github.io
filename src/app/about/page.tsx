import Navigation from '@/components/Navigation'

export default function AboutPage() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="home-header">
          <h1 className="home-name">About</h1>
        </div>
        <div className="home-image-container">
          <img 
            src="/about-image.jpg" 
            alt="About image" 
            className="home-image"
          />
        </div>
        <div className="content-area">
          <div className="page-content">
            <p>
              Andrew Liu, born in 1993 in Fujian, China, is an independent photographer currently based in Hangzhou. In 2024, Andrew participated in Multi-Exposure: New Narrative in Photography and Redefine: Contemporary Portrait Photography, and his photobook New Comer was published by Imageless Publishing. In the same year, he held a solo exhibition of his New Comer series at Place M in Tokyo. In 2023, he was honored with the Leica Oskar Barnack Newcomer Award and exhibited his work in the Light and Shadows exhibition as part of the Leica Oskar Barnack Award series.
            </p>
            
            <p>
              In 2022, Andrew participated in Them, a segment of the Local Action exhibitions at the Jimei·Arles International Photography Festival. That same year, his work was shortlisted for the Young Portfolio collection award by the Kiyosato Museum of Art in Japan. In 2021, he was shortlisted for the BarTur Photography Award.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
