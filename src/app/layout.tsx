import type { Metadata } from 'next'
import './globals.css'
import PageTransition from '@/components/PageTransition'
import HorizontalWheelScroll from '@/components/HorizontalWheelScroll'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.andrxwliu.me'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Andrew Liu',
  description: 'my portfolio',
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
      </body>
    </html>
  )
}
