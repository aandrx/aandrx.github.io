import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers'

const baseURL = process.env.SITE_URL ?? 'http://127.0.0.1:3000'
const executablePath = process.env.FIREFOX_PATH ?? computeExecutablePath({
  browser: Browser.FIREFOX,
  buildId: 'stable_154.0.1',
  cacheDir: path.join(os.homedir(), '.cache/puppeteer'),
  platform: detectBrowserPlatform(),
})

const browser = await puppeteer.launch({ browser: 'firefox', executablePath, headless: true })
const page = await browser.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))

const transitionState = () => page.evaluate(() => {
  const wrapper = document.querySelector('.page-transition')
  return wrapper ? {
    path: location.pathname,
    hash: location.hash,
    classes: wrapper.className,
    animation: getComputedStyle(wrapper).animationName,
    opacity: getComputedStyle(wrapper).opacity,
    scrollY: window.scrollY,
  } : null
})

try {
  await page.setViewport({ width: 1280, height: 900 })
  await page.goto(`${baseURL}/feed/`, { waitUntil: 'networkidle2', timeout: 60000 })
  const initial = await transitionState()
  assert.ok(initial?.classes.includes('is-initial'), 'initial route is marked as a first load')
  assert.equal(initial?.animation, 'none', 'initial route does not fade')
  assert.equal(initial?.opacity, '1', 'initial route is fully visible immediately')

  await page.click('.feed-pill[href="/projects/"]')
  await page.waitForFunction(() => location.pathname === '/projects/' && document.querySelector('.page-transition'), { timeout: 10000 })
  const entering = await transitionState()
  assert.ok(!entering?.classes.includes('is-initial'), 'navigation clears the initial-load marker')
  assert.equal(entering?.animation, 'page-fade-in', 'navigation starts a page fade-in')
  await page.waitForFunction(() => {
    const wrapper = document.querySelector('.page-transition')
    return wrapper && getComputedStyle(wrapper).opacity === '1'
  }, { timeout: 3000 })
  assert.equal(await page.evaluate(() => location.pathname), '/projects/', 'Work link navigates to the projects index')
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'top-level navigation starts at the top')

  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForFunction(() => document.querySelector('.mock-museum')?.getAttribute('aria-busy') === 'false', { timeout: 8000 })
  await page.waitForFunction(() => document.documentElement.scrollHeight > innerHeight + 200, { timeout: 8000 })
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'instant' }))
  await page.waitForFunction(() => Math.abs(window.scrollY - 900) < 2, { timeout: 3000 })
  const savedScroll = await page.evaluate(() => window.scrollY)
  await page.evaluate(() => document.querySelector('#projects h2 a')?.click())
  await page.waitForFunction(() => location.pathname === '/projects/', { timeout: 10000 })
  await page.goBack()
  await page.waitForFunction(() => location.pathname === '/', { timeout: 10000 })
  await page.waitForFunction((target) => Math.abs(window.scrollY - target) < 30, { timeout: 4000 }, savedScroll)

  await page.evaluate(() => { if (document.scrollingElement) document.scrollingElement.scrollTop = 0 })
  await page.waitForFunction(() => window.scrollY < 1, { timeout: 2000 })
  await page.evaluate(() => document.querySelector('.museum-pill[href="#projects"]')?.click())
  await page.waitForFunction(() => document.querySelector('#projects')?.getBoundingClientRect().top >= 0 && document.querySelector('#projects').getBoundingClientRect().top <= 100, { timeout: 4000 })
  assert.equal(await page.evaluate(() => location.hash), '#projects', 'Work anchor updates the hash')
  assert.equal(await page.evaluate(() => window.scrollY > 0), true, 'Work anchor scrolls to the projects section')
  assert.equal(await page.evaluate(() => document.getAnimations().filter((animation) => animation.animationName === 'page-fade-in' && animation.playState === 'running').length), 0, 'hash jump does not retrigger the route fade')

  await page.goBack()
  await page.waitForFunction(() => location.hash === '' && window.scrollY < 40, { timeout: 4000 })
  await page.goForward()
  await page.waitForFunction(() => location.hash === '#projects', { timeout: 4000 })
  await page.waitForFunction(() => (document.querySelector('#projects')?.getBoundingClientRect().top ?? Infinity) <= 100, { timeout: 4000 })

  const reducedCss = await page.evaluate(() => {
    const chunks = []
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules) {
          if (rule.conditionText?.includes('prefers-reduced-motion')) chunks.push(rule.cssText)
          else walk(rule.cssRules)
        }
      }
    }
    for (const sheet of document.styleSheets) {
      try { walk(sheet.cssRules) } catch { /* cross-origin stylesheets are not app styles */ }
    }
    return chunks.join('\n')
  })
  assert.match(reducedCss, /\.page-transition[^{}]*\{[^}]*animation:\s*none/, 'reduced motion disables the page fade')

  assert.deepEqual(errors, [], 'navigation has no runtime errors')
  console.log('PASS: initial load, route fade, top reset, back scroll, hash jump, and reduced-motion navigation')
} finally {
  await browser.close()
}
