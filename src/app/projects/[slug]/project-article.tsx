import Link from 'next/link'
import type { ProjectItem } from '@/lib/project-data'
import ProjectsTop from '../projects-top'
import '../../feed/feed.css'
import '../../feed/[slug]/feed-article.css'

type Props = {
  project: ProjectItem
  next?: ProjectItem
}

export default function ProjectArticle({ project, next }: Props) {
  return (
    <main className="feed-page feed-article" data-project-article={project.slug}>
      <ProjectsTop />

      <article className="feed-article-main">
        <header className="feed-article-head">
          <h1>{project.title}</h1>
          <p className="feed-article-date">Project</p>
        </header>

        <div className="feed-body">
          <p>{project.detail}</p>
          <p>More project notes, demos, and photographs will be added here.</p>
        </div>

        <div className="feed-related" aria-label="Related links">
          <span>Related</span>
          <a href={project.repo} target="_blank" rel="noreferrer" title="Opens in a new tab">Repository</a>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          {next ? (
            <Link href={`/projects/${next.slug}/`}>Next: {next.title} →</Link>
          ) : (
            <Link href="/projects/">Projects →</Link>
          )}
        </footer>
      </article>
    </main>
  )
}
