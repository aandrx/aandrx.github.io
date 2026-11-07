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
      projectHrefs: projectLinks.map((link) => link.getAttribute('href')),
      rowCopies: Object.fromEntries(projectLinks.map((link) => [
        link.getAttribute('href')?.split('/').filter(Boolean).at(-1),
        link.querySelector('.projects-row-summary')?.textContent,
      ])),
      blankTargets: projectLinks.map((link) => link.getAttribute('target')),
      rowHeights: projectLinks.map((link) => link.getBoundingClientRect().height),
      summaryWhiteSpace: [...document.querySelectorAll('.projects-row-summary')].map((node) => getComputedStyle(node).whiteSpace),
      mapCount: document.querySelectorAll('.activity-map-section').length,
      mapHeadingCount: map?.querySelectorAll(':scope > .lab-section-head').length,
      mapPanelPresent: Boolean(map?.querySelector('.map-frame')),
      mapBare: Boolean(map?.querySelector('.map-frame.is-bare')),
      mapTotalCount: map?.querySelectorAll('.map-total').length,
      mapMonthsCount: map?.querySelectorAll('.map-months').length,
      mapWeekdaysCount: map?.querySelectorAll('.map-weekdays').length,
      mapFootCount: map?.querySelectorAll('.map-foot').length,
      mapNoteCount: map?.querySelectorAll('.map-note').length,
      mapTablePresent: Boolean(map?.querySelector('table.sr-only')),
      mapRows: map?.querySelectorAll('table tbody tr').length,
      mapCells: map?.querySelectorAll('.map-weeks .map-cell:not(.is-empty)').length,
      mapCellsWithDate: map?.querySelectorAll('.map-weeks .map-cell:not(.is-empty)[data-date]').length,
      mapTooltipAttributes: map?.querySelectorAll('[data-tooltip]').length,
      mapCellsWithTitle: map?.querySelectorAll('.map-weeks .map-cell[title]').length,
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
  assert.equal(state.projectLinkCount, 12, 'projects index lists twelve projects')
  assert.equal(state.rowCopies.continuum, 'A personal kanban prototype', 'Continuum is described as a kanban prototype')
  assert.equal(state.rowCopies.ina, 'An unfinished Discord bot', 'Ina is described as an unfinished Discord bot')
  assert.equal(state.rowCopies.spendwise, 'Team Android budgeting coursework', 'Spendwise is described as team Android coursework')
  assert.equal(state.rowCopies.sophitia, 'An After Effects layer helper', 'Sophitia is described as an After Effects helper')
  assert.equal(state.rowCopies.sink, 'Obsidian sync with conflict review', 'sink is described by its sync and conflict-review scope')
  assert.equal(state.rowCopies.shend, 'A self-hosted Discord video compressor', 'Shend is described as a self-hosted compressor')
  assert.doesNotMatch(JSON.stringify(state.rowCopies), /Kubernetes|experimental web project|small automation bot|personal finance prototype/, 'corrected project summaries do not retain stale claims')
  assert.ok(state.projectHrefs.every((href) => href?.startsWith('/projects/')), 'project rows link to internal detail pages')
  assert.ok(state.blankTargets.every((target) => target === null), 'project rows do not open in a new tab')
  assert.ok(state.rowHeights.every((height) => height > 0 && height <= 32), 'each project row is a single line')
  assert.ok(state.summaryWhiteSpace.every((value) => value === 'nowrap'), 'project summaries stay on one truncated line')
  assert.equal(state.mapCount, 1, 'projects index renders one activity map')
  assert.equal(state.mapHeadingCount, 0, 'projects activity map starts at the panel without an outer section heading')
  assert.equal(state.mapPanelPresent, true, 'projects activity map renders its panel')
  assert.equal(state.mapBare, true, 'projects activity map renders as a bare block without the card frame')
  assert.equal(state.mapTotalCount, 0, 'projects activity map omits the visible total and date range')
  assert.equal(state.mapMonthsCount, 0, 'projects activity map omits the month labels')
  assert.equal(state.mapWeekdaysCount, 0, 'projects activity map omits the weekday labels')
  assert.equal(state.mapFootCount, 0, 'projects activity map omits the legend and foot note')
  assert.equal(state.mapNoteCount, 0, 'projects activity map omits the UTC calendar note')
  assert.equal(state.mapTablePresent, true, 'projects activity map keeps its hidden accessible table')
  assert.equal(state.mapRows, 7, 'activity map has one accessible row per weekday')
  assert.ok(state.mapCells >= 84, 'activity map renders a full quarter of day cells')
  assert.equal(state.mapCellsWithDate, state.mapCells, 'every non-empty day cell exposes its date for the hover preview')
  assert.equal(state.mapTooltipAttributes, 0, 'bare day cells drop the old data-tooltip attribute')
  assert.equal(state.mapCellsWithTitle, 0, 'bare day cells avoid native title tooltips')
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

  const eventDate = await page.evaluate(() => {
    const time = document.querySelector('details.projects-activity .activity-event time[datetime]')
    return time?.getAttribute('datetime')?.slice(0, 10) ?? null
  })
  assert.ok(eventDate, 'activity timeline exposes a dated event to preview')

  const cellSelector = `.activity-map-section .map-weeks .map-cell[data-date="${eventDate}"]`
  const cellBox = await page.$eval(cellSelector, (cell) => {
    const rect = cell.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  })
  await page.mouse.move(cellBox.x, cellBox.y)
  await page.waitForSelector('.map-preview', { timeout: 5000 })

  const preview = await page.evaluate(() => {
    const card = document.querySelector('.map-preview')
    if (!card) return null
    const rect = card.getBoundingClientRect()
    const head = [...card.querySelectorAll('.map-preview-head span')].map((span) => span.textContent ?? '')
    return {
      date: head[0] ?? '',
      count: head[1] ?? '',
      icons: card.querySelectorAll('.map-preview-row .map-preview-icon').length,
      iconSvgs: card.querySelectorAll('.map-preview-row .map-preview-icon svg').length,
      iconClasses: [...card.querySelectorAll('.map-preview-icon')].map((node) => node.className),
      actions: [...card.querySelectorAll('.map-preview-action')].map((node) => node.textContent ?? ''),
      repos: [...card.querySelectorAll('.map-preview-repo')].map((node) => node.textContent ?? ''),
      titles: [...card.querySelectorAll('.map-preview-title')].map((node) => node.textContent ?? ''),
      rows: card.querySelectorAll('.map-preview-row').length,
      pointerEvents: getComputedStyle(card).pointerEvents,
      width: rect.width,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }
  })
  assert.ok(preview, 'hovering a day with events opens the preview card')
  assert.match(preview.date, /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/, 'preview shows the day date')
  assert.match(preview.count, /^\d+ contributions?$/, 'preview shows the day contribution count')
  assert.ok(preview.rows >= 1 && preview.rows <= 4, 'preview lists between one and four events')
  assert.equal(preview.icons, preview.rows, 'preview renders one activity icon per event row')
  assert.equal(preview.iconSvgs, preview.rows, 'preview renders an SVG glyph inside every icon frame')
  assert.ok(
    preview.iconClasses.some((className) => /map-preview-icon--(pull-request|review|issue|commit)/.test(className)),
    'preview uses a type-specific icon class',
  )
  assert.ok(preview.actions.every((action) => action.length > 0), 'preview shows an action for every event')
  assert.ok(preview.repos.every((repo) => repo.length > 0), 'preview names every event repository')
  assert.ok(preview.titles.some((title) => title.length > 0), 'preview shows at least one event title')

  const ripple = await page.evaluate(() => {
    const layer = document.querySelector('.map-ripple-layer')
    const cell = document.querySelector('.map-cell[data-date]')
    return {
      layer: Boolean(layer), layerZ: getComputedStyle(layer).zIndex,
      cellZ: getComputedStyle(cell).zIndex, filter: getComputedStyle(cell).filter,
      overlay: getComputedStyle(cell, '::after').content,
      pointerEvents: getComputedStyle(layer).pointerEvents,
      waves: layer.children.length,
    }
  })
  assert.equal(ripple.layer, true, 'ripple has its own behind-grid layer')
  assert.ok(Number(ripple.cellZ) > Number(ripple.layerZ), 'opaque cells occlude the ripple')
  assert.equal(ripple.filter, 'none', 'cell faces are not brightened')
  assert.equal(ripple.overlay, 'none', 'cell faces have no color overlay')
  assert.equal(ripple.pointerEvents, 'none', 'ripple cannot intercept hover')
  assert.ok(ripple.waves <= 2, 'ripple count stays bounded')
  assert.equal(preview.pointerEvents, 'none', 'preview cannot capture the pointer and flicker')
  assert.ok(preview.width <= 340, 'preview card stays at most 340px wide')
  assert.ok(preview.left >= 0 && preview.right <= preview.viewportWidth + 1, 'preview stays inside the viewport horizontally')
  assert.ok(preview.top >= 0 && preview.bottom <= preview.viewportHeight + 1, 'preview stays inside the viewport vertically')

  await page.mouse.move(2, 2)
  await new Promise((resolve) => setTimeout(resolve, 60))
  assert.ok(await page.$('.map-preview'), 'preview remains briefly while leaving the grid')
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })
  assert.equal(await page.$('.map-preview'), null, 'preview closes after the pointer leaves the grid')

  // Crossing the gaps between squares must keep the card mounted so traversal
  // stays continuous instead of restarting the entrance animation.
  const adjacentPair = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.map-weeks .map-cell[data-date]')]
      .map((cell) => {
        const rect = cell.getBoundingClientRect()
        return {
          date: cell.dataset.date,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right },
        }
      })
      .filter((cell) => cell.rect.width > 0)
    for (const cell of cells) {
      const next = cells.find((other) => Math.abs(other.rect.y - cell.rect.y) < 1 && other.rect.x > cell.rect.x && other.rect.x - cell.rect.x < 30)
      if (next) return { a: cell, b: next }
    }
    return null
  })
  assert.ok(adjacentPair, 'map exposes horizontally adjacent day cells')
  await page.mouse.move(adjacentPair.a.rect.x + adjacentPair.a.rect.width / 2, adjacentPair.a.rect.y + adjacentPair.a.rect.height / 2)
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  const previewHandle = await page.$('.map-preview')
  assert.ok(previewHandle, 'preview node exists before crossing the gap')
  const firstPreviewDate = await page.$eval('.map-preview .map-preview-head span', (node) => node.textContent)
  await page.mouse.move((adjacentPair.a.rect.right + adjacentPair.b.rect.x) / 2, adjacentPair.a.rect.y + adjacentPair.a.rect.height / 2)
  await new Promise((resolve) => setTimeout(resolve, 400))
  assert.equal(await previewHandle.evaluate((node) => node.isConnected && getComputedStyle(node).opacity === '1'), true, 'preview stays fully visible during a long gutter dwell')
  await page.mouse.move(adjacentPair.b.rect.x + adjacentPair.b.rect.width / 2, adjacentPair.b.rect.y + adjacentPair.b.rect.height / 2)
  await page.waitForFunction((previous) => {
    const card = document.querySelector('.map-preview .map-preview-head span')
    return Boolean(card && card.textContent !== previous)
  }, { timeout: 5000 }, firstPreviewDate)
  assert.equal(await previewHandle.evaluate((node) => node.isConnected), true, 'same preview node remains mounted after crossing the gap')
  const secondPreviewDate = await previewHandle.evaluate((node) => node.querySelector('.map-preview-head span')?.textContent)
  assert.notEqual(secondPreviewDate, firstPreviewDate, 'the preview updates to the next day after crossing the gap')
  await page.mouse.move(2, 2)
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })

  // One keyboard entry point inspects days without 90 tab stops.
  await page.focus('.map-frame.is-bare')
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  const focusedDate = await page.$eval('.map-preview .map-preview-head span', (node) => node.textContent)
  assert.match(focusedDate ?? '', /\d{4}/, 'focusing the map opens the preview for a day')
  await page.keyboard.press('ArrowLeft')
  await page.waitForFunction((previous) => {
    const card = document.querySelector('.map-preview .map-preview-head span')
    return card && card.textContent !== previous
  }, {}, focusedDate)
  const movedDate = await page.$eval('.map-preview .map-preview-head span', (node) => node.textContent)
  assert.notEqual(movedDate, focusedDate, 'arrow keys move the inspected day')
  const dayDelta = (new Date(movedDate) - new Date(focusedDate)) / 86_400_000
  assert.equal(Math.round(dayDelta), -7, 'left arrow moves one calendar week, not one vertical cell')
  const liveStatus = await page.$eval('.map-status', (node) => node.textContent)
  assert.match(liveStatus ?? '', /\d{4}.*\d+ contributions?/, 'keyboard selection is announced in a live region')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })
  assert.equal(await page.$('.map-preview'), null, 'escape closes the keyboard preview')
  await page.keyboard.press('ArrowLeft')
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  assert.match(await page.$eval('.map-status', (node) => node.textContent), /\d{4}.*\d+ contributions?/, 'reopening with an arrow announces the selected day')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })

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

  await page.$eval(cellSelector, (cell) => cell.scrollIntoView({ block: 'center' }))
  await new Promise((resolve) => setTimeout(resolve, 100))
  const mobileCellBox = await page.$eval(cellSelector, (cell) => {
    const rect = cell.getBoundingClientRect()
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
  })
  await page.mouse.move(mobileCellBox.x, mobileCellBox.y)
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  const mobilePreview = await page.evaluate(() => {
    const rect = document.querySelector('.map-preview')?.getBoundingClientRect()
    return rect ? { width: rect.width, left: rect.left, right: rect.right, viewportWidth: window.innerWidth } : null
  })
  assert.ok(mobilePreview, 'preview opens at 390px')
  assert.ok(mobilePreview.width <= 340, 'preview card stays at most 340px wide at 390px')
  assert.ok(mobilePreview.left >= 0 && mobilePreview.right <= mobilePreview.viewportWidth + 1, 'preview stays inside the 390px viewport')
  await page.mouse.move(2, 2)
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })

  // Touch opens a day, switches days, and closes the selected day.
  const touchDates = await page.$$eval('.map-weeks .map-cell[data-date]', (cells) => cells.slice(0, 2).map((cell) => cell.dataset.date))
  assert.equal(touchDates.length, 2, 'map has two touchable day cells')
  const touchCell = (date) => page.$eval(`.map-weeks .map-cell[data-date="${date}"]`, (cell) => {
    cell.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }))
  })
  await touchCell(touchDates[0])
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  const firstTouchDate = await page.$eval('.map-preview .map-preview-head span', (node) => node.textContent)
  await page.$eval('.map-weeks', (grid) => grid.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerType: 'touch' })))
  await new Promise((resolve) => setTimeout(resolve, 300))
  assert.ok(await page.$('.map-preview'), 'touch preview survives pointerleave after a tap')
  await touchCell(touchDates[1])
  await page.waitForFunction((previous) => {
    const card = document.querySelector('.map-preview .map-preview-head span')
    return Boolean(card && card.textContent !== previous)
  }, { timeout: 5000 }, firstTouchDate)
  const secondTouchDate = await page.$eval('.map-preview .map-preview-head span', (node) => node.textContent)
  assert.notEqual(secondTouchDate, firstTouchDate, 'touch switches the selected day')
  await touchCell(touchDates[1])
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })
  assert.equal(await page.$('.map-preview'), null, 'tapping the selected day closes the preview')

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

  // The preview side must stay sticky while the pointer stays in the grid, so
  // it cannot flip back and forth around the right-edge clamp threshold.
  await page.setViewport({ width: 900, height: 900 })
  await new Promise((resolve) => setTimeout(resolve, 250))
  await page.$eval('.activity-map-section .map-weeks', (grid) => grid.scrollIntoView({ block: 'center' }))
  await new Promise((resolve) => setTimeout(resolve, 150))
  const placement = await page.evaluate(() => {
    const threshold = window.innerWidth - 8 - 340 - 14
    const cells = [...document.querySelectorAll('.activity-map-section .map-weeks .map-cell[data-date]')].map((cell) => {
      const rect = cell.getBoundingClientRect()
      return { date: cell.getAttribute('data-date'), x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })
    const rightSide = cells.filter((cell) => cell.x > threshold)
    const leftSide = cells.filter((cell) => cell.x <= threshold)
    if (rightSide.length === 0 || leftSide.length === 0) return null
    const anchor = rightSide[rightSide.length - 1]
    const sameRow = leftSide.filter((cell) => Math.abs(cell.y - anchor.y) < 3)
    const candidates = sameRow.length > 0 ? sameRow : leftSide
    const nearby = candidates.reduce((best, cell) => (cell.x > best.x ? cell : best), candidates[0])
    return { anchor, nearby, threshold }
  })
  assert.ok(placement, 'narrow desktop map exposes day cells on both sides of the preview clamp threshold')
  await page.mouse.move(placement.anchor.x, placement.anchor.y)
  await page.waitForSelector('.map-preview', { timeout: 5000 })
  const anchorSide = await page.evaluate(() => {
    const rect = document.querySelector('.map-preview')?.getBoundingClientRect()
    return rect ? { left: rect.left, right: rect.right } : null
  })
  assert.ok(anchorSide && anchorSide.right <= placement.anchor.x, 'preview opens on the left of the cursor near the right edge')
  await page.mouse.move(placement.nearby.x, placement.nearby.y)
  await page.waitForFunction((date) => {
    const card = document.querySelector('.map-preview')
    const head = card?.querySelector('.map-preview-head span')
    if (!head) return false
    const expected = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${date}T00:00:00Z`))
    return head.textContent === expected
  }, { timeout: 5000 }, placement.nearby.date)
  await page.waitForFunction((x) => document.querySelector('.map-preview')?.getBoundingClientRect().right <= x, { timeout: 1000 }, placement.nearby.x)
  const nearbySide = await page.evaluate(() => {
    const rect = document.querySelector('.map-preview')?.getBoundingClientRect()
    return rect ? { left: rect.left, right: rect.right } : null
  })
  assert.ok(nearbySide && nearbySide.right <= placement.nearby.x, 'preview keeps its left placement when moving to a nearby non-empty cell')
  await page.mouse.move(2, 2)
  await page.waitForFunction(() => !document.querySelector('.map-preview'), { timeout: 5000 })

  const detailSlugs = ['bloom', 'sink', 'shend', 'webby', 'hope-for-haiti', 'loom', 'harmonyapi', 'palace-tui', 'continuum', 'ina', 'spendwise', 'sophitia']
  for (const slug of detailSlugs) {
    const detailResponse = await fetch(`${baseURL}/projects/${slug}/`)
    assert.equal(detailResponse.status, 200, `/projects/${slug}/ renders`)
  }

  await page.goto(`${baseURL}/projects/sink/`, { waitUntil: 'networkidle2', timeout: 60000 })
  const detail = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent,
    body: [...document.querySelectorAll('.feed-body p')].map((paragraph) => paragraph.textContent ?? ''),
    repo: document.querySelector('.feed-related a')?.getAttribute('href'),
    repoRel: document.querySelector('.feed-related a')?.getAttribute('rel'),
    back: document.querySelector('.feed-article-foot a')?.getAttribute('href'),
  }))
  assert.equal(detail.h1, 'sink', 'project detail renders the project title')
  assert.ok(detail.body.includes('More project notes, demos, and photographs will be added here.'), 'project detail renders the placeholder paragraph')
  assert.ok(detail.body.some((paragraph) => /stability notes currently recommend keeping the release disabled/i.test(paragraph)), 'sink detail states its safety status')
  assert.ok(detail.repo?.startsWith('https://github.com/'), 'project detail links to the repository')
  assert.equal(detail.repoRel, 'noreferrer', 'repository link is safe')
  assert.equal(detail.back, '/projects/', 'project detail links back to the projects index')

  // Narrowest header keeps the name on one line by dropping nav to its own row.
  await page.setViewport({ width: 320, height: 700 })
  await page.goto(`${baseURL}/projects/`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.waitForSelector('.feed-name')
  const narrowHeader = await page.evaluate(() => ({
    nameHeight: document.querySelector('.feed-name')?.getBoundingClientRect().height,
    navTop: document.querySelector('.feed-nav')?.getBoundingClientRect().top,
    nameBottom: document.querySelector('.feed-name')?.getBoundingClientRect().bottom,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }))
  assert.ok(narrowHeader.nameHeight <= 26, 'site name stays on one line at 320px')
  assert.ok(narrowHeader.navTop >= narrowHeader.nameBottom - 2, 'navigation drops below the name at 320px')
  assert.ok(narrowHeader.scrollWidth <= narrowHeader.viewportWidth + 1, 'no horizontal overflow at 320px')

  // The map keeps a calm rhythm: bounded gap under the grid.
  const mapGap = await page.evaluate(() => {
    const frame = document.querySelector('.map-frame.is-bare')
    const group = document.querySelector('.feed-year')
    if (!frame || !group) return null
    return Math.round(group.getBoundingClientRect().top - frame.getBoundingClientRect().bottom)
  })
  assert.ok(mapGap !== null && mapGap <= 72, `map leaves a bounded gap before the project groups (${mapGap}px)`)

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
      try {
        walk(sheet.cssRules)
      } catch {
        // Cross-origin stylesheets are not part of the app bundle.
      }
    }
    return chunks.join('\n')
  })
  assert.match(reducedCss, /\.map-ripple-layer[\s\S]{0,80}display:\s*none/, 'decorative ripple is hidden under reduced motion')
  assert.match(reducedCss, /\.map-preview-slot[\s\S]{0,80}transition:\s*none/, 'row transitions are disabled under reduced motion')

  assert.deepEqual(errors, [], 'projects index has no runtime errors')
  console.log('PASS: projects index shows groups, repository links, activity map and collapsible activity')
} finally {
  if (context) await context.close()
  if (remoteEndpoint) await browser.disconnect()
  else await browser.close()
}
