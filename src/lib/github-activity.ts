import type {
  ActivityData,
  ActivityEvent,
  ActivityEventType,
  ContributionDay,
  ContributionLevel,
  ContributionMonth,
  ContributionWeek,
  RepositoryActivity,
} from './activity-types'

const GRAPHQL_URL = 'https://api.github.com/graphql'
const EVENTS_URL = 'https://api.github.com/users'
const RANGE_DAYS = 90
const EVENT_LIMIT = 48
const REQUEST_TIMEOUT_MS = 5000
const PRIVATE_LABEL = 'Private work'

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

type GraphQlRepository = {
  nameWithOwner: string
  url: string
  isPrivate: boolean
}

type GraphQlContributionNodes<T> = {
  contributions: {
    totalCount: number
    nodes: T[]
  }
}

type CommitContribution = { occurredAt: string; commitCount: number }
type PullRequestContribution = {
  occurredAt: string
  pullRequest: { title: string; url: string; number: number; state: string; merged: boolean }
}
type IssueContribution = {
  occurredAt: string
  issue: { title: string; url: string; number: number; state: string }
}
type ReviewContribution = {
  occurredAt: string
  pullRequestReview: { url: string; pullRequest: { title: string; url: string; number: number } }
}

type ContributionCollection = {
  totalCommitContributions: number
  totalPullRequestContributions: number
  totalPullRequestReviewContributions: number
  totalIssueContributions: number
  restrictedContributionsCount: number
  contributionCalendar: {
    totalContributions: number
    months: Array<{ name: string; firstDay: string; year: number }>
    weeks: Array<{
      contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }>
    }>
  }
  commitContributionsByRepository: Array<{ repository: GraphQlRepository } & GraphQlContributionNodes<CommitContribution>>
  pullRequestContributionsByRepository: Array<{ repository: GraphQlRepository } & GraphQlContributionNodes<PullRequestContribution>>
  pullRequestReviewContributionsByRepository: Array<{ repository: GraphQlRepository } & GraphQlContributionNodes<ReviewContribution>>
  issueContributionsByRepository: Array<{ repository: GraphQlRepository } & GraphQlContributionNodes<IssueContribution>>
}

type GraphQlResponse = {
  data?: { user?: { contributionsCollection: ContributionCollection } | null }
  errors?: Array<{ message?: string }>
}

type RestEvent = {
  id?: string
  type?: string | null
  created_at?: string
  repo?: { name?: string }
  payload?: Record<string, unknown>
}

type RepositoryBucket = RepositoryActivity & { privateKey: boolean }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function recordValue(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function rangeFromNow(now = new Date()) {
  const to = new Date(now)
  const from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()))
  from.setUTCDate(from.getUTCDate() - (RANGE_DAYS - 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

function normalizeWeeks(
  weeks: ContributionCollection['contributionCalendar']['weeks'],
  maxDate: string,
): ContributionWeek[] {
  return weeks.map((week) => ({
    days: week.contributionDays
      .filter((day) => day.date <= maxDate)
      .map((day): ContributionDay => ({
        date: day.date,
        count: day.contributionCount,
        level: LEVELS[day.contributionLevel] ?? 0,
      })),
  }))
}

function normalizeMonths(months: ContributionCollection['contributionCalendar']['months']): ContributionMonth[] {
  return months.map((month) => ({
    name: month.name,
    firstDay: month.firstDay,
    year: month.year,
  }))
}

function repoDisplay(repo: GraphQlRepository) {
  return repo.isPrivate
    ? { name: PRIVATE_LABEL, url: null as string | null }
    : { name: repo.nameWithOwner, url: repo.url }
}

function addRepoContribution(
  buckets: Map<string, RepositoryBucket>,
  repo: GraphQlRepository,
  key: 'commits' | 'pullRequests' | 'reviews' | 'issues',
  count: number,
  occurredAt: string,
) {
  const display = repoDisplay(repo)
  const mapKey = repo.isPrivate ? '__private__' : repo.nameWithOwner
  if (!buckets.has(mapKey)) {
    buckets.set(mapKey, {
      name: display.name,
      url: display.url,
      isPrivate: repo.isPrivate,
      commits: 0,
      pullRequests: 0,
      reviews: 0,
      issues: 0,
      total: 0,
      lastActive: null,
      months: {},
      privateKey: repo.isPrivate,
    })
  }
  const bucket = buckets.get(mapKey)!
  bucket[key] += count
  bucket.total += count
  if (!bucket.lastActive || Date.parse(occurredAt) > Date.parse(bucket.lastActive)) bucket.lastActive = occurredAt
  const month = occurredAt.slice(0, 7)
  bucket.months[month] = (bucket.months[month] ?? 0) + count
}

function graphQlEvents(collection: ContributionCollection, publicRepos: Set<string>): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (const entry of collection.commitContributionsByRepository) {
    if (entry.repository.isPrivate) continue
    const repo = repoDisplay(entry.repository)
    for (const node of entry.contributions.nodes) {
      const count = node.commitCount
      events.push({
        id: `commit-${entry.repository.nameWithOwner}-${node.occurredAt}`,
        type: 'commit',
        action: 'Made',
        occurredAt: node.occurredAt,
        repo: repo.name,
        repoUrl: repo.url,
        title: `${count} commit${count === 1 ? '' : 's'}`,
        url: repo.url,
        count,
        isPrivate: false,
      })
    }
  }

  for (const entry of collection.pullRequestContributionsByRepository) {
    if (entry.repository.isPrivate) continue
    const repo = repoDisplay(entry.repository)
    for (const node of entry.contributions.nodes) {
      events.push({
        id: `pr-${entry.repository.nameWithOwner}-${node.pullRequest.number}-${node.occurredAt}`,
        type: 'pull-request',
        action: 'Opened pull request',
        occurredAt: node.occurredAt,
        repo: repo.name,
        repoUrl: repo.url,
        title: `#${node.pullRequest.number} ${node.pullRequest.title}`,
        url: node.pullRequest.url,
        isPrivate: false,
      })
    }
  }

  for (const entry of collection.pullRequestReviewContributionsByRepository) {
    if (entry.repository.isPrivate) continue
    const repo = repoDisplay(entry.repository)
    for (const node of entry.contributions.nodes) {
      events.push({
        id: `review-${entry.repository.nameWithOwner}-${node.occurredAt}-${node.pullRequestReview.pullRequest.number}`,
        type: 'review',
        action: 'Reviewed pull request',
        occurredAt: node.occurredAt,
        repo: repo.name,
        repoUrl: repo.url,
        title: `#${node.pullRequestReview.pullRequest.number} ${node.pullRequestReview.pullRequest.title}`,
        url: node.pullRequestReview.url,
        isPrivate: false,
      })
    }
  }

  for (const entry of collection.issueContributionsByRepository) {
    if (entry.repository.isPrivate) continue
    const repo = repoDisplay(entry.repository)
    for (const node of entry.contributions.nodes) {
      events.push({
        id: `issue-${entry.repository.nameWithOwner}-${node.issue.number}-${node.occurredAt}`,
        type: 'issue',
        action: 'Opened issue',
        occurredAt: node.occurredAt,
        repo: repo.name,
        repoUrl: repo.url,
        title: `#${node.issue.number} ${node.issue.title}`,
        url: node.issue.url,
        isPrivate: false,
      })
    }
  }

  return events.filter((event) => publicRepos.has(event.repo))
}

function selectBalancedEvents(events: ActivityEvent[], limit: number): ActivityEvent[] {
  const perRepo = new Map<string, number>()
  const selected: ActivityEvent[] = []
  for (const event of events) {
    const count = perRepo.get(event.repo) ?? 0
    if (count >= 6) continue
    perRepo.set(event.repo, count + 1)
    selected.push(event)
    if (selected.length >= limit) break
  }
  return selected
}

function restEvents(events: RestEvent[], publicRepos: Set<string>): ActivityEvent[] {
  const output: ActivityEvent[] = []

  for (const event of events) {
    const repo = stringValue(event.repo?.name)
    const type = stringValue(event.type)
    const occurredAt = stringValue(event.created_at)
    const id = stringValue(event.id)
    if (!repo || !type || !occurredAt || !id || !publicRepos.has(repo)) continue

    const payload = recordValue(event.payload)
    const action = stringValue(payload.action)
    const repoUrl = `https://github.com/${repo}`
    let mapped: Omit<ActivityEvent, 'id' | 'occurredAt' | 'repo' | 'repoUrl'> | null = null

    if (type === 'PushEvent') {
      const rawSize = numberValue(payload.size)
      const size = rawSize && rawSize > 0 ? rawSize : Array.isArray(payload.commits) ? payload.commits.length : 0
      const branch = stringValue(payload.ref)?.replace(/^refs\/heads\//, '')
      const subject = size > 0
        ? `${size} commit${size === 1 ? '' : 's'}${branch ? ` to ${branch}` : ''}`
        : branch ? `to ${branch}` : 'a branch'
      mapped = {
        type: 'commit',
        action: 'Pushed',
        title: subject,
        url: repoUrl,
        ...(size > 0 ? { count: size } : {}),
        isPrivate: false,
      }
    } else if (type === 'PullRequestEvent') {
      const pull = recordValue(payload.pull_request)
      const number = numberValue(pull.number)
      const title = stringValue(pull.title)
      if (number && title) {
        mapped = {
          type: 'pull-request',
          action: action === 'closed' && pull.merged === true ? 'Merged pull request' : action === 'closed' ? 'Closed pull request' : 'Opened pull request',
          title: `#${number} ${title}`,
          url: stringValue(pull.html_url),
          isPrivate: false,
        }
      }
    } else if (type === 'PullRequestReviewEvent') {
      const pull = recordValue(payload.pull_request)
      const review = recordValue(payload.review)
      const number = numberValue(pull.number)
      const title = stringValue(pull.title)
      if (number && title) {
        mapped = {
          type: 'review',
          action: 'Reviewed pull request',
          title: `#${number} ${title}`,
          url: stringValue(review.html_url) ?? stringValue(pull.html_url),
          isPrivate: false,
        }
      }
    } else if (type === 'IssuesEvent') {
      const issue = recordValue(payload.issue)
      const number = numberValue(issue.number)
      const title = stringValue(issue.title)
      if (number && title) {
        mapped = {
          type: 'issue',
          action: action === 'closed' ? 'Closed issue' : 'Opened issue',
          title: `#${number} ${title}`,
          url: stringValue(issue.html_url),
          isPrivate: false,
        }
      }
    }

    if (mapped) output.push({ id: `rest-${id}`, occurredAt, repo, repoUrl, ...mapped })
  }

  return output
}

export function buildActivity(
  login: string,
  collection: ContributionCollection,
  generatedAt: string,
  from: string,
  to: string,
  source: ActivityData['source'],
  recentEvents: RestEvent[] = [],
): ActivityData {
  const repositories = new Map<string, RepositoryBucket>()
  const publicRepos = new Set<string>()

  for (const entry of [
    ...collection.commitContributionsByRepository,
    ...collection.pullRequestContributionsByRepository,
    ...collection.pullRequestReviewContributionsByRepository,
    ...collection.issueContributionsByRepository,
  ]) {
    if (!entry.repository.isPrivate) publicRepos.add(entry.repository.nameWithOwner)
  }

  for (const entry of collection.commitContributionsByRepository) {
    for (const node of entry.contributions.nodes) {
      addRepoContribution(repositories, entry.repository, 'commits', node.commitCount, node.occurredAt)
    }
  }
  for (const entry of collection.pullRequestContributionsByRepository) {
    for (const node of entry.contributions.nodes) {
      addRepoContribution(repositories, entry.repository, 'pullRequests', 1, node.occurredAt)
    }
  }
  for (const entry of collection.pullRequestReviewContributionsByRepository) {
    for (const node of entry.contributions.nodes) {
      addRepoContribution(repositories, entry.repository, 'reviews', 1, node.occurredAt)
    }
  }
  for (const entry of collection.issueContributionsByRepository) {
    for (const node of entry.contributions.nodes) {
      addRepoContribution(repositories, entry.repository, 'issues', 1, node.occurredAt)
    }
  }

  const graphEvents = graphQlEvents(collection, publicRepos)
  const eventCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const mappedRest = recentEvents.length ? restEvents(recentEvents, publicRepos) : []
  const recentDetail = mappedRest.filter((event) => event.type !== 'commit')
  const events = recentDetail.length
    ? [
        ...recentDetail,
        ...graphEvents.filter((event) => event.type === 'commit' || Date.parse(event.occurredAt) < Date.parse(eventCutoff)),
      ]
    : graphEvents

  events.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))

  return {
    login,
    generatedAt,
    from,
    to,
    source,
    totals: {
      contributions: collection.contributionCalendar.totalContributions,
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      reviews: collection.totalPullRequestReviewContributions,
      issues: collection.totalIssueContributions,
      restricted: collection.restrictedContributionsCount,
    },
    calendar: {
      totalContributions: collection.contributionCalendar.totalContributions,
      months: normalizeMonths(collection.contributionCalendar.months),
      weeks: normalizeWeeks(collection.contributionCalendar.weeks, to.slice(0, 10)),
    },
    repositories: [...repositories.values()]
      .sort((a, b) => b.total - a.total || b.commits - a.commits)
      .map(({ privateKey: _privateKey, ...repository }) => repository),
    events: selectBalancedEvents(events, EVENT_LIMIT),
  }
}

async function githubGraphQl(login: string, from: string, to: string, token: string): Promise<ContributionCollection> {
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            months { name firstDay year }
            weeks { contributionDays { date contributionCount contributionLevel } }
          }
          commitContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url isPrivate }
            contributions(first: 100) { totalCount nodes { occurredAt commitCount } }
          }
          pullRequestContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url isPrivate }
            contributions(first: 100) {
              totalCount
              nodes { occurredAt pullRequest { title url number state merged } }
            }
          }
          pullRequestReviewContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url isPrivate }
            contributions(first: 100) {
              totalCount
              nodes { occurredAt pullRequestReview { url pullRequest { title url number } } }
            }
          }
          issueContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner url isPrivate }
            contributions(first: 100) {
              totalCount
              nodes { occurredAt issue { title url number state } }
            }
          }
        }
      }
    }
  `

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables: { login, from, to } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`GitHub GraphQL returned ${response.status}`)
  const payload = (await response.json()) as GraphQlResponse
  if (payload.errors?.length || !payload.data?.user) {
    throw new Error(payload.errors?.[0]?.message ?? 'GitHub GraphQL returned no user')
  }
  return payload.data.user.contributionsCollection
}

async function githubEvents(login: string, token: string): Promise<RestEvent[]> {
  const response = await fetch(`${EVENTS_URL}/${encodeURIComponent(login)}/events?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) return []
  const payload = (await response.json()) as unknown
  return Array.isArray(payload) ? payload.filter(isRecord) as RestEvent[] : []
}

export function getFixtureActivity(fallback: ActivityData): ActivityData {
  return {
    ...fallback,
    events: selectBalancedEvents(fallback.events, EVENT_LIMIT),
  }
}

export async function getActivityData(
  fallback: ActivityData,
  options?: { throwOnError?: boolean },
): Promise<ActivityData> {
  const login = process.env.GITHUB_LOGIN?.trim() || 'aandrx'
  const token = process.env.GITHUB_TOKEN?.trim()
  const fixture = getFixtureActivity(fallback)

  if (!token) return fixture

  const { from, to } = rangeFromNow()
  try {
    const [collectionResult, eventsResult] = await Promise.allSettled([
      githubGraphQl(login, from, to, token),
      githubEvents(login, token),
    ])
    if (collectionResult.status === 'rejected') throw collectionResult.reason
    const events = eventsResult.status === 'fulfilled' ? eventsResult.value : []
    return buildActivity(login, collectionResult.value, new Date().toISOString(), from, to, 'live', events)
  } catch (error) {
    console.error('GitHub activity fetch failed', error instanceof Error ? error.message : 'unknown error')
    if (options?.throwOnError) throw error
    return fixture
  }
}
