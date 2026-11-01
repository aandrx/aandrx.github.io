import type { Metadata } from 'next'
import Link from 'next/link'
import { FEED_ENTRIES, type FeedEntry } from '@/lib/feed-data'
import FeedTop from './feed-top'
import './feed.css'

export const metadata: Metadata = {
  title: 'Feed · Andrew Liu',
  description: 'Notes from the desk, the camera, and the work in between.',
}

function FeedRow({ entry }: { entry: FeedEntry }) {
  const content = (
    <>
      <span>{entry.title}</span>
      {entry.dateTime ? <time dateTime={entry.dateTime}>{entry.date}</time> : <span className="feed-row-date">{entry.date}</span>}
    </>
  )

  return (
    <li className="feed-row">
      {entry.external ? (
        <a className="feed-row-link" href={entry.href} target="_blank" rel="noreferrer" title="Opens in a new tab">
          {content}
        </a>
      ) : (
        <Link className="feed-row-link" href={entry.href}>
          {content}
        </Link>
      )}
    </li>
  )
}

export default function FeedIndexPage() {
  const years = FEED_ENTRIES.reduce<Record<string, FeedEntry[]>>((groups, entry) => {
    const year = entry.dateTime?.slice(0, 4) ?? entry.date
    groups[year] = [...(groups[year] ?? []), entry]
    return groups
  }, {})

  return (
    <main className="feed-page feed-index" data-feed-index>
      <FeedTop />
      <div className="feed-index-inner">
        <h1 className="feed-index-title">Feed</h1>
        {Object.entries(years).map(([year, entries]) => (
          <section key={year} aria-labelledby={`feed-year-${year}`}>
            <h2 className="feed-year" id={`feed-year-${year}`}>{year}</h2>
            <ul className="feed-list">
              {entries.map((entry) => <FeedRow key={`${entry.title}-${entry.date}`} entry={entry} />)}
            </ul>
          </section>
        ))}
        <div className="feed-index-foot">
          <a href="https://github.com/aandrx" target="_blank" rel="noreferrer" aria-label="aandrx on GitHub (opens in a new tab)">aandrx on GitHub</a>
        </div>
      </div>
    </main>
  )
}
