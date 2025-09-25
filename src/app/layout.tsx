import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
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
      <body>{children}</body>
    </html>
  )
}
