import type { RepositoryActivity } from '@/lib/activity-types'

type Props = {
  repositories: RepositoryActivity[]
  months: Array<{ name: string; firstDay: string; year: number }>
  totals: {
    contributions: number
    commits: number
    pullRequests: number
    reviews: number
    issues: number
    restricted: number
  }
  to: string
}

function formatMonth(firstDay: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${firstDay}T00:00:00Z`))
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`
}

function pct(value: number, total: number) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function FocusGraph({ repositories, months, totals, to }: Props) {
  const publicRepos = repositories.filter((repo) => !repo.isPrivate)
  const typedTotal = repositories.reduce((sum, repo) => sum + repo.total, 0)
  const max = Math.max(...repositories.map((repo) => repo.total), 1)
  const monthTotals = new Map<string, number>()
  for (const repo of repositories) {
    for (const [month, count] of Object.entries(repo.months)) {
      monthTotals.set(month, (monthTotals.get(month) ?? 0) + count)
    }
  }
  const currentMonth = to.slice(0, 7)
  const top = repositories[0]

  return (
    <section className="lab-section focus-section" aria-labelledby="focus-title">
      <div className="lab-section-head">
        <div>
          <span className="lab-section-index">02</span>
          <h2 id="focus-title">Where the work went</h2>
        </div>
        <p className="lab-section-count">Last 90 days</p>
      </div>

      <dl className="focus-stats">
        <div><dt>Contributions</dt><dd>{totals.contributions.toLocaleString('en-US')}</dd></div>
        <div><dt>Commits</dt><dd>{totals.commits.toLocaleString('en-US')}</dd></div>
        <div><dt>Pull requests</dt><dd>{totals.pullRequests.toLocaleString('en-US')}</dd></div>
        <div><dt>Reviews</dt><dd>{totals.reviews.toLocaleString('en-US')}</dd></div>
        <div><dt>Issues</dt><dd>{totals.issues.toLocaleString('en-US')}</dd></div>
      </dl>

      {top ? (
        <p className="focus-callout">
          <strong>{top.name}</strong> took the largest share of typed contributions
          <span>{pct(top.total, typedTotal)}%</span>
        </p>
      ) : null}

      <div className="focus-months" role="group" aria-label="Typed contributions by month">
        {months.map((month) => {
          const key = month.firstDay.slice(0, 7)
          const count = monthTotals.get(key) ?? 0
          return (
            <div className="focus-month" key={key}>
              <div className="focus-month-label">
                <span>{formatMonth(month.firstDay)}</span>
                {key === currentMonth ? <em>partial</em> : null}
              </div>
              <strong>{count.toLocaleString('en-US')}</strong>
              <div className="focus-month-track" aria-hidden="true">
                <span style={{ width: `${pct(count, Math.max(...monthTotals.values(), 1))}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="focus-list-head">
        <span>Repository</span>
        <span>Typed contributions</span>
      </div>
      <ol className="focus-list">
        {repositories.map((repo) => (
          <li className="focus-repo" key={`${repo.name}-${repo.url ?? 'private'}`}>
            <div className="focus-repo-head">
              <div className="focus-repo-name">
                {repo.url ? (
                  <a href={repo.url} target="_blank" rel="noreferrer" title="Opens in a new tab">{repo.name}</a>
                ) : (
                  <span>{repo.name}</span>
                )}
                {repo.isPrivate ? <span className="focus-private">private</span> : null}
              </div>
              <div className="focus-repo-total">
                <strong>{repo.total.toLocaleString('en-US')}</strong>
                <span>{pct(repo.total, typedTotal)}%</span>
              </div>
            </div>
            <div className="focus-bar" aria-hidden="true">
              <span style={{ width: `${Math.max(2, (repo.total / max) * 100)}%` }} />
            </div>
            <div className="focus-repo-meta">
              <span>{formatCount(repo.commits, 'commit')}</span>
              <span>{formatCount(repo.pullRequests, 'PR')}</span>
              {repo.reviews ? <span>{formatCount(repo.reviews, 'review')}</span> : null}
              {repo.issues ? <span>{formatCount(repo.issues, 'issue')}</span> : null}
              {repo.lastActive ? <span>last active {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(repo.lastActive))}</span> : null}
            </div>
          </li>
        ))}
      </ol>

      <p className="focus-footnote">
        Type totals can differ from the calendar total by a few repository-level contributions.
        {publicRepos.length < repositories.length ? ' Private work is grouped without a repository name.' : ''}
        {totals.restricted > 0 ? ` GitHub reports ${totals.restricted.toLocaleString('en-US')} restricted contributions.` : ''}
      </p>
    </section>
  )
}
