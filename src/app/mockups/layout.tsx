import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Personal mockups',
  robots: { index: false, follow: false },
}

export default function MockupsLayout({ children }: { children: React.ReactNode }) {
  return children
}
