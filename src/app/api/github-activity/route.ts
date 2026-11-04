import { NextResponse } from 'next/server'
import { getCachedActivityData } from '@/lib/github-activity-cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getCachedActivityData()

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
    },
  })
}
