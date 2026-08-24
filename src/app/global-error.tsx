'use client'

import NextError from 'next/error'

export default function GlobalError({
  error,
}: Readonly<{
  error: Error & { digest?: string }
}>) {
  return (
    <html lang="en">
      <body>
        {/* This is the default Next.js error component */}
        <NextError statusCode={500} />
      </body>
    </html>
  )
}
