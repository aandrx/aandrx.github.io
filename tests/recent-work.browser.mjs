import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers'

const baseURL = process.env.SITE_URL ?? 'http://127.0.0.1:3000'
const remoteEndpoint = process.env.SITE_URL && process.env.BROWSER_WS_ENDPOINT ? process.env.BROWSER_WS_ENDPOINT : null
const executablePath = remoteEndpoint ? null : process.env.FIREFOX_PATH ?? computeExecutablePath({
  browser: Browser.FIREFOX,
  buildId: 'stable_154.0.1',
  cacheDir: path.join(os.homedir(), '.cache/puppeteer'),
  platform: detectBrowserPlatform(),
})

const browser = remoteEndpoint
  ? await puppeteer.connect({ browserWSEndpoint: remoteEndpoint, protocol: 'webDriverBiDi' })
  : await puppeteer.launch({ browser: 'firefox', executablePath, headless: true })
const context = remoteEndpoint ? await browser.createBrowserContext() : null
const errors = []

try {
  const page = context ? await context.newPage() : await browser.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.setViewport({ width: 1440, height: 1000 })
  const response = await page.goto(`${baseURL}/lab/recent-work/`, { waitUntil: 'networkidle2', timeout: 60000 })
  assert.equal(response.status(), 200, 'recent work lab renders')
  await page.waitForSelector('.activity-map-section')
  await page.waitForFunction(() => document.querySelector('.activity-lab')?.getAttribute('data-source') !== 'loading')

  const state = await page.evaluate(() => {
    const map = document.querySelector('.activity-map-section')
    return {
      h1Count: document.querySelectorAll('h1').length,
      meta: document.querySelector('.lab-meta')?.textContent,
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
      source: document.querySelector('.activity-lab')?.getAttribute('data-source'),
      skin: document.querySelector('.activity-lab')?.getAttribute('data-skin'),
      sections: document.querySelectorAll('.lab-section').length,
      mapCells: document.querySelectorAll('.map-weeks .map-cell:not(.is-empty)').length,
      mapRows: map?.querySelectorAll('table tbody tr').length,
      focusRepos: document.querySelectorAll('.focus-repo').length,
      events: document.querySelectorAll('.activity-event').length,
      days: document.querySelectorAll('.activity-day').length,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      clip: document.querySelector('.activity-map-section .map-total span')?.textContent,
    }
  })

  assert.equal(state.h1Count, 0, 'lab no longer renders the removed page heading')
  assert.match(state.meta ?? '', /aandrx on GitHub/, 'activity metadata is the first content line')
  assert.equal(state.robots, 'noindex, nofollow', 'lab is not indexable')
  assert.equal(state.sections, 3, 'lab shows all three activity views')
  assert.ok(['live', 'fixture'].includes(state.source ?? ''), 'lab reports live or fixture data')
  assert.ok(state.mapCells >= 84, 'contribution map renders a full quarter of days')
  assert.equal(state.mapRows, 7, 'contribution map has one accessible row per weekday')
  assert.ok(state.focusRepos >= 3, 'focus graph renders repository rows')
  assert.ok(state.events >= 3, 'activity timeline renders events')
  assert.ok(state.days >= 2, 'activity timeline groups events by day')
  assert.match(state.clip ?? '', /\d{4}$/, 'map range ends with a year')
  assert.ok(state.scrollWidth <= state.viewportWidth + 1, 'lab does not overflow horizontally')
  assert.equal(state.skin, 'signal', 'lab uses the signal surface')

  const api = await fetch(`${baseURL}/api/github-activity/`).then((result) => result.json())
  assert.ok(['live', 'fixture'].includes(api.source), 'activity API reports its source')
  assert.ok(api.calendar.weeks.length >= 12, 'activity API returns calendar weeks')
  assert.ok(api.repositories.length >= 3, 'activity API returns repository activity')
  assert.ok(api.events.length >= 3, 'activity API returns recent events')
  assert.ok(!api.events.some((event) => /^0 commits/.test(event.title)), 'activity API does not render empty push counts')
  assert.ok(new Set(api.events.map((event) => event.repo)).size >= 3, 'activity API shows more than one repository')
  assert.ok(api.totals.contributions >= api.totals.commits, 'calendar total covers commit contributions')
  assert.ok(api.repositories.every((repo) => !repo.isPrivate || (repo.name === 'Private work' && repo.url === null)), 'activity API masks private repositories')
  assert.ok(api.events.every((event) => !event.isPrivate || (event.repo === 'Private work' && event.repoUrl === null)), 'activity API masks private events')
  assert.doesNotMatch(JSON.stringify(api), /gh[pousr]_[A-Za-z0-9_]+/i, 'activity API never returns a token')

  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForFunction(() => window.scrollY > 500)
  assert.ok(await page.evaluate(() => window.scrollY > 500), 'lab page scrolls vertically')
  await page.evaluate(() => window.scrollTo(0, 0))

  await page.setViewport({ width: 390, height: 844 })
  await new Promise((resolve) => setTimeout(resolve, 250))
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    map: document.querySelector('.map-weeks')?.getBoundingClientRect().width,
    timeline: document.querySelector('.activity-section')?.getBoundingClientRect().width,
  }))
  assert.ok(mobile.width <= mobile.viewport + 1, 'lab does not overflow horizontally at 390px')
  assert.ok(mobile.map > 0 && mobile.timeline > 0, 'all three views remain measurable at 390px')

  assert.deepEqual(errors, [], 'lab has no runtime errors')
  console.log('PASS: recent work lab shows map, focus graph, timeline, surfaces, API shape and mobile layout')
} finally {
  if (context) await context.close()
  if (remoteEndpoint) await browser.disconnect()
  else await browser.close()
}
