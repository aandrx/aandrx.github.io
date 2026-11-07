'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import ActivityEventIcon from './activity-event-icon'
import type { ActivityEvent, ContributionDay } from '@/lib/activity-types'

// A visual slot persists across dates; event identity remains in the text key.
function EventSlot({ event }: { event?: ActivityEvent }) {
  const [retained, setRetained] = useState(event)
  if (event && retained !== event) setRetained(event)
  const item = event ?? retained
  return (
    <li className={`map-preview-slot${event ? ' is-present' : ''}`} aria-hidden={!event}>
      <div className="map-preview-slot-clip">
        {item ? <div className="map-preview-row">
          <span className={`map-preview-icon map-preview-icon--${item.type}`} aria-hidden="true">
            <span className="map-content-enter" key={item.type}><ActivityEventIcon type={item.type} /></span>
          </span>
          <div className="map-preview-body map-content-enter" key={item.id}>
            <p className="map-preview-line"><span className="map-preview-action">{item.action}</span>{' '}{item.title ? <span className="map-preview-title">{item.title}</span> : null}</p>
            <p className="map-preview-meta"><span className="map-preview-repo">{item.repo}</span>{typeof item.count === 'number' ? <span className="map-preview-count">{item.count}</span> : null}</p>
          </div>
        </div> : null}
      </div>
    </li>
  )
}

function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return <div className={`map-preview-slot${open ? ' is-present' : ''}`}><div className="map-preview-slot-clip">{children}</div></div>
}

export default function MapPreview({ day, events, visible, left, anchorY }: {
  day: ContributionDay; events: ActivityEvent[]; visible: boolean; left: number; anchorY: number
}) {
  const shell = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const node = content.current
    if (!node) return
    const measure = () => {
      const style = shell.current ? getComputedStyle(shell.current) : null
      const borders = style ? parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) : 0
      setHeight(Math.ceil(node.getBoundingClientRect().height + borders))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const boundedHeight = Math.min(height, window.innerHeight - 16)
  const top = Math.max(8, Math.min(anchorY + 18 + boundedHeight > window.innerHeight - 8
    ? anchorY - boundedHeight - 12 : anchorY + 18, window.innerHeight - boundedHeight - 8))
  const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${day.date}T00:00:00Z`))
  return <div ref={shell} className={`map-preview${visible ? ' is-visible' : ''}`} data-date={day.date}
    style={{ transform: `translate3d(${left}px, ${top}px, 0)`, height: height ? boundedHeight : undefined }} aria-hidden="true">
    <div className="map-preview-content" ref={content}>
      <p className="map-preview-head"><span className="map-content-enter" key={day.date}>{date}</span><span className="map-content-enter" key={`${day.date}-count`}>{day.count} contribution{day.count === 1 ? '' : 's'}</span></p>
      <ul className="map-preview-list">{Array.from({ length: 4 }, (_, index) => <EventSlot key={index} event={events[index]} />)}</ul>
      <Collapsible open={!events.length}><p className="map-preview-empty map-content-enter" key={day.date}>{day.count > 0 ? 'No public detail' : 'No contributions'}</p></Collapsible>
      <Collapsible open={events.length > 4}><p className="map-preview-more map-content-enter" key={day.date}>+{Math.max(0, events.length - 4)} more</p></Collapsible>
    </div>
  </div>
}
