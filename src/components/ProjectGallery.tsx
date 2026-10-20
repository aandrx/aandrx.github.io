import { Fragment, ReactNode } from 'react'
import { extractParagraphs } from '@/lib/column-content'
import Navigation from '@/components/Navigation'
import DynamicColumns from '@/components/DynamicColumns'
import PortfolioImage from '@/components/PortfolioImage'

export interface GalleryPhoto { src: string; alt: string; separator?: boolean }

export default function ProjectGallery({ title, layoutClass, images, children }: {
  title: string
  layoutClass: string
  images: GalleryPhoto[]
  children: ReactNode
}) {
  return (
    <div className={`layout portfolio-gallery-layout ${layoutClass}`}>
      <Navigation />
      <div id="container" className="ie">
        <div className="post">
          <div className="info">
            <div className="title section">{title}</div>
            <div className="clear" />
          </div>
          <div className="content">
            <DynamicColumns columnWidth={200} columnGap={40} paragraphs={extractParagraphs(children)} />
          </div>
          {images.map((image, index) => (
            <Fragment key={image.src}>
              {image.separator && <div className="imageElement ie" aria-hidden="true" style={{ width: 80, marginRight: 40, verticalAlign: 'top' }} />}
              <div className="imageElement ie">
                <div className="wp-caption">
                  <PortfolioImage src={image.src} alt={image.alt} className="wp-image-78" priority={index === 0} />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="tracer" />
      </div>
    </div>
  )
}
