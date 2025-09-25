import Navigation from '@/components/Navigation'

interface ProjectPageProps {
  title: string
  children: React.ReactNode
}

export default function ProjectPage({ title, children }: ProjectPageProps) {
  return (
    <div className="layout">
      <Navigation />
      <div className="main-content">
        <div className="home-header">
          <h1 className="home-name">{title}</h1>
        </div>
        <div className="content-area">
          <div className="page-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
