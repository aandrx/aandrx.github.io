import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Photography · Andrew Liu',
  description: 'Photographs by Andrew Liu, including Wingspan, Nightfind, and the CSA collections.',
}

export default function PhotoLayout({ children }: { children: React.ReactNode }) {
  return children
}
