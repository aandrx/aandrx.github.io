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
  // Headless Firefox in CI cannot create a WebGL context, so Three.js logs
  // environment noise while the home page renders. Only that noise is ignored.
  const environmentNoise = /THREE\.WebGLRenderer|WebGL creation failed|Error creating WebGL context/
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (environmentNoise.test(text)) return
    errors.push(text)
  })

  await page.setViewport({ width: 1440, height: 1000 })
  const homeResponse = await page.goto(`${baseURL}/`, { waitUntil: 'networkidle2', timeout: 60000 })
  assert.equal(homeResponse.status(), 200, 'personal home renders')
  await page.waitForSelector('.museum-stage')
  await page.waitForFunction(() => document.querySelector('.mock-museum')?.getAttribute('aria-busy') === 'false')

  const homeProjects = await page.$eval('#projects h2 a', (link) => ({
    href: link.getAttribute('href'),
    text: link.textContent,
  }))
  assert.equal(homeProjects.href, '/projects/', 'home Projects heading links to the projects index')
  assert.equal(homeProjects.text, 'Projects', 'home Projects heading keeps its label')

  const response = await page.goto(`${baseURL}/projects/`, { waitUntil: 'networkidle2', timeout: 60000 })
  assert.equal(response.status(), 200, 'projects index renders')
  await page.waitForSelector('main.feed-page.feed-index')

  const state = await page.evaluate(() => {
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    const details = document.querySelector('details.projects-activity')
    const map = document.querySelector('.activity-map-section')
    const projectLinks = [...document.querySelectorAll('a.projects-row-link')]
    const nav = document.querySelector('.feed-pill[aria-current="page"]')
    return {
      title: document.title,
      h1: [...document.querySelectorAll('h1')].map((heading) => heading.textContent),
      canonicalPath: canonical ? new URL(canonical, location.origin).pathname : null,
      groups: [...document.querySelectorAll('.feed-year')].map((heading) => heading.textContent),
      projectLinkCount: projectLinks.length,
      externalLinks: projectLinks.map((link) => link.getAttribute('href')),
      blankTargets: projectLinks.map((link) => link.getAttribute('target')),
      mapCount: document.querySelectorAll('.activity-map-section').length,
      mapRows: map?.querySelectorAll('table tbody tr').length,
      mapCells: map?.querySelectorAll('.map-weeks .map-cell:not(.is-empty)').length,
      detailsClosed: details ? !details.hasAttribute('open') : null,
      detailsSummary: details?.querySelector('summary')?.textContent,
      navHref: nav?.getAttribute('href'),
      navText: nav?.textContent,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }
  })

  assert.equal(state.title, 'Projects · Andrew Liu', 'projects index has its own title')
  assert.deepEqual(state.h1, ['Projects'], 'projects index renders exactly one h1')
  assert.equal(state.canonicalPath, '/projects/', 'projects index declares its canonical path')
  assert.deepEqual(state.groups, ['Selected work', 'More work'], 'projects index renders both project groups')
  assert.equal(state.projectLinkCount, 11, 'projects index lists eleven repositories')
  assert.ok(state.externalLinks.every((href) => href?.startsWith('https://github.com/')), 'project links point at external repositories')
  assert.ok(state.blankTargets.every((target) => target === '_blank'), 'project links open in a new tab')
  assert.equal(state.mapCount, 1, 'projects index renders one activity map')
  assert.equal(state.mapRows, 7, 'activity map has one accessible row per weekday')
  assert.ok(state.mapCells >= 84, 'activity map renders a full quarter of day cells')
  assert.equal(state.detailsClosed, true, 'activity details is closed by default')
  assert.match(state.detailsSummary ?? '', /More recent activity/, 'activity details has a summary')
  assert.equal(state.navHref, '/projects/', 'Work nav pill links to the projects index')
  assert.equal(state.navText, 'Work', 'Work nav pill keeps its label')
  assert.ok(state.scrollWidth <= state.viewportWidth + 1, 'projects index does not overflow horizontally at 1440px')

  const hiddenTable = await page.$eval('.activity-map-section table', (table) => {
    const style = getComputedStyle(table)
    return {
      position: style.position,
      overflow: style.overflow,
      clip: style.clip,
      caption: table.querySelector('caption')?.textContent,
    }
  })
  assert.equal(hiddenTable.position, 'absolute', 'activity map table is taken out of flow')
  assert.equal(hiddenTable.overflow, 'hidden', 'activity map table hides its overflow')
  assert.notEqual(hiddenTable.clip, 'auto', 'activity map table is visually clipped')
  assert.match(hiddenTable.caption ?? '', /GitHub contribution calendar/, 'activity map table keeps its accessible caption')

  await page.click('details.projects-activity > summary')
  await page.waitForFunction(() => document.querySelector('details.projects-activity')?.hasAttribute('open'))
  await page.waitForFunction(() => {
    const focus = document.querySelector('details.projects-activity .focus-section')
    const timeline = document.querySelector('details.projects-activity .activity-section')
    return (focus?.getBoundingClientRect().height ?? 0) > 0 && (timeline?.getBoundingClientRect().height ?? 0) > 0
  }, { timeout: 20000 })

  const activity = await page.evaluate(() => ({
    open: document.querySelector('details.projects-activity')?.hasAttribute('open'),
    focusRepos: document.querySelectorAll('details.projects-activity .focus-repo').length,
    events: document.querySelectorAll('details.projects-activity .activity-event').length,
    days: document.querySelectorAll('details.projects-activity .activity-day').length,
  }))
  assert.equal(activity.open, true, 'summary opens the activity details')
  assert.ok(activity.focusRepos >= 3, 'activity details renders focus rows')
  assert.ok(activity.events >= 3, 'activity details renders timeline events')
  assert.ok(activity.days >= 2, 'activity details groups events by day')

  await page.click('details.projects-activity > summary')
  await page.waitForFunction(() => !document.querySelector('details.projects-activity')?.hasAttribute('open'))

  await page.setViewport({ width: 390, height: 844 })
  await new Promise((resolve) => setTimeout(resolve, 250))
  const mobile = await page.evaluate(() => {
    const summary = document.querySelector('details.projects-activity > summary')
    const rect = summary?.getBoundingClientRect()
    return {
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      summaryWidth: rect?.width ?? 0,
      summaryHeight: rect?.height ?? 0,
      open: document.querySelector('details.projects-activity')?.hasAttribute('open'),
    }
  })
  assert.ok(mobile.scrollWidth <= mobile.viewportWidth + 1, 'projects index does not overflow horizontally at 390px')
  assert.ok(mobile.summaryWidth > 0 && mobile.summaryHeight > 0, 'activity summary stays visible at 390px')
  assert.equal(mobile.open, false, 'activity details stays closed at 390px')

  await page.click('details.projects-activity > summary')
  await page.waitForFunction(() => document.querySelector('details.projects-activity')?.hasAttribute('open'))
  await page.waitForFunction(() => (document.querySelector('details.projects-activity .activity-section')?.getBoundingClientRect().height ?? 0) > 0, { timeout: 20000 })
  const mobileOpen = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    timelineHeight: document.querySelector('details.projects-activity .activity-section')?.getBoundingClientRect().height ?? 0,
  }))
  assert.ok(mobileOpen.timelineHeight > 0, 'activity content opens at 390px')
  assert.ok(mobileOpen.scrollWidth <= mobileOpen.viewportWidth + 1, 'open activity details does not overflow at 390px')

  assert.deepEqual(errors, [], 'projects index has no runtime errors')
  console.log('PASS: projects index shows groups, repository links, activity map and collapsible activity')
} finally {
  if (context) await context.close()
  await browser.disconnect().catch(() => {})
  if (!remoteEndpoint) await browser.close().catch(() => {})
}
