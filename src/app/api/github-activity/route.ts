import { NextResponse } from 'next/server'
import fixtureJson from '@/data/github-activity-fixture.json'
import type { ActivityData } from '@/lib/activity-types'
import { getActivityData } from '@/lib/github-activity'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getActivityData(fixtureJson as ActivityData)
  const maxAge = data.source === 'live' ? 3600 : 300

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  })
}
