export type ActivitySource = 'live' | 'fixture'

export type ActivityEventType = 'commit' | 'pull-request' | 'review' | 'issue'

export type ContributionLevel = 0 | 1 | 2 | 3 | 4

export type ContributionDay = {
  date: string
  count: number
  level: ContributionLevel
}

export type ContributionWeek = {
  days: ContributionDay[]
}

export type ContributionMonth = {
  name: string
  firstDay: string
  year: number
}

export type RepositoryActivity = {
  name: string
  url: string | null
  isPrivate: boolean
  commits: number
  pullRequests: number
  reviews: number
  issues: number
  total: number
  lastActive: string | null
  months: Record<string, number>
}

export type ActivityEvent = {
  id: string
  type: ActivityEventType
  action: string
  occurredAt: string
  repo: string
  repoUrl: string | null
  title: string
  url: string | null
  count?: number
  isPrivate: boolean
}

export type ActivityTotals = {
  contributions: number
  commits: number
  pullRequests: number
  reviews: number
  issues: number
  restricted: number
}

export type ActivityData = {
  login: string
  generatedAt: string
  from: string
  to: string
  source: ActivitySource
  totals: ActivityTotals
  calendar: {
    totalContributions: number
    months: ContributionMonth[]
    weeks: ContributionWeek[]
  }
  repositories: RepositoryActivity[]
  events: ActivityEvent[]
}
