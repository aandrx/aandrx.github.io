import type { ActivityEventType } from '@/lib/activity-types'

type Props = {
  type: ActivityEventType
}

export default function ActivityEventIcon({ type }: Props) {
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
