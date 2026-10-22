import puppeteer from 'puppeteer-core'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'

// Connect to a disposable Firefox; never launch or stop the developer's server.
const baseUrl = process.env.SITE_URL ?? 'http://localhost:3000'
const browser = await puppeteer.connect({ browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT ?? 'ws://127.0.0.1:9222/session', protocol: 'webDriverBiDi' })
const context = await browser.createBrowserContext()
const page = await context.newPage()
const errors = []
const interruptedDecodes = []
const analysisRequests = []
const imageFailures = []
page.on('response', (response) => {
  if (response.url().includes('.r2.dev/') && response.status() >= 400) imageFailures.push({ url: response.url(), status: response.status() })
})
let hold = true
let failPhoto = false
let pending = []
let holdScripts = false
let pendingScripts = []
const liveImages = process.env.LIVE_IMAGES === '1'
const metadata = JSON.parse(await readFile(new URL('../src/data/image-metadata.json', import.meta.url), 'utf8'))
const fixtures = new Map()
async function deliverImage(request) {
  if (liveImages) return request.continue().catch(() => {})
  const key = new URL(request.url()).pathname.slice(1).replace(/-(720|1920)w\.webp$/, '')
  const asset = metadata[key]
  assert.ok(asset, `Unregistered browser image: ${key}`)
  if (!fixtures.has(key)) {
    fixtures.set(key, sharp({ create: { width: 64, height: Math.max(1, Math.round(64 * asset.height / asset.width)), channels: 3, background: asset.color } }).webp().toBuffer())
  }
  return request.respond({ status: 200, contentType: 'image/webp', body: await fixtures.get(key), headers: { 'cache-control': 'no-store' } }).catch(() => {})
}
console.log(`Browser images: ${liveImages ? 'live R2 smoke test' : 'deterministic R2 fixtures'}`)
page.on('pageerror', (error) => {
  // Firefox can report canceled native WebP decoding as a page error when this
  // test aborts an image or navigates away during downloads. Keep it separate
  // from application exceptions; image failure/recovery is asserted below.
  if (error.message === 'Image corrupt or truncated.' && !/\.(?:m?js|tsx?):\d/.test(error.stack ?? '')) {
    interruptedDecodes.push(error.message)
  } else errors.push(error.stack ?? error.message)
})
await page.setViewport({ width: 1280, height: 800 })
await page.setCacheEnabled(false)
await page.setRequestInterception(true)
page.on('request', (request) => {
  if (holdScripts && request.url().includes('/_next/') && /\.js(?:\?|$)/.test(request.url())) {
    pendingScripts.push(request)
    return
  }
  if (request.url().includes('/api/post-colors')) analysisRequests.push(request.url())
  if (failPhoto && request.url().includes('starrynight-2026-10-15/DSCF3413-Edit')) { request.abort().catch(() => {}); return }
  if (request.url().includes('.r2.dev/')) {
    if (hold) { pending.push(request); return }
    deliverImage(request).catch((error) => errors.push(error.stack ?? error.message))
    return
  }
  request.continue().catch(() => {})
})

async function verifyHydration(route, viewport, assertPlaceholder = false) {
  await page.setViewport(viewport)
  // Freeze hydration to exercise the actual first-painted/server-rendered text,
  // not just the already-measured DOM that normally appears in fast tests.
  holdScripts = true
  const navigation = page.goto(`${baseUrl}/works/${route}/`, { waitUntil: 'domcontentloaded' }).then(() => null, (error) => error)
  await page.waitForSelector('.dynamic-columns')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.dynamic-columns')).visibility === 'hidden')
  const before = await page.evaluate(() => {
    const root = document.querySelector('.dynamic-columns')
    return {
      height: root.getBoundingClientRect().height,
      limit: Math.max(1, innerHeight - 240),
      overflow: getComputedStyle(root).overflow,
      text: [...root.querySelectorAll('p')].map((p) => p.textContent.trim()),
      titleVisible: getComputedStyle(document.querySelector('.title.section')).visibility === 'visible',
      photos: document.querySelectorAll('.portfolio-photo').length,
      photoBackground: getComputedStyle(document.querySelector('.portfolio-photo')).backgroundColor,
    }
  })
  assert.ok(before.height <= before.limit + 1, `${route}: pending text escaped its height limit`)
  assert.equal(before.overflow, 'hidden')
  assert.equal(before.titleVisible, true)
  assert.ok(before.photos > 0)
  if (assertPlaceholder) {
    assert.equal(before.photoBackground, 'rgba(0, 0, 0, 0)', `${route}: unloaded photo slots paint a visible grey placeholder`)
  }
  holdScripts = false
  await Promise.all(pendingScripts.map((request) => request.continue().catch(() => {})))
  pendingScripts = []
  assert.equal(await navigation, null)
  await page.waitForFunction((count) => {
    const root = document.querySelector('.dynamic-columns')
    return root?.dataset.columnsReady === 'true' && root.querySelectorAll('p').length === count
  }, {}, before.text.length)
  const after = await page.evaluate(() => {
    const root = document.querySelector('.dynamic-columns')
    const bounds = root.getBoundingClientRect()
    const budget = Math.max(1, innerHeight - 240)
    return {
      text: [...root.querySelectorAll('p')].map((p) => p.textContent.trim()),
      contained: [...root.querySelectorAll('.column')].every((column) => {
        const rect = column.getBoundingClientRect()
        return rect.top >= bounds.top - 1 && rect.bottom <= bounds.bottom + 1 && rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
      }),
      visible: getComputedStyle(root).visibility === 'visible',
      rootBottom: bounds.bottom,
      rootOverflowY: getComputedStyle(root).overflowY,
      budget,
      layout: (() => {
        const element = document.querySelector('.layout')
        const bounds = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return {
          top: bounds.top,
          bottom: bounds.bottom,
          overflowY: style.overflowY,
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
        }
      })(),
      document: {
        bodyOverflowY: getComputedStyle(document.body).overflowY,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
      },
      columns: [...root.querySelectorAll('.column')].map((column) => {
        const style = getComputedStyle(column)
        return {
          clientHeight: column.clientHeight,
          scrollHeight: column.scrollHeight,
          overflowY: style.overflowY,
          paragraphs: [...column.querySelectorAll('p')].map((paragraph) => {
            const bounds = paragraph.getBoundingClientRect()
            return {
              text: paragraph.textContent.trim(),
              top: bounds.top,
              bottom: bounds.bottom,
              height: bounds.height,
              clientWidth: paragraph.clientWidth,
              scrollWidth: paragraph.scrollWidth,
            }
          }),
        }
      }),
    }
  })
  assert.deepEqual(after.text, before.text)
  assert.equal(after.contained, true)
  assert.equal(after.visible, true)
  return { before, after }
}

function assertShortDesktopLayout(route, { before, after }) {
  assert.ok(after.budget < 300, `${route}: viewport was not short enough to exercise column splitting`)
  assert.deepEqual(after.text, before.text)
  assert.ok(after.columns.length > 1, `${route}: short desktop viewport did not split text into multiple columns`)
  assert.deepEqual(after.columns.flatMap((column) => column.paragraphs.map((paragraph) => paragraph.text)), after.text)
  assert.equal(after.rootOverflowY, 'visible')
  const layoutScrollable = ['auto', 'scroll'].includes(after.layout.overflowY)
    && after.layout.scrollHeight > after.layout.clientHeight + 1
  const oversized = []
  let belowLayout = 0
  for (const [index, column] of after.columns.entries()) {
    assert.equal(column.overflowY, 'visible', `${route}: column ${index} hides overflowing text`)
    assert.ok(column.scrollHeight <= column.clientHeight + 2, `${route}: column ${index} clips its text`)
    for (const [paragraphIndex, paragraph] of column.paragraphs.entries()) {
      assert.ok(paragraph.scrollWidth <= paragraph.clientWidth + 2, `${route}: column ${index} paragraph ${paragraphIndex} clips horizontally`)
      const paragraphOversized = paragraph.height > after.budget + 2
      if (paragraphOversized) oversized.push({ column: index, paragraphIndex, height: paragraph.height, bottom: paragraph.bottom })
      const beyondLayoutBottom = paragraph.bottom > after.layout.bottom + 1
      const description = `${route}: column ${index} paragraph ${paragraphIndex} "${paragraph.text.slice(0, 48)}" box y=${paragraph.top.toFixed(1)}..${paragraph.bottom.toFixed(1)} h=${paragraph.height.toFixed(1)} (column limit ${after.budget}px)`
      if (beyondLayoutBottom) {
        belowLayout++
        assert.ok(paragraphOversized, `${description} is not oversized; normal text extends below the reachable area`)
        assert.ok(layoutScrollable, `${description} extends past .layout bottom ${after.layout.bottom.toFixed(1)} and is unreachable; .layout overflow-y=${after.layout.overflowY}, scrollHeight=${after.layout.scrollHeight}, clientHeight=${after.layout.clientHeight}; body overflow-y=${after.document.bodyOverflowY}; html overflow-y=${after.document.htmlOverflowY}`)
      }
    }
  }
  return { oversized, belowLayout, layoutScrollable }
}

async function assertLowestParagraphReachable(route, layoutScrollable) {
  const reach = await page.evaluate(async () => {
    const layout = document.querySelector('.layout')
    const paragraphs = [...document.querySelectorAll('.dynamic-columns p')]
    const lowest = paragraphs.reduce((lowest, paragraph) =>
      paragraph.getBoundingClientRect().bottom > lowest.getBoundingClientRect().bottom ? paragraph : lowest)
    const start = layout.scrollTop
    layout.scrollTop = layout.scrollHeight
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const bounds = layout.getBoundingClientRect()
    const result = {
      text: lowest.textContent.trim().slice(0, 48),
      bottom: lowest.getBoundingClientRect().bottom,
      layoutBottom: bounds.bottom,
      scrollTop: layout.scrollTop,
      scrollHeight: layout.scrollHeight,
      clientHeight: layout.clientHeight,
    }
    layout.scrollTop = start
    return result
  })
  assert.ok(layoutScrollable, `${route}: "${reach.text}" cannot be brought into view because .layout does not scroll vertically`)
  assert.ok(reach.scrollTop > 0, `${route}: .layout did not scroll to the overflowing paragraph`)
  assert.ok(reach.bottom <= reach.layoutBottom + 1, `${route}: "${reach.text}" remains below the layout bottom after scrolling (${reach.bottom.toFixed(1)} > ${reach.layoutBottom.toFixed(1)})`)
}

async function verifyControlledLongParagraph(route) {
  // Inject a single paragraph that cannot fit the short viewport's column
  // budget. This is the deliberate safety case: keep the whole paragraph in
  // one visible column rather than dropping or height-clipping it.
  const text = 'Controlled long paragraph text for layout verification. '.repeat(8).trim()
  const injected = await page.evaluate(async (marker) => {
    const root = document.querySelector('.dynamic-columns')
    const target = root.querySelector('.column:last-child')
    const layout = document.querySelector('.layout')
    const originalText = [...root.querySelectorAll('p')].map((paragraph) => paragraph.textContent.trim())
    const originalRootHeight = root.getBoundingClientRect().height
    const paragraph = document.createElement('p')
    paragraph.dataset.testLongParagraph = 'true'
    paragraph.textContent = marker
    target.appendChild(paragraph)
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    const column = paragraph.closest('.column')
    const paragraphRect = paragraph.getBoundingClientRect()
    const columnRect = column.getBoundingClientRect()
    const rootRect = root.getBoundingClientRect()
    return {
      originalText,
      originalRootHeight,
      text: [...root.querySelectorAll('p')].map((item) => item.textContent.trim()),
      textMatches: paragraph.textContent === marker,
      budget: Math.max(1, innerHeight - 240),
      paragraphHeight: paragraphRect.height,
      paragraphTop: paragraphRect.top,
      paragraphBottom: paragraphRect.bottom,
      paragraphClientWidth: paragraph.clientWidth,
      paragraphScrollWidth: paragraph.scrollWidth,
      columnHeight: columnRect.height,
      columnClientHeight: column.clientHeight,
      columnScrollHeight: column.scrollHeight,
      columnOverflowY: getComputedStyle(column).overflowY,
      rootHeight: rootRect.height,
      rootOverflowY: getComputedStyle(root).overflowY,
      layoutBottom: layout.getBoundingClientRect().bottom,
      layoutOverflowY: getComputedStyle(layout).overflowY,
      layoutScrollHeight: layout.scrollHeight,
      layoutClientHeight: layout.clientHeight,
    }
  }, text)
  assert.equal(injected.textMatches, true)
  assert.deepEqual(injected.text, [...injected.originalText, text])
  assert.ok(injected.paragraphHeight > injected.budget + 2, `${route}: controlled paragraph was not deliberately oversized`)
  assert.ok(injected.rootHeight > injected.originalRootHeight + 2, `${route}: controlled paragraph did not grow the column container`)
  assert.ok(injected.columnHeight >= injected.paragraphHeight - 1, `${route}: column did not grow around the oversized paragraph`)
  assert.equal(injected.columnOverflowY, 'visible')
  assert.equal(injected.rootOverflowY, 'visible')
  assert.ok(injected.columnScrollHeight <= injected.columnClientHeight + 2, `${route}: oversized paragraph is clipped by its column`)
  assert.ok(injected.paragraphScrollWidth <= injected.paragraphClientWidth + 2, `${route}: oversized paragraph clips horizontally`)
  const extendsPastLayout = injected.paragraphBottom > injected.layoutBottom + 1
  const layoutScrollable = ['auto', 'scroll'].includes(injected.layoutOverflowY)
    && injected.layoutScrollHeight > injected.layoutClientHeight + 1
  if (extendsPastLayout) {
    // A single unbreakable paragraph can be taller than the viewport. It must
    // remain reachable by scrolling the layout rather than being clipped.
    assert.ok(layoutScrollable, `${route}: controlled paragraph y=${injected.paragraphTop.toFixed(1)}..${injected.paragraphBottom.toFixed(1)} extends past .layout bottom ${injected.layoutBottom.toFixed(1)} and is unreachable; .layout overflow-y=${injected.layoutOverflowY}, scrollHeight=${injected.layoutScrollHeight}, clientHeight=${injected.layoutClientHeight}`)
    const reached = await page.evaluate(async () => {
      const layout = document.querySelector('.layout')
      const paragraph = document.querySelector('p[data-test-long-paragraph]')
      layout.scrollTop = layout.scrollHeight
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const result = {
        bottom: paragraph.getBoundingClientRect().bottom,
        layoutBottom: layout.getBoundingClientRect().bottom,
        scrollTop: layout.scrollTop,
      }
      layout.scrollTop = 0
      return result
    })
    assert.ok(reached.scrollTop > 0, `${route}: .layout did not scroll to the controlled paragraph`)
    assert.ok(reached.bottom <= reached.layoutBottom + 1, `${route}: controlled paragraph remains below the layout bottom after scrolling (${reached.bottom.toFixed(1)} > ${reached.layoutBottom.toFixed(1)})`)
  }
  const restored = await page.evaluate(async () => {
    const root = document.querySelector('.dynamic-columns')
    root.querySelector('p[data-test-long-paragraph]').remove()
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return {
      text: [...root.querySelectorAll('p')].map((paragraph) => paragraph.textContent.trim()),
      rootHeight: root.getBoundingClientRect().height,
    }
  })
  assert.deepEqual(restored.text, injected.originalText)
  assert.ok(Math.abs(restored.rootHeight - injected.originalRootHeight) <= 1, `${route}: injected paragraph did not restore cleanly`)
  return extendsPastLayout
}

try {
  const routes = ['starry-night-2026', 'starry-night-2025']
  for (const route of routes) await verifyHydration(route, { width: 1280, height: 800 }, true)
  await Promise.all(pending.map(deliverImage))
  pending = []
  console.log('PASS: both Starry Night pages constrain first paint, preserve all text and reveal measured columns without waiting for photos')

  const shortViewport = { width: 1280, height: 300 }
  const shortLayouts = {}
  for (const route of routes) {
    const result = await verifyHydration(route, shortViewport)
    shortLayouts[route] = assertShortDesktopLayout(route, result)
    if (shortLayouts[route].belowLayout > 0) {
      await assertLowestParagraphReachable(route, shortLayouts[route].layoutScrollable)
    }
  }
  for (const route of routes) await verifyControlledLongParagraph(route)
  const shortSummary = routes.map((route) => {
    const { oversized, belowLayout } = shortLayouts[route]
    return `${route}: ${oversized.length} naturally oversized, ${belowLayout} below the layout bottom`
  }).join(', ')
  console.log(`PASS: short desktop viewport keeps every hydrated paragraph, splits normal text without clipping and keeps oversized paragraphs reachable (${shortSummary})`)
  await page.evaluate(() => { document.querySelector('.layout').scrollTop = 0 })
  await page.mouse.move(700, 150)
  await page.mouse.wheel({ deltaY: 120 })
  await delay(250)
  const shortWheel = await page.evaluate(() => ({ layoutTop: document.querySelector('.layout').scrollTop, pageX: window.scrollX }))
  assert.ok(shortWheel.layoutTop > 0, `short viewport vertical wheel was hijacked (layoutTop=${shortWheel.layoutTop}, pageX=${shortWheel.pageX})`)
  assert.equal(shortWheel.pageX, 0)
  console.log('PASS: short-viewport vertical wheel still scrolls the layout vertically')
  await page.setViewport({ width: 1280, height: 800 })

  await page.goto(`${baseUrl}/works/starry-night-2026/`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('.dynamic-columns')?.dataset.columnsReady === 'true')
  const pageScroll = await page.evaluate(() => ({
    scrollWidth: document.scrollingElement.scrollWidth,
    clientWidth: document.scrollingElement.clientWidth,
  }))
  assert.ok(pageScroll.scrollWidth > pageScroll.clientWidth, 'project page has no horizontal overflow')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.mouse.move(700, 400)
  await page.mouse.wheel({ deltaY: 500 })
  await delay(700)
  const scrolledDown = await page.evaluate(() => window.scrollX)
  assert.ok(scrolledDown > 100, `vertical wheel did not scroll the project page horizontally (scrollX=${scrolledDown})`)
  await page.mouse.wheel({ deltaY: -500 })
  await delay(700)
  const scrolledUp = await page.evaluate(() => window.scrollX)
  assert.ok(scrolledUp < scrolledDown - 100, `vertical wheel up did not scroll back (${scrolledUp} >= ${scrolledDown})`)
  await page.mouse.wheel({ deltaX: 300 })
  await delay(300)
  const nativeHorizontal = await page.evaluate(() => window.scrollX)
  assert.ok(nativeHorizontal > 100, `horizontal wheel was not left native (scrollX=${nativeHorizontal})`)
  console.log('PASS: vertical wheel scrolls project pages horizontally and back; horizontal wheel remains native')

  await page.goto(`${baseUrl}/feed/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.instagram-grid-item-full')
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--grid-left') !== '')
  assert.equal(await page.$eval('.instagram-grid-item-full', (item) => getComputedStyle(item).backgroundColor), 'rgb(255, 255, 255)')
  await delay(50)
  const cover = await page.$eval('.instagram-grid-item-full img', (img) => img.src)
  assert.ok(cover.includes('-720w.webp'), cover)
  await page.evaluate(() => {
    window.textChanges = 0
    window.columnObserver = new MutationObserver(() => window.textChanges++)
    window.columnObserver.observe(document.querySelector('.post .content'), { childList: true, subtree: true, attributes: true })
  })
  await page.focus('.instagram-grid-item-full')
  const started = Date.now()
  await page.keyboard.press('Enter')
  await page.waitForSelector('[role="dialog"]')
  const opening = await page.evaluate(() => ({
    slots: document.querySelectorAll('.modal-strip-slide').length,
    requested: document.querySelectorAll('.modal-strip-slide img').length,
    colors: document.querySelectorAll('.modal-details-color').length,
    inert: document.getElementById('feed-background').inert,
  }))
  assert.equal(opening.slots, 21)
  assert.ok(opening.requested >= 3 && opening.requested <= 6, JSON.stringify(opening))
  assert.equal(opening.colors, 5)
  assert.equal(opening.inert, true)
  console.log('PASS: modal opens with every image held:', { ...opening, ms: Date.now() - started })
  hold = false
  await Promise.all(pending.map(deliverImage))
  pending = []
  // Locking the page scrollbar can legitimately resize its viewport once.
  await delay(100)
  await page.evaluate(() => window.textChanges = 0)
  await page.keyboard.press('ArrowRight')
  await page.waitForFunction(() => document.querySelector('[role="slider"]')?.getAttribute('aria-valuenow') === '2')
  await page.keyboard.press('End')
  await page.waitForFunction(() => document.querySelector('[role="slider"]')?.getAttribute('aria-valuenow') === '21')
  const end = await page.evaluate(() => {
    const viewport = document.querySelector('.modal-media').getBoundingClientRect()
    const last = document.querySelector('.modal-strip-slide:last-child').getBoundingClientRect()
    return { viewportRight: viewport.right, lastRight: last.right, images: document.querySelectorAll('.modal-strip-slide img').length }
  })
  assert.ok(end.images < 21)
  await delay(700)
  const finalEdge = await page.evaluate(() => Math.abs(document.querySelector('.modal-media').getBoundingClientRect().right - document.querySelector('.modal-strip-slide:last-child').getBoundingClientRect().right))
  assert.ok(finalEdge <= 9, String(finalEdge))
  await page.keyboard.press('Home')
  await page.waitForFunction(() => document.querySelector('[role="slider"]')?.getAttribute('aria-valuenow') === '1')
  await delay(700)
  const mediaBounds = await (await page.$('.modal-media')).boundingBox()
  const pageScrollBeforeWheel = await page.evaluate(() => window.scrollX)
  await page.mouse.move(mediaBounds.x + mediaBounds.width / 2, mediaBounds.y + mediaBounds.height / 2)
  await page.mouse.wheel({ deltaY: 250 })
  await page.waitForFunction(() => document.querySelector('[role="slider"]').getAttribute('aria-valuenow') === '2')
  await delay(700)
  assert.equal(await page.evaluate(() => window.scrollX), pageScrollBeforeWheel)
  await page.mouse.move(mediaBounds.x + mediaBounds.width * 0.8, mediaBounds.y + mediaBounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(mediaBounds.x + mediaBounds.width * 0.1, mediaBounds.y + mediaBounds.height / 2, { steps: 8 })
  await page.mouse.up()
  assert.ok(await page.$eval('[role="slider"]', (el) => Number(el.getAttribute('aria-valuenow')) > 2))
  await page.keyboard.press('Home')
  const slider = await page.$('.modal-status')
  const bounds = await slider.boundingBox()
  await page.mouse.click(bounds.x + bounds.width * 0.65, bounds.y + bounds.height / 2)
  const scrubbed = await page.$eval('[role="slider"]', (el) => Number(el.getAttribute('aria-valuenow')))
  assert.ok(scrubbed > 2 && scrubbed < 21, String(scrubbed))
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.$eval('[role="slider"]', (el) => Number(el.getAttribute('aria-valuenow'))), scrubbed + 1)
  await page.focus('.modal-close')
  await page.keyboard.down('Shift')
  await page.keyboard.press('Tab')
  await page.keyboard.up('Shift')
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('role')), 'slider')
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Close photo carousel')
  // A successful retry focuses its photo wrapper. With a single-image post
  // there is no slider, so Close is the only remaining tab stop.
  await page.evaluate(() => {
    document.querySelector('.modal-status').style.display = 'none'
    document.querySelector('.portfolio-photo-carousel').focus()
  })
  await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-label')), 'Close photo carousel')
  await page.evaluate(() => document.querySelector('.modal-status').style.removeProperty('display'))
  assert.equal(await page.evaluate(() => window.textChanges), 0)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'))
  assert.equal(await page.evaluate(() => document.activeElement.className), 'instagram-grid-item-full')
  assert.equal(await page.evaluate(() => document.getElementById('feed-background').inert), false)
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow), '')
  assert.equal(analysisRequests.length, 0)
  console.log('PASS: keyboard, wheel, dragging, distant jumps, scrubbing, focus restoration, no text remeasurement or analysis requests')

  failPhoto = true
  await page.goto(`${baseUrl}/works/starry-night-2026/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.photo-retry')
  const gallery = await page.evaluate(() => ({
    title: document.querySelector('.title.section').innerText,
    slots: document.querySelectorAll('.portfolio-photo').length,
    requested: document.querySelectorAll('.portfolio-photo img').length,
    width: document.documentElement.scrollWidth,
    first: document.querySelector('.portfolio-photo').getBoundingClientRect().width,
  }))
  assert.equal(gallery.title, 'Starry Night 2026')
  assert.equal(gallery.slots, 13)
  assert.ok(gallery.requested < 13)
  failPhoto = false
  await page.click('.photo-retry')
  await page.waitForFunction(() => document.querySelector('.portfolio-photo').classList.contains('photo-ready'), { timeout: 30000 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), gallery.width)
  await page.evaluate(() => window.scrollTo(document.documentElement.scrollWidth, 0))
  await page.waitForFunction(() => [...document.querySelectorAll('.portfolio-photo')].at(-1).querySelector('img'))
  assert.ok(await page.evaluate(() => document.querySelectorAll('.portfolio-photo img').length < 13))
  console.log('PASS: project text/layout survive first-photo failure, retry succeeds, distant photos load on approach')

  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${baseUrl}/works/starry-night-2026/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.portfolio-photo')
  const mobile = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }))
  assert.equal(mobile.width, mobile.viewport)
  await page.goto(`${baseUrl}/feed/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.instagram-grid-item-full')
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--grid-left') !== '')
  await page.click('.instagram-grid-item-full')
  await page.waitForSelector('[role="dialog"]')
  const mobileDialog = await page.$eval('[role="dialog"]', (el) => ({ width: el.getBoundingClientRect().width, left: el.getBoundingClientRect().left, bottom: el.getBoundingClientRect().bottom }))
  assert.ok(mobileDialog.width <= 390 && mobileDialog.left >= 0 && mobileDialog.bottom <= 844)
  await page.setViewport({ width: 1280, height: 800 })
  await delay(450)
  assert.equal(await page.$$eval('[role="dialog"]', (elements) => elements.length), 1)
  assert.equal(await page.$eval('[role="slider"]', (el) => el.getAttribute('aria-valuenow')), '1')
  await page.keyboard.press('Escape')
  console.log('PASS: mobile gallery has no horizontal overflow; carousel fits viewport and survives desktop resizing')

  for (const [route, count] of [['nightfind-2024', 19], ['nightfind-2025', 6], ['nightfind-2026', 3], ['starry-night-2025', 14], ['starry-night-2026', 13], ['lantern-fest-2026', 5], ['wingspan', 6]]) {
    await page.goto(`${baseUrl}/works/${route}/`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.portfolio-photo')
    assert.equal(await page.$$eval('.portfolio-photo', (photos) => photos.length), count, route)
  }
  console.log('PASS: all seven project galleries preserve their image selections')
  assert.deepEqual(errors, [])
  console.log('PASS: no application runtime errors')
  if (interruptedDecodes.length) console.log(`INFO: ${interruptedDecodes.length} native decode interruptions during the abort/navigation stress test`)

  const posts = JSON.parse(await readFile(new URL('../src/data/feed-posts.json', import.meta.url), 'utf8'))
  const palettes = JSON.parse(await readFile(new URL('../src/data/post-palettes.json', import.meta.url), 'utf8'))
  const urls = posts[0].filenames.map((filename) => `https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev/${posts[0].folder}/${filename}-1920w.webp`)
  const analysisStart = Date.now()
  const response = await fetch(`${baseUrl}/api/post-colors/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ urls }) })
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.deepEqual(data.colors, palettes[posts[0].id].colors)
  assert.equal(data.perImage.length, 21)
  assert.equal(Object.keys(data.ratios).length, 21)
  console.log(`PASS: metadata-only color API returns all 21 results in ${Date.now() - analysisStart}ms`)
  const unknown = await fetch(`${baseUrl}/api/post-colors/`, { method: 'POST', body: JSON.stringify({ urls: ['https://example.com/private.webp'] }) })
  assert.equal(unknown.status, 400)
  const oversized = await fetch(`${baseUrl}/api/post-colors/`, { method: 'POST', body: JSON.stringify({ urls: [], padding: 'x'.repeat(40000) }) })
  assert.equal(oversized.status, 413)
  const contactRead = await fetch(`${baseUrl}/api/contact/`)
  assert.equal(contactRead.status, 405)
  const newsletterDelete = await fetch(`${baseUrl}/api/newsletter/`, { method: 'DELETE' })
  assert.equal(newsletterDelete.status, 405)
  console.log('PASS: unregistered URLs and oversized requests rejected')
  console.log('PASS: unauthenticated contact read and newsletter delete endpoints remain closed')
} catch (error) {
  console.error('Browser failure diagnostics:', JSON.stringify({ imageFailures, photos: await page.evaluate(() => [...document.querySelectorAll('.portfolio-photo')].slice(0, 3).map((el) => ({ key: el.dataset.imageKey, state: el.className, image: el.querySelector('img')?.currentSrc, complete: el.querySelector('img')?.complete, width: el.querySelector('img')?.naturalWidth }))) }))
  throw error
} finally {
  hold = false
  holdScripts = false
  await Promise.all(pendingScripts.map((request) => request.continue().catch(() => {})))
  await Promise.all(pending.map(deliverImage))
  await context.close()
  await browser.disconnect()
}
