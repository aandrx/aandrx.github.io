// Deterministic component cases use the actual TSX, React, and stylesheet.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import ts from 'typescript'
import puppeteer from 'puppeteer-core'
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers'

for (const reducedMotion of [false, true]) {
const browser = await puppeteer.launch({ extraPrefsFirefox: { 'ui.prefersReducedMotion': reducedMotion ? 1 : 0 }, browser: 'firefox', headless: true, executablePath: process.env.FIREFOX_PATH ?? computeExecutablePath({ browser: Browser.FIREFOX, buildId: 'stable_154.0.1', cacheDir: path.join(os.homedir(), '.cache/puppeteer'), platform: detectBrowserPlatform() }) })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width: 900, height: 600 })
  await page.setContent('<div id="root"></div>')
  await page.addStyleTag({ content: readFileSync('src/app/projects/projects.css', 'utf8') })
  await page.addScriptTag({ path: 'node_modules/react/umd/react.development.js' })
  await page.addScriptTag({ path: 'node_modules/react-dom/umd/react-dom.development.js' })
  for (const [name, file] of [['icon', 'activity-event-icon'], ['preview', 'map-preview']]) {
    const js = ts.transpileModule(readFileSync(`src/components/activity/${file}.tsx`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText
    await page.addScriptTag({ content: `window.modules ??= {}; { const exports = {}; const require = name => { const known = { react: window.React, './activity-event-icon': window.modules.icon }; if (!(name in known)) throw new Error('Unmapped test import: ' + name); return known[name] }; ${js}\n window.modules[${JSON.stringify(name)}] = exports; }` })
  }
  await page.evaluate(() => {
    const root = window.ReactDOM.createRoot(document.querySelector('#root'))
    window.renderPreview = (count, date, anchorY = 220, type = 'commit') => {
      const events = Array.from({ length: count }, (_, i) => ({ id: `${date}-${i}`, type, action: 'Committed', title: `A long regression test title for event ${i} on ${date}`, repo: 'example/project', occurredAt: `${date}T12:00:00Z`, count: 1 }))
      window.ReactDOM.flushSync(() => root.render(window.React.createElement(window.modules.preview.default, { day: { date, count, level: 1 }, events, visible: true, left: 30, anchorY })))
    }
    window.renderPreview(1, '2026-11-01')
  })
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), reducedMotion, 'Firefox applies the requested motion preference')
  const settle = () => page.waitForFunction(() => document.getAnimations().every(animation => animation.playState === 'finished'), { timeout: 3000 })
  await settle()
  const handle = await page.$('.map-preview')
  const icon = await page.$('.map-preview-icon')
  const initialHeight = await handle.evaluate(node => node.getBoundingClientRect().height)
  await page.evaluate(() => window.renderPreview(2, '2026-11-02'))
  assert.equal(await icon.evaluate(node => node.isConnected), true, 'existing icon frame persists across dates')
  assert.equal(await handle.evaluate(node => node.isConnected && getComputedStyle(node).opacity === '1'), true, 'shell does not re-enter on selection')
  await page.waitForFunction(() => document.querySelectorAll('li.map-preview-slot.is-present').length === 2)
  if (reducedMotion) assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'reduced motion disables content and layout animation')
  else assert.ok(await page.evaluate(() => document.getAnimations().length > 0), 'content change creates native animations')
  await settle()
  const grown = await handle.evaluate(node => node.getBoundingClientRect().height)
  assert.ok(grown > initialHeight + 20, 'container grows for the additional row')
  for (const count of [4, 1, 0, 6, 2]) {
    await page.evaluate(count => window.renderPreview(count, `2026-11-${String(count + 3).padStart(2, '0')}`, 550, 'pull-request'), count)
    await settle()
    assert.equal(await page.$$eval('li.map-preview-slot.is-present', nodes => nodes.length), Math.min(count, 4), 'actual record count controls visible rows')
    const bounds = await handle.evaluate(node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom } })
    assert.ok(bounds.top >= 7 && bounds.bottom <= 593, 'measured popup fits near the bottom edge')
  }
  await page.evaluate(() => window.renderPreview(4, '2026-11-20', 590))
  await settle()
  const excursion = await page.evaluate(async () => {
    window.renderPreview(0, '2026-11-21', 590)
    const samples = []
    const start = performance.now()
    while (performance.now() - start < 600) {
      await new Promise(requestAnimationFrame)
      const rect = document.querySelector('.map-preview').getBoundingClientRect()
      samples.push({ top: rect.top, bottom: rect.bottom })
    }
    return samples.filter(rect => rect.top < 7 || rect.bottom > innerHeight - 7)
  })
  assert.deepEqual(excursion, [], 'popup stays bounded throughout contraction, not only after settling')
  await page.evaluate(() => { for (let i = 1; i < 25; i++) window.renderPreview(i % 5, `2026-11-${String(i).padStart(2, '0')}`) })
  await settle()
  assert.equal(await handle.evaluate(node => node.dataset.date), '2026-11-24', 'fast scrubbing settles on the latest date')
  assert.equal(await page.$$eval('.map-preview', nodes => nodes.length), 1, 'no queued popup snapshots accumulate')
  await page.setViewport({ width: 320, height: 400 })
  await page.evaluate(() => window.renderPreview(4, '2026-11-25', 350))
  await settle()
  assert.ok(await handle.evaluate(node => node.getBoundingClientRect().width <= 304), 'mobile popup respects viewport width')
  assert.deepEqual(errors, [], 'component has no runtime errors')
  console.log(`PASS: inspector rows, persistent icons, resizing, rapid interruption, viewport bounds (reduced motion: ${reducedMotion})`)
} finally { await browser.close() }

}
