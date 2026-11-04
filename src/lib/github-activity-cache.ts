import { unstable_cache } from 'next/cache'
import fixtureJson from '@/data/github-activity-fixture.json'
import type { ActivityData } from '@/lib/activity-types'
import { getActivityData, getFixtureActivity } from '@/lib/github-activity'

const fixture = getFixtureActivity(fixtureJson as ActivityData)

// Server-only: `getActivityData` reads GITHUB_TOKEN and must never run in the browser.
// Only the live-capable call is cached; failures reject instead of caching the fixture.
const cachedActivity = unstable_cache(
  () => getActivityData(fixture, { throwOnError: true }),
  ['github-activity'],
  { revalidate: 3600 },
)

export async function getCachedActivityData(): Promise<ActivityData> {
  if (!process.env.GITHUB_TOKEN?.trim()) return fixture
  try {
    return await cachedActivity()
  } catch {
    return fixture
  }
}
