import type { Metadata } from 'next'
import ActivityLab from './activity-lab'
import './lab.css'

export const metadata: Metadata = {
  title: 'Recent work lab · Andrew Liu',
  description: 'A private lab for recent GitHub contribution and activity views.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RecentWorkLabPage() {
  return <ActivityLab />
}
