import type { ActivityEvent, ActivityEventType } from '@/lib/activity-types'

type Props = {
  events: ActivityEvent[]
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

const TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
})

function formatDate(date: string) {
  return DATE_FORMAT.format(new Date(`${date}T00:00:00Z`))
}

function formatTime(value: string) {
  return TIME_FORMAT.format(new Date(value))
}

function EventIcon({ type }: { type: ActivityEventType }) {
  if (type === 'commit') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v5M10 13v5" />
      </svg>
    )
  }
  if (type === 'pull-request') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="6" cy="5" r="2" />
        <circle cx="14" cy="15" r="2" />
        <path d="M6 7v8M8 5h4a2 2 0 0 1 2 2v6" />
      </svg>
    )
  }
  if (type === 'review') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7" />
        <path d="m6.8 10.2 2.1 2.1 4.5-4.6" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4" y="4" width="12" height="12" />
      <circle cx="10" cy="10" r="1.5" />
    </svg>
  )
}

export default function ActivityTimeline({ events }: Props) {
  const groups = new Map<string, ActivityEvent[]>()
  for (const event of events) {
    const date = event.occurredAt.slice(0, 10)
    const group = groups.get(date) ?? []
    group.push(event)
    groups.set(date, group)
  }

  return (
    <section className="lab-section activity-section" aria-labelledby="activity-title">
      <div className="lab-section-head">
        <div>
          <span className="lab-section-index">03</span>
          <h2 id="activity-title">Recent activity</h2>
        </div>
        <p className="lab-section-count">{events.length} events</p>
      </div>

      {events.length === 0 ? (
        <p className="lab-empty">No public activity in this range.</p>
      ) : (
        <div className="activity-days" tabIndex={0} role="region" aria-label="Recent GitHub activity, newest first">
          {[...groups.entries()].map(([date, dayEvents]) => (
            <section className="activity-day" key={date} aria-labelledby={`activity-${date}`}>
              <h3 id={`activity-${date}`}>{formatDate(date)}</h3>
              <ol className="activity-events">
                {dayEvents.map((event) => (
                  <li className="activity-event" key={event.id}>
                    <span className={`activity-icon activity-icon--${event.type}`} aria-hidden="true">
                      <EventIcon type={event.type} />
                    </span>
                    <div className="activity-event-body">
                      <p className="activity-event-line">
                        <span className="activity-action">{event.action}</span>{' '}
                        {event.url ? (
                          <a href={event.url} target="_blank" rel="noreferrer" title="Opens in a new tab">{event.title}</a>
                        ) : (
                          <span>{event.title}</span>
                        )}
                      </p>
                      <p className="activity-event-meta">
                        {event.repoUrl ? (
                          <a href={event.repoUrl} target="_blank" rel="noreferrer" title="Opens in a new tab">{event.repo}</a>
                        ) : (
                          <span>{event.repo}</span>
                        )}
                        <span aria-hidden="true">/</span>
                        <time dateTime={event.occurredAt}>{formatTime(event.occurredAt)}</time>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}
