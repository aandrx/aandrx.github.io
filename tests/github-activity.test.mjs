import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'github-activity-test-'))
const source = readFileSync(new URL('../src/lib/github-activity.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const modulePath = path.join(tempDirectory, 'github-activity.mjs')
writeFileSync(modulePath, output)
const { buildActivity } = await import(pathToFileURL(modulePath).href)

after(() => rmSync(tempDirectory, { recursive: true, force: true }))

const publicRepo = {
  nameWithOwner: 'aandrx/public',
  url: 'https://github.com/aandrx/public',
  isPrivate: false,
}

const privateRepo = {
  nameWithOwner: 'aandrx/secret',
  url: 'https://github.com/aandrx/secret',
  isPrivate: true,
}

const collection = {
  totalCommitContributions: 4,
  totalPullRequestContributions: 1,
  totalPullRequestReviewContributions: 0,
  totalIssueContributions: 0,
  restrictedContributionsCount: 2,
  contributionCalendar: {
    totalContributions: 5,
    months: [{ name: 'Nov', firstDay: '2026-11-01', year: 2026 }],
    weeks: [{
      contributionDays: [
        { date: '2026-11-02', contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
        { date: '2026-11-03', contributionCount: 3, contributionLevel: 'THIRD_QUARTILE' },
        { date: '2026-11-04', contributionCount: 1, contributionLevel: 'FIRST_QUARTILE' },
      ],
    }],
  },
  commitContributionsByRepository: [
    {
      repository: publicRepo,
      contributions: { totalCount: 1, nodes: [{ occurredAt: '2026-11-02T08:00:00Z', commitCount: 1 }] },
    },
    {
      repository: privateRepo,
      contributions: { totalCount: 3, nodes: [{ occurredAt: '2026-11-03T08:00:00Z', commitCount: 3 }] },
    },
  ],
  pullRequestContributionsByRepository: [
    {
      repository: privateRepo,
      contributions: {
        totalCount: 1,
        nodes: [{
          occurredAt: '2026-11-04T08:00:00Z',
          pullRequest: { title: 'Secret change', url: 'https://github.com/aandrx/secret/pull/1', number: 1, state: 'OPEN', merged: false },
        }],
      },
    },
  ],
  pullRequestReviewContributionsByRepository: [],
  issueContributionsByRepository: [],
}

test('private contributions are counted but never named or linked', () => {
  const data = buildActivity(
    'aandrx',
    collection,
    '2026-11-04T12:00:00Z',
    '2026-08-07T00:00:00Z',
    '2026-11-04T12:00:00Z',
    'live',
  )

  const privateActivity = data.repositories.find((repo) => repo.isPrivate)
  assert.ok(privateActivity, 'private contributions are represented')
  assert.equal(privateActivity.name, 'Private work')
  assert.equal(privateActivity.url, null)
  assert.equal(privateActivity.commits, 3)
  assert.equal(privateActivity.pullRequests, 1)
  assert.equal(data.events.some((event) => event.repo.includes('secret')), false)
  assert.doesNotMatch(JSON.stringify(data), /aandrx\/secret|Secret change/)
  assert.equal(data.calendar.totalContributions, 5)
  assert.equal(data.totals.restricted, 2)
})

test('public repositories remain named and linked', () => {
  const data = buildActivity(
    'aandrx',
    collection,
    '2026-11-04T12:00:00Z',
    '2026-08-07T00:00:00Z',
    '2026-11-04T12:00:00Z',
    'live',
  )

  const publicActivity = data.repositories.find((repo) => repo.name === 'aandrx/public')
  assert.ok(publicActivity)
  assert.equal(publicActivity.url, 'https://github.com/aandrx/public')
  assert.equal(publicActivity.commits, 1)
  assert.ok(data.events.some((event) => event.repo === 'aandrx/public'))
})
