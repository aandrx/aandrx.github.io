'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import MapPreview from './map-preview'
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

export default function ContributionMap({ calendar, events, title = 'Contribution map', showIndex = true, showHeading = true, bare = false }: Props) {
  const [hovered, setHovered] = useState<{ day: ContributionDay; left: number; anchorY: number } | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const isOpen = Boolean(hovered)
  const [rippleActive, setRippleActive] = useState(false)
  const rippleLayer = useRef<HTMLDivElement | null>(null)
  const rippleTarget = useRef({ x: 0, y: 0 })
  const ripplePosition = useRef({ x: 0, y: 0 })
  const rippleFrame = useRef<number | null>(null)
  const rippleEntered = useRef(false)
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

  // Only a grid exit starts dismissal. Gaps retain the last selected date.
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
    if (rippleFrame.current !== null) window.cancelAnimationFrame(rippleFrame.current)
  }, [])

  // Mount the portal hidden, then reveal it on the next frame so the first
  // appearance also uses the same fade transition as the exit.
  useEffect(() => {
    if (!isOpen) {
      setPreviewVisible(false)
      return
    }
    const frame = window.requestAnimationFrame(() => setPreviewVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

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
    const width = Math.min(PREVIEW_WIDTH, window.innerWidth - 16)
    // Keep the chosen side sticky for the whole hover so the card cannot flip
    // back and forth when the pointer nears the clamp threshold.
    if (sideRef.current === 'right' && rect.right + GAP + width > window.innerWidth - 8) {
      sideRef.current = 'left'
    }
    const rawLeft = sideRef.current === 'right' ? rect.right + GAP : rect.left - width - GAP
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - width - 8))
    const anchorY = rect.top + rect.height / 2
    if (hovered) setPreviewVisible(true)
    setHovered({ day, left, anchorY })
  }


  const hoveredDayEvents = hovered ? (eventsByDay.get(hovered.day.date) ?? []) : []

  const columns = calendar.weeks.map((week) => {
    const days: Array<ContributionDay | null> = Array.from({ length: 7 }, () => null)
    for (const day of week.days) days[utcDay(day.date)] = day
    return days
  })

  const keyboardDays = columns.flat().filter((day): day is ContributionDay => Boolean(day))

  const writeRipplePosition = () => {
    const layer = rippleLayer.current
    if (!layer) return
    layer.style.setProperty('--ripple-x', `${ripplePosition.current.x}px`)
    layer.style.setProperty('--ripple-y', `${ripplePosition.current.y}px`)
  }

  // One static ripple follows the pointer. It never restarts for a new cell;
  // the glow simply eases toward the latest pointer position.
  const moveRipple = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const grid = gridRef.current?.getBoundingClientRect()
    if (!grid) return
    rippleTarget.current = { x: event.clientX - grid.left, y: event.clientY - grid.top }
    const step = () => {
      const target = rippleTarget.current
      const position = ripplePosition.current
      position.x += (target.x - position.x) * 0.22
      position.y += (target.y - position.y) * 0.22
      if (Math.hypot(target.x - position.x, target.y - position.y) < 0.15) {
        ripplePosition.current = { ...target }
        writeRipplePosition()
        rippleFrame.current = null
        return
      }
      writeRipplePosition()
      rippleFrame.current = window.requestAnimationFrame(step)
    }
    if (rippleFrame.current === null) {
      if (!rippleEntered.current) {
        ripplePosition.current = { ...rippleTarget.current }
        rippleEntered.current = true
        writeRipplePosition()
        setRippleActive(true)
      }
      rippleFrame.current = window.requestAnimationFrame(step)
    }
  }

  const stopRipple = () => {
    if (rippleFrame.current !== null) {
      window.cancelAnimationFrame(rippleFrame.current)
      rippleFrame.current = null
    }
    rippleEntered.current = false
    setRippleActive(false)
  }

  const handleGridPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    moveRipple(event)
    const target = (event.target as HTMLElement).closest<HTMLElement>('.map-cell[data-date]')
    const date = target?.dataset.date
    if (!date || date === hovered?.day.date) return
    const day = keyboardDays.find((candidate) => candidate.date === date)
    if (day) showDay(day)
  }

  const handleGridPointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    cancelClose()
    moveRipple(event)
    if (hovered) setPreviewVisible(true)
  }

  const handleGridPointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    stopRipple()
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
            {bare ? <div ref={rippleLayer} className={`map-ripple-layer${rippleActive ? ' is-active' : ''}`} aria-hidden="true">
              <span className="map-ripple-glow" />
            </div> : null}
            {columns.map((week, weekIndex) => (
              week.map((day, dayIndex) => day ? (
                <span
                  className="map-cell"
                  data-level={day.level}
                  data-date={bare ? day.date : undefined}
                  key={day.date}
                  title={bare ? undefined : `${formatDate(day.date)}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                  style={{ gridColumn: weekIndex + 1, gridRow: dayIndex + 1 }}
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
            <MapPreview day={hovered.day} events={hoveredDayEvents} visible={previewVisible} left={hovered.left} anchorY={hovered.anchorY} />,
            document.body,
          )
        : null}
    </section>
  )
}
