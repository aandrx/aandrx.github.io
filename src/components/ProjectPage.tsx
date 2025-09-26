import Navigation from '@/components/Navigation'

interface ProjectPageProps {
  title: string
  children: React.ReactNode
}

export default function ProjectPage({ title, children }: ProjectPageProps) {
  return (
    <div className="layout">
      <Navigation />
      <div id="container">
        <div className="post">
          <div className="info">
            <div className="title section">
              <h1>{title}</h1>
            </div>
            <div className="extended-section">
              {/* Future-proof extended section - currently empty */}
            </div>
          </div>
          <div className="content">
            <div className="first column ie">
              {children}
            </div>
            <div className="column ie">
              {/* Second column - content will appear here when first column overflows */}
              <p>This is the second column. Content will flow here when the first column is full.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
