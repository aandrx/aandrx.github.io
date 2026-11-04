'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { ActivityData } from '@/lib/activity-types'
import ActivityTimeline from '@/components/activity/activity-timeline'
import ContributionMap from '@/components/activity/contribution-map'
import FocusGraph from '@/components/activity/focus-graph'

type Skin = 'ledger' | 'signal' | 'terminal'

const SKINS: Array<{ id: Skin; label: string }> = [
  { id: 'ledger', label: 'Ledger' },
  { id: 'signal', label: 'Signal' },
  { id: 'terminal', label: 'Terminal' },
]

export default function ActivityLab() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [skin, setSkin] = useState<Skin>('signal')
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/github-activity/', { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Activity request failed with ${response.status}`)
        return response.json() as Promise<ActivityData>
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(true)
      })
    return () => controller.abort()
  }, [])

  return (
    <main className="activity-lab" data-skin={skin} data-source={data?.source ?? 'loading'}>
      <div className="activity-lab-inner">
        <header className="lab-head">
          <div className="lab-head-top">
            <Link className="lab-home" href="/">Andrew Liu.</Link>
            <span className="lab-kicker">Lab / Recent work</span>
          </div>
          <h1>Recent work</h1>
          <p className="lab-lede">
            Three ways to read the last ninety days of GitHub activity. The data is the same;
            the questions are different.
          </p>

          <div className="lab-controls">
            <span className="lab-controls-label">Surface</span>
            <div className="lab-skins" role="group" aria-label="Visual style">
              {SKINS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`lab-skin${skin === option.id ? ' is-active' : ''}`}
                  aria-pressed={skin === option.id}
                  onClick={() => setSkin(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="lab-source" data-source-state={data?.source ?? 'loading'}>
              {data?.source === 'live' ? 'Live GitHub data' : data?.source === 'fixture' ? 'Fixture snapshot' : 'Loading data'}
            </span>
          </div>
        </header>

        {error ? (
          <div className="lab-state" role="alert">
            <p>The activity feed could not be loaded.</p>
            <p>Try again after the deployment finishes.</p>
          </div>
        ) : !data ? (
          <div className="lab-state" role="status">
            <p>Reading recent GitHub activity...</p>
          </div>
        ) : (
          <>
            <div className="lab-meta">
              <span>{data.login} on GitHub</span>
              <span>Last 90 days</span>
              <span>Updated {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' }).format(new Date(data.generatedAt))}</span>
            </div>

            <ContributionMap calendar={data.calendar} />

            <div className="lab-lower">
              <FocusGraph
                repositories={data.repositories}
                months={data.calendar.months}
                totals={data.totals}
                to={data.to}
              />
              <ActivityTimeline events={data.events} />
            </div>

            <p className="lab-footnote">
              GitHub counts the calendar total separately from commit, pull request, review, and issue totals.
              {data.source === 'fixture' ? ' This lab is using a checked-in snapshot until a server-side GitHub token is configured.' : ''}
            </p>
          </>
        )}
      </div>
    </main>
  )
}
