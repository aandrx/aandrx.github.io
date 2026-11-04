import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

const baseURL = process.env.SITE_URL ?? 'http://127.0.0.1:3000'
const endpoint = process.env.BROWSER_WS_ENDPOINT ?? 'ws://127.0.0.1:9222/session'
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const routes = [
  '/',
  '/feed/',
  '/feed/on-small-tools/',
  '/feed/photographing-empty-rooms/',
  '/photo/',
  '/photo/feed/',
  '/photo/about/',
  '/photo/contact/',
  '/photo/works/',
  '/photo/works/wingspan/',
  '/lab/recent-work/',
]
const viewports = [[1440, 900], [390, 844]]
const browser = await puppeteer.connect({ browserWSEndpoint: endpoint, protocol: 'webDriverBiDi' })
const context = await browser.createBrowserContext()
const errors = []

try {
  for (const [width, height] of viewports) {
    for (const route of routes) {
      const page = await context.newPage()
      page.on('pageerror', (error) => errors.push(`${route}: ${error.stack ?? error.message}`))
      try {
        await page.setCacheEnabled(false)
        const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle2', timeout: 60000 })
        assert.ok([200, 304].includes(response?.status() ?? 0), `${route} returns 200 or 304`)
        await page.setViewport({ width, height })
        await new Promise((resolve) => setTimeout(resolve, 1400))
        if (route === '/lab/recent-work/') {
          await page.waitForFunction(
            () => document.querySelector('.activity-lab')?.getAttribute('data-source') !== 'loading',
            { timeout: 20000 },
          )
        }
        await page.addScriptTag({ path: axePath })
        const violations = await page.evaluate(async () => {
          const result = await axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          })
          return result.violations.map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.map((node) => ({
              target: node.target,
              html: node.html,
              summary: node.failureSummary,
            })),
          }))
        })
        assert.deepEqual(violations, [], `${route} at ${width}px has accessibility violations:\n${JSON.stringify(violations, null, 2)}`)
      } finally {
        await page.close()
      }
    }
    console.log(`PASS: accessibility audit at ${width}px`)
  }

  assert.deepEqual(errors, [], 'application runtime errors')
  console.log('PASS: WCAG A and AA accessibility audit')
} finally {
  await context.close()
  await browser.disconnect()
}
