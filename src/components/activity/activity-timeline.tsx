import type { ActivityEvent } from '@/lib/activity-types'
import ActivityEventIcon from '@/components/activity/activity-event-icon'

type Props = {
  events: ActivityEvent[]
  showIndex?: boolean
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

export default function ActivityTimeline({ events, showIndex = true }: Props) {
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
          {showIndex ? <span className="lab-section-index">03</span> : null}
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
                      <ActivityEventIcon type={event.type} />
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
