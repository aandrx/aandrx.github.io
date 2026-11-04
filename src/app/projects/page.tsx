import type { Metadata } from 'next'
import { PROJECT_GROUPS, type ProjectItem } from '@/lib/project-data'
import { getCachedActivityData } from '@/lib/github-activity-cache'
import ActivityTimeline from '@/components/activity/activity-timeline'
import ContributionMap from '@/components/activity/contribution-map'
import FocusGraph from '@/components/activity/focus-graph'
import ProjectsTop from './projects-top'
import '../feed/feed.css'
import '../lab/recent-work/lab.css'
import './projects.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Projects · Andrew Liu',
  description: 'Selected software projects, experiments, and client work.',
  alternates: {
    canonical: '/projects/',
  },
}

function ProjectRow({ project }: { project: ProjectItem }) {
  return (
    <li className="feed-row">
      <a className="feed-row-link projects-row-link" href={project.repo} target="_blank" rel="noreferrer" title="Opens in a new tab">
        <span className="projects-row-main">
          <span className="projects-row-head">
            <strong className="projects-row-title">{project.title}</strong>
            {project.tag ? <span className="projects-row-tag">{project.tag}</span> : null}
          </span>
          <span className="projects-row-summary">{project.summary}</span>
        </span>
      </a>
    </li>
  )
}

export default async function ProjectsIndexPage() {
  const activity = await getCachedActivityData()

  return (
    <main className="feed-page feed-index">
      <ProjectsTop />
      <div className="feed-index-inner">
        <h1 className="feed-index-title">Projects</h1>
        <div className="activity-lab projects-activity-shell">
          <ContributionMap calendar={activity.calendar} title="Recent work" showIndex={false} />
        </div>
        {PROJECT_GROUPS.map((group) => (
          <section key={group.title} aria-labelledby={`projects-group-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
            <h2 className="feed-year" id={`projects-group-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{group.title}</h2>
            <ul className="feed-list">
              {group.entries.map((project) => <ProjectRow key={project.title} project={project} />)}
            </ul>
          </section>
        ))}
        <details className="projects-activity">
          <summary className="projects-activity-summary">
            <span className="projects-activity-summary-main">More recent activity</span>
            <span className="projects-activity-summary-note">Focus and timeline</span>
          </summary>
          <div className="activity-lab projects-activity-shell">
            <div className="lab-lower">
              <FocusGraph
                repositories={activity.repositories}
                months={activity.calendar.months}
                totals={activity.totals}
                to={activity.to}
                showIndex={false}
              />
              <ActivityTimeline events={activity.events} showIndex={false} />
            </div>
          </div>
        </details>
        <div className="feed-index-foot">
          <a href="https://github.com/aandrx" target="_blank" rel="noreferrer" aria-label="aandrx on GitHub (opens in a new tab)">aandrx on GitHub</a>
        </div>
      </div>
    </main>
  )
}
