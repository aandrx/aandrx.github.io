import Navigation from '@/components/Navigation'
import Image from 'next/image'

export default function ProjectFivePage() {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div id="container" className="ie">
          <div className="post">
            <div className="info">
              <div className="title section">New Comer</div>
              <div className="clear"></div>
            </div>
            
            <div className="content" style={{ width: '240px', float: 'left' }}>
              <div className="first-column">
                <p>I spent little time with my parents throughout my whole growth, less communication, long being alienated, thereby giving rise to a sense of staying in middle of nowhere. Every time when confronted with the built-in family issue, I would intend to shun away instinctively.</p>
                <br />
                <p>In March 2020, I moved to Hangzhou to get rid of the anxieties as well as for career. There, I got well paid and gained inner peace eventually, but later the routine of job bored me beyond bearing. Out of the basic instinct as a photographer, I decided to explore the similar void of mind state among young people like me scattered in different cities, to see their faces as well as check over my deep self-doubt. Therefore, I post my personal photo project "New Comer" in Weibo, twitter-like social media in mainland China, and received more than 40 applicants.</p>
                <br />
                <p>Before shooting, I predicted their inner drives to different cities: career, money, emotion issue, or just escaping family. In the process of shooting and communicating with them, I found my predictions well fit, but the point is that even I share a lot with most of them, I am still touched by every each individual, his or her willingness to thrive, trying to gain redemption in ways positive, or negative.</p>
              </div>
              <br style={{ clear: 'both' }} />
            </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/test-image.jpg"
                alt="Project Five Image 1"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/test-image-2.jpg"
                alt="Project Five Image 2"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/homepage-image.jpg"
                alt="Project Five Image 3"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/placeholder-1.jpg"
                alt="Project Five Image 4"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/placeholder-2.jpg"
                alt="Project Five Image 5"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="836" data-height="1024">
            <div className="wp-caption" style={{ width: '617.203px' }}>
              <Image
                src="/placeholder-3.jpg"
                alt="Project Five Image 6"
                width={836}
                height={1024}
                style={{ height: '756px', width: '617.203px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/placeholder-4.jpg"
                alt="Project Five Image 7"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="1024" data-height="836">
            <div className="wp-caption" style={{ width: '926.01px' }}>
              <Image
                src="/placeholder-5.jpg"
                alt="Project Five Image 8"
                width={1024}
                height={836}
                style={{ height: '756px', width: '926.01px' }}
              />
            </div>
          </div>

          <div className="imageElement ie" data-width="836" data-height="1024">
            <div className="wp-caption" style={{ width: '617.203px' }}>
              <Image
                src="/placeholder-6.jpg"
                alt="Project Five Image 9"
                width={836}
                height={1024}
                style={{ height: '756px', width: '617.203px' }}
              />
            </div>
          </div>

          </div>
          <div className="clear"></div>
        </div>
      </div>
    </div>
  )
}
