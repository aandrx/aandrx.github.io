import assert from 'node:assert/strict'
import puppeteer from 'puppeteer-core'

const baseURL = process.env.SITE_URL ?? 'http://127.0.0.1:3000'
const endpoint = process.env.BROWSER_WS_ENDPOINT ?? 'ws://127.0.0.1:9222/session'
const browser = await puppeteer.connect({ browserWSEndpoint: endpoint, protocol: 'webDriverBiDi' })
const context = await browser.createBrowserContext()
const page = await context.newPage()
const errors = []

async function expectRedirect(source, destination) {
  const response = await fetch(`${baseURL}${source}`, { redirect: 'manual' })
  assert.equal(response.status, 308, `${source} returns a permanent redirect`)
  const location = response.headers.get('location')
  assert.ok(location, `${source} returns a location`)
  const resolved = new URL(location, baseURL)
  assert.equal(resolved.pathname, destination, `${source} redirects to ${destination}`)
}

async function expectStatus(path, status = 200) {
  const response = await fetch(`${baseURL}${path}`)
  assert.equal(response.status, status, `${path} returns ${status}`)
}

try {
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message))

  await expectRedirect('/mockups/', '/')
  await expectRedirect('/mockups/museum/', '/')
  await expectRedirect('/mockups/museum/feed/', '/feed/')
  await expectRedirect('/mockups/museum/feed/on-small-tools/', '/feed/on-small-tools/')
  await expectRedirect('/about/', '/photo/about/')
  await expectRedirect('/contact/', '/photo/contact/')
  await expectRedirect('/works/', '/photo/works/')
  await expectRedirect('/works/wingspan/', '/photo/works/wingspan/')
  await expectRedirect('/works/nightfind-2026/', '/photo/works/nightfind-2026/')

  for (const path of [
    '/',
    '/projects/',
    '/projects/sink/',
    '/feed/',
    '/feed/on-small-tools/',
    '/photo/',
    '/photo/feed/',
    '/photo/about/',
    '/photo/contact/',
    '/photo/works/',
    '/photo/works/wingspan/',
    '/photo/works/nightfind-2026/',
    '/sitemap.xml',
    '/robots.txt',
  ]) {
    await expectStatus(path)
  }

  const personal = await fetch(`${baseURL}/`).then((response) => response.text())
  const notes = await fetch(`${baseURL}/feed/`).then((response) => response.text())
  assert.doesNotMatch(personal, /noindex/i, 'personal home is indexable')
  assert.doesNotMatch(notes, /noindex/i, 'notes index is indexable')
  const sitemap = await fetch(`${baseURL}/sitemap.xml`).then((response) => response.text())
  assert.match(sitemap, /<loc>https:\/\/www\.andrxwliu\.me\/<\/loc>/, 'sitemap uses the canonical domain')
  assert.match(sitemap, /<loc>.*\/projects\/<\/loc>/, 'sitemap includes the projects index')
  assert.match(sitemap, /<loc>.*\/projects\/sink\/<\/loc>/, 'sitemap includes a project detail page')
  assert.match(sitemap, /<loc>.*\/feed\/<\/loc>/, 'sitemap includes the personal feed')
  assert.match(sitemap, /<loc>.*\/photo\/works\/wingspan\/<\/loc>/, 'sitemap includes photography works')

  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle2' })
  const personalLinks = await page.$$eval('.museum-nav a', (links) => links.map((link) => link.getAttribute('href')))
  assert.deepEqual(personalLinks, ['#projects', '/feed/', '/photo/'], 'personal nav points to the new hierarchy')

  await page.goto(`${baseURL}/photo/`, { waitUntil: 'networkidle2' })
  const photoTitle = await page.$eval('.title.section', (link) => link.getAttribute('href'))
  assert.equal(photoTitle, '/', 'photography home links back to the personal home')

  await page.goto(`${baseURL}/feed/`, { waitUntil: 'networkidle2' })
  const firstNote = await page.$eval('.feed-row-link[href^="/feed/"]', (link) => link.getAttribute('href'))
  await page.click(`a[href="${firstNote}"]`)
  await page.waitForFunction(() => document.querySelector('[data-feed-article]'))
  assert.match(new URL(page.url()).pathname, /^\/feed\/[^/]+\/$/, 'note links open under /feed/')
  assert.ok(await page.$('.feed-related a'), 'note page exposes a related link')

  await page.goto(`${baseURL}/photo/works/`, { waitUntil: 'networkidle2' })
  const cards = await page.$$eval('.project-item', (items) => items.map((item) => item.getAttribute('href')))
  assert.ok(cards.length > 0 && cards.every((href) => href?.startsWith('/photo/works/')), 'works index links stay under /photo/works/')

  const crawlPaths = ['/', '/projects/', '/feed/', '/photo/', '/photo/feed/', '/photo/about/', '/photo/contact/', '/photo/works/', '/photo/works/wingspan/']
  const internal = new Set()
  for (const path of crawlPaths) {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle2' })
    const hrefs = await page.$$eval('a[href]', (links) => links.map((link) => link.getAttribute('href')))
    for (const href of hrefs) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) continue
      const url = new URL(href, `${baseURL}${path}`)
      if (url.origin === new URL(baseURL).origin) internal.add(url.pathname)
    }
  }
  for (const path of internal) await expectStatus(path)
  console.log(`PASS: redirect map and ${internal.size} internal links resolve`)

  assert.deepEqual(errors, [], 'application runtime errors')
  console.log('PASS: production route hierarchy')
} finally {
  await context.close()
  await browser.disconnect()
}
