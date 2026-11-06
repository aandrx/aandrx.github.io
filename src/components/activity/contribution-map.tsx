'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import ActivityEventIcon from '@/components/activity/activity-event-icon'
import type { ActivityEvent, ContributionDay, ContributionMonth, ContributionWeek } from '@/lib/activity-types'

type Props = {
  calendar: {
    totalContributions: number
    months: ContributionMonth[]
    weeks: ContributionWeek[]
  }
  events?: ActivityEvent[]
  title?: string
  showIndex?: boolean
  showHeading?: boolean
  bare?: boolean
}

const PREVIEW_WIDTH = 340
const PREVIEW_MAX_EVENTS = 4
const GAP = 14
const CLOSE_DELAY_MS = 220

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

function previewHeight(eventCount: number) {
  if (eventCount <= 0) return 86
  const rows = 62 + Math.min(eventCount, PREVIEW_MAX_EVENTS) * 48
  return eventCount > PREVIEW_MAX_EVENTS ? rows + 16 : rows
}

export default function ContributionMap({ calendar, events, title = 'Contribution map', showIndex = true, showHeading = true, bare = false }: Props) {
  const [hovered, setHovered] = useState<{ day: ContributionDay; left: number; top: number } | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const hoveredDate = hovered?.day.date
  const sideRef = useRef<'right' | 'left'>('right')
  const gridRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<number | null>(null)

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, ActivityEvent[]>()
    for (const event of events ?? []) {
      const key = event.occurredAt.slice(0, 10)
      const list = grouped.get(key)
      if (list) list.push(event)
      else grouped.set(key, [event])
    }
    return grouped
  }, [events])

  const closeNow = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    sideRef.current = 'right'
    setPreviewVisible(false)
    setHovered(null)
    setAnnouncement('')
  }

  // Crossing the gaps between squares keeps the card mounted for a moment so
  // traversal feels continuous instead of restarting the entrance animation.
  const scheduleClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    setPreviewVisible(false)
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      sideRef.current = 'right'
      setHovered(null)
    }, CLOSE_DELAY_MS)
  }

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  useEffect(() => {
    if (!hovered) return
    const close = () => closeNow()
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [hovered])

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
  }, [])

  // Mount the portal hidden, then reveal it on the next frame so the first
  // appearance also uses the same fade transition as the exit.
  useEffect(() => {
    if (!hoveredDate) {
      setPreviewVisible(false)
      return
    }
    const frame = window.requestAnimationFrame(() => setPreviewVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [hoveredDate])

  // The card anchors to the hovered square, not the cursor, so it stays still
  // while the pointer moves inside one cell.
  const showDay = (day: ContributionDay, announce = false) => {
    cancelClose()
    if (announce) {
      setAnnouncement(`${formatDate(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}`)
    } else {
      setAnnouncement('')
    }
    const cell = gridRef.current?.querySelector<HTMLElement>(`[data-date="${day.date}"]`)
    if (!cell) return
    const rect = cell.getBoundingClientRect()
    const height = previewHeight(eventsByDay.get(day.date)?.length ?? 0)
    // Keep the chosen side sticky for the whole hover so the card cannot flip
    // back and forth when the pointer nears the clamp threshold.
    if (sideRef.current === 'right' && rect.right + GAP + PREVIEW_WIDTH > window.innerWidth - 8) {
      sideRef.current = 'left'
    }
    const rawLeft = sideRef.current === 'right' ? rect.right + GAP : rect.left - PREVIEW_WIDTH - GAP
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - PREVIEW_WIDTH - 8))
    const anchorY = rect.top + rect.height / 2
    const top = anchorY + 18 + height > window.innerHeight
      ? Math.max(8, anchorY - height - 12)
      : Math.max(8, anchorY + 18)
    setHovered({ day, left, top })
  }


  const hoveredDayEvents = hovered ? (eventsByDay.get(hovered.day.date) ?? []) : []
  const hoveredEvents = hoveredDayEvents.slice(0, PREVIEW_MAX_EVENTS)
  const hoveredHiddenCount = hoveredDayEvents.length - hoveredEvents.length

  const columns = calendar.weeks.map((week) => {
    const days: Array<ContributionDay | null> = Array.from({ length: 7 }, () => null)
    for (const day of week.days) days[utcDay(day.date)] = day
    return days
  })

  const keyboardDays = columns.flat().filter((day): day is ContributionDay => Boolean(day))

  const dayPositions = new Map<string, { week: number; day: number }>()
  columns.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      if (day) dayPositions.set(day.date, { week: weekIndex, day: dayIndex })
    })
  })
  const hoverPosition = hovered ? dayPositions.get(hovered.day.date) : undefined

  const rippleStyle = (weekIndex: number, dayIndex: number): CSSProperties => {
    if (!bare || !hoverPosition) return { '--ripple': '0', '--ripple-brightness': '1', '--ripple-alpha': '0', '--ripple-delay': '0s' } as CSSProperties
    const distance = Math.hypot(weekIndex - hoverPosition.week, dayIndex - hoverPosition.day)
    const ripple = Math.max(0, 1 - distance / 3.6)
    return {
      '--ripple': ripple.toFixed(3),
      '--ripple-brightness': (1 + ripple * 0.30).toFixed(3),
      '--ripple-alpha': (ripple * 0.18).toFixed(3),
      '--ripple-delay': `${Math.min(0.14, distance * 0.022).toFixed(3)}s`,
    } as CSSProperties
  }

  const handleGridPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    const target = (event.target as HTMLElement).closest<HTMLElement>('.map-cell[data-date]')
    const date = target?.dataset.date
    if (!date || date === hovered?.day.date) return
    const day = keyboardDays.find((candidate) => candidate.date === date)
    if (day) showDay(day)
  }

  const handleGridPointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    cancelClose()
    if (hovered) setPreviewVisible(true)
  }

  const handleGridPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    scheduleClose()
  }

  const moveSelection = (delta: number) => {
    if (!hovered) return
    const index = keyboardDays.findIndex((day) => day.date === hovered.day.date)
    if (index < 0) return
    const next = keyboardDays[Math.max(0, Math.min(keyboardDays.length - 1, index + delta))]
    if (next) showDay(next, true)
  }

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
      {showHeading ? (
        <div className="lab-section-head">
          <div>
            {showIndex ? <span className="lab-section-index">01</span> : null}
            <h2 id="map-title">{title}</h2>
          </div>
          <p className="lab-section-count">{total.toLocaleString('en-US')} contributions</p>
        </div>
      ) : (
        <h2 id="map-title" className="sr-only">{title}</h2>
      )}

      <p className="map-status sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

      <div
        className={bare ? 'map-frame is-bare' : 'map-frame'}
        {...(bare ? {
          tabIndex: 0,
          role: 'application',
          'aria-label': `${title}. Use arrow keys to inspect days; press Escape to close the preview.`,
          onFocus: () => { if (!hovered && keyboardDays.length) showDay(keyboardDays[keyboardDays.length - 1], true) },
          onBlur: () => closeNow(),
          onKeyDown: (event) => {
            if (event.key === 'Escape') { closeNow(); return }
            const deltas: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }
            if (event.key in deltas) {
              event.preventDefault()
              if (hovered) moveSelection(deltas[event.key])
              else if (keyboardDays.length) showDay(keyboardDays[keyboardDays.length - 1], true)
            }
          },
        } : {})}
      >
        {bare ? null : (
          <div className="map-heading">
            <p className="map-total">
              {total.toLocaleString('en-US')} contributions
              <span>{rangeLabel}</span>
            </p>
            <p className="map-note">GitHub calendar, in UTC</p>
          </div>
        )}

        {bare ? null : (
          <div className="map-months" aria-hidden="true" style={{ '--weeks': columns.length } as CSSProperties}>
            <span className="map-months-spacer" />
            {monthLabels.map((label, index) => (
              <span className="map-month" key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        )}

        <div className="map-body" aria-hidden="true">
          {bare ? null : (
            <div className="map-weekdays">
              {WEEKDAYS.map((day, index) => (
                <span key={day} className={VISIBLE_WEEKDAYS.has(index) ? '' : 'is-quiet'}>{day}</span>
              ))}
            </div>
          )}
          <div
            className="map-weeks"
            ref={gridRef}
            style={{ '--weeks': columns.length } as CSSProperties}
            {...(bare ? {
              onPointerMove: handleGridPointerMove,
              onPointerEnter: handleGridPointerEnter,
              onPointerLeave: handleGridPointerLeave,
            } : {})}
          >
            {columns.map((week, weekIndex) => (
              week.map((day, dayIndex) => day ? (
                <span
                  className="map-cell"
                  data-level={day.level}
                  data-date={bare ? day.date : undefined}
                  key={day.date}
                  title={bare ? undefined : `${formatDate(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                  style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1, ...rippleStyle(weekIndex, dayIndex) }}
                  onTouchStart={bare ? () => (hovered?.day.date === day.date ? closeNow() : showDay(day, true)) : undefined}
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

        {bare ? null : (
          <div className="map-foot">
            <p className="map-foot-note">Week starts Sunday. Hover a day for its count.</p>
            <div className="map-legend" role="group" aria-label="Contribution intensity from less to more">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => <span className="map-cell map-legend-cell" data-level={level} key={level} />)}
              <span>More</span>
            </div>
          </div>
        )}

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

      {bare && hovered
        ? createPortal(
            <div className={`map-preview${previewVisible ? ' is-visible' : ''}`} style={{ left: hovered.left, top: hovered.top }} aria-hidden="true">
              <p className="map-preview-head">
                <span>{formatDate(hovered.day.date)}</span>
                <span>{hovered.day.count} contribution{hovered.day.count === 1 ? '' : 's'}</span>
              </p>
              {hoveredEvents.length > 0 ? (
                <ul className="map-preview-list">
                  {hoveredEvents.map((event) => (
                    <li className="map-preview-row" key={event.id}>
                      <span className={`map-preview-icon map-preview-icon--${event.type}`} aria-hidden="true">
                        <ActivityEventIcon type={event.type} />
                      </span>
                      <div className="map-preview-body">
                        <p className="map-preview-line">
                          <span className="map-preview-action">{event.action}</span>{' '}
                          {event.title ? <span className="map-preview-title">{event.title}</span> : null}
                        </p>
                        <p className="map-preview-meta">
                          <span className="map-preview-repo">{event.repo}</span>
                          {typeof event.count === 'number' ? (
                            <span className="map-preview-count">{event.count}</span>
                          ) : null}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="map-preview-empty">{hovered.day.count > 0 ? 'No public detail' : 'No contributions'}</p>
              )}
              {hoveredHiddenCount > 0 ? (
                <p className="map-preview-more">+{hoveredHiddenCount} more</p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
