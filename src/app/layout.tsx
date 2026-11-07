import type { Metadata } from 'next'
import './globals.css'
import PageTransition from '@/components/PageTransition'
import HorizontalWheelScroll from '@/components/HorizontalWheelScroll'
import { SITE_URL } from '@/lib/site'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Andrew Liu',
  description: 'Computational Media student at Georgia Tech. Software, systems, and photographs.',
  icons: {
    icon: '/favicon-light.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PageTransition>
          {children}
        </PageTransition>
        <HorizontalWheelScroll />
        <Analytics />
      </body>
    </html>
  )
}
