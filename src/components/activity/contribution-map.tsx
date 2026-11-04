import type { CSSProperties } from 'react'
import type { ContributionDay, ContributionMonth, ContributionWeek } from '@/lib/activity-types'

type Props = {
  calendar: {
    totalContributions: number
    months: ContributionMonth[]
    weeks: ContributionWeek[]
  }
  title?: string
  showIndex?: boolean
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const VISIBLE_WEEKDAYS = new Set([1, 3, 5])

function utcDay(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function formatMonth(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function formatWeekOf(date: string) {
  return `Week of ${formatDate(date)}`
}

export default function ContributionMap({ calendar, title = 'Contribution map', showIndex = true }: Props) {
  const columns = calendar.weeks.map((week) => {
    const days: Array<ContributionDay | null> = Array.from({ length: 7 }, () => null)
    for (const day of week.days) days[utcDay(day.date)] = day
    return days
  })

  let lastMonth = ''
  const monthLabels = columns.map((week) => {
    const first = week.find((day): day is ContributionDay => Boolean(day))
    if (!first) return ''
    const month = first.date.slice(0, 7)
    if (month === lastMonth) return ''
    lastMonth = month
    return formatMonth(first.date)
  })

  const total = calendar.totalContributions
  const firstDate = columns[0]?.find((day): day is ContributionDay => Boolean(day))?.date ?? ''
  const lastWeek = columns[columns.length - 1] ?? []
  const lastDate = [...lastWeek].reverse().find((day): day is ContributionDay => Boolean(day))?.date ?? firstDate
  const rangeLabel = firstDate ? `${formatDate(firstDate)} to ${formatDate(lastDate)}` : ''

  return (
    <section className="lab-section activity-map-section" aria-labelledby="map-title">
      <div className="lab-section-head">
        <div>
          {showIndex ? <span className="lab-section-index">01</span> : null}
          <h2 id="map-title">{title}</h2>
        </div>
        <p className="lab-section-count">{total.toLocaleString('en-US')} contributions</p>
      </div>

      <div className="map-frame">
        <div className="map-heading">
          <p className="map-total">
            {total.toLocaleString('en-US')} contributions
            <span>{rangeLabel}</span>
          </p>
          <p className="map-note">GitHub calendar, in UTC</p>
        </div>

        <div className="map-months" aria-hidden="true" style={{ '--weeks': columns.length } as CSSProperties}>
          <span className="map-months-spacer" />
          {monthLabels.map((label, index) => (
            <span className="map-month" key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div className="map-body" aria-hidden="true">
          <div className="map-weekdays">
            {WEEKDAYS.map((day, index) => (
              <span key={day} className={VISIBLE_WEEKDAYS.has(index) ? '' : 'is-quiet'}>{day}</span>
            ))}
          </div>
          <div className="map-weeks" style={{ '--weeks': columns.length } as CSSProperties}>
            {columns.map((week, weekIndex) => (
              week.map((day, dayIndex) => day ? (
                <span
                  className="map-cell"
                  data-level={day.level}
                  key={day.date}
                  title={`${formatDate(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                  style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1 }}
                />
              ) : (
                <span
                  className="map-cell is-empty"
                  aria-hidden="true"
                  key={`${weekIndex}-${dayIndex}`}
                  style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1 }}
                />
              )
            )))}
          </div>
        </div>

        <div className="map-foot">
          <p className="map-foot-note">Week starts Sunday. Hover a day for its count.</p>
          <div className="map-legend" role="group" aria-label="Contribution intensity from less to more">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => <span className="map-cell map-legend-cell" data-level={level} key={level} />)}
            <span>More</span>
          </div>
        </div>

        <table className="sr-only">
          <caption>
            GitHub contribution calendar from {firstDate ? formatDate(firstDate) : ''} to{' '}
            {lastDate ? formatDate(lastDate) : ''}. {total} contributions.
          </caption>
          <thead>
            <tr>
              <td />
              {columns.map((week, index) => {
                const first = week.find((day): day is ContributionDay => Boolean(day))
                return <th scope="col" key={`head-${index}`}>{first ? formatWeekOf(first.date) : ''}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS.map((dayName, dayIndex) => (
              <tr key={dayName}>
                <th scope="row">{dayName}</th>
                {columns.map((week, weekIndex) => {
                  const day = week[dayIndex]
                  return (
                    <td key={`${weekIndex}-${dayIndex}`}>
                      {day ? <span>{formatDate(day.date)}: {day.count} contribution{day.count === 1 ? '' : 's'}</span> : null}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
