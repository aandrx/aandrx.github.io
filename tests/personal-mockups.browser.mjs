import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import puppeteer from 'puppeteer-core'
import { Browser, computeExecutablePath, detectBrowserPlatform } from '@puppeteer/browsers'

// Connect to a shared disposable Firefox when the production gate supplies it.
// Standalone runs still launch their own browser from MOCKUP_BASE_URL.
const baseURL = process.env.SITE_URL ?? process.env.MOCKUP_BASE_URL ?? 'http://127.0.0.1:3000'
const remoteEndpoint = process.env.SITE_URL && process.env.BROWSER_WS_ENDPOINT ? process.env.BROWSER_WS_ENDPOINT : null
const executablePath = remoteEndpoint ? null : process.env.FIREFOX_PATH ?? computeExecutablePath({
  browser: Browser.FIREFOX,
  buildId: 'stable_154.0.1',
  cacheDir: path.join(os.homedir(), '.cache/puppeteer'),
  platform: detectBrowserPlatform(),
})
const metadata = JSON.parse(await readFile(new URL('../src/data/image-metadata.json', import.meta.url), 'utf8'))
const browser = remoteEndpoint
  ? await puppeteer.connect({ browserWSEndpoint: remoteEndpoint, protocol: 'webDriverBiDi' })
  : await puppeteer.launch({ browser: 'firefox', executablePath, headless: true })
const context = remoteEndpoint ? await browser.createBrowserContext() : null
const errors = []
try {
  const page = context ? await context.newPage() : await browser.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.setCacheEnabled(false)

  const readReducedMotionCss = () => page.evaluate(() => {
    const chunks = []
    const walk = (rules) => {
      for (const rule of rules) {
        if (!rule.cssRules) continue
        if (rule.conditionText?.includes('prefers-reduced-motion')) chunks.push(rule.cssText)
        else walk(rule.cssRules)
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
  const hasReducedMotionRule = (css, selector, declaration) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`${escaped}[\\s\\S]{0,800}?${declaration}`).test(css)
  }

  await page.goto(`${baseURL}/mockups/`, { waitUntil: 'networkidle2' })
  assert.equal(new URL(page.url()).pathname, '/', '/mockups/ redirects to the personal home')
  assert.ok(await page.$('.mock-museum'), 'museum page renders at the personal home')

  for (const route of ['desk', 'monolith', 'orbit', 'folio', 'signal', 'index-cards']) {
    const response = await fetch(`${baseURL}/mockups/${route}/`)
    assert.equal(response.status, 404, `${route} mockup route is deleted`)
  }

  await page.setViewport({ width: 1440, height: 1000 })
  const museumResponse = await page.goto(`${baseURL}/`, { waitUntil: 'networkidle2' })
  assert.equal(museumResponse.status(), 200, 'museum remains available')
  await page.waitForSelector('.museum-stage')
  await page.waitForFunction(() => document.querySelector('.mock-museum')?.getAttribute('aria-busy') === 'false')
  const museum = await page.evaluate(() => ({
    stageWidth: document.querySelector('.museum-stage')?.getBoundingClientRect().width,
    stageHeight: document.querySelector('.museum-stage')?.getBoundingClientRect().height,
    textWidth: getComputedStyle(document.querySelector('.museum-under')).maxWidth,
    hintWidth: document.querySelector('.museum-scroll-hint')?.getBoundingClientRect().width,
    viewportWidth: document.documentElement.clientWidth,
    hintArrow: document.querySelector('.museum-scroll-hint svg')?.getBoundingClientRect().width,
    captionTitle: document.querySelector('.museum-caption strong')?.textContent,
    captionDate: document.querySelector('.museum-caption span')?.textContent,
    count: document.querySelector('.museum-stage')?.getAttribute('data-count'),
    nav: [...document.querySelectorAll('.museum-nav a')].map((link) => ({
      text: link.textContent,
      href: link.getAttribute('href'),
      current: link.getAttribute('aria-current'),
    })),
    hasProjectsTarget: !!document.querySelector('#projects'),
    hasFeedTarget: !!document.querySelector('#feed'),
    projects: document.querySelectorAll('#projects-list .museum-project').length,
    feed: [...document.querySelectorAll('#feed-list .museum-row-link')].map((link) => ({
      href: link.getAttribute('href'),
      target: link.getAttribute('target'),
      title: link.querySelector('strong')?.textContent,
      date: link.querySelector('time, .museum-row-date')?.textContent,
      dateTime: link.querySelector('time')?.getAttribute('datetime'),
      dateTag: link.querySelector('time, .museum-row-date')?.tagName,
      linkTitle: link.getAttribute('title'),
    })),
    feedArrows: document.querySelectorAll('.museum-row-arrow').length,
    feedHeadingHref: document.querySelector('#feed h2 a')?.getAttribute('href'),
  }))
  assert.equal(museum.stageWidth, 1440, 'museum gallery remains full width')
  assert.equal(museum.textWidth, '960px', 'museum lower text column is 960px')
  assert.equal(museum.stageHeight, 820, 'museum stage balances the shorter home spacing')
  assert.equal(museum.hintWidth, museum.viewportWidth, 'museum scroll hint spans the bottom of the page')
  assert.equal(museum.hintArrow, 22, 'museum scroll hint uses the larger arrow')
  assert.equal(museum.captionTitle, 'Starry Night Trailer', 'museum starts on the added middle photograph')
  assert.equal(museum.captionDate, 'Sep 2026', 'museum default photograph keeps its date')
  assert.equal(museum.count, '8', 'museum carousel contains all eight photographs')
  assert.deepEqual(museum.nav.map((link) => link.text), ['Work', 'Feed', 'Photo'], 'museum navigation exposes Work, Feed, and Photo')
  assert.equal(museum.nav[0].href, '#projects', 'museum Work links to the projects section')
  assert.equal(museum.nav[0].current, 'page', 'museum marks Work as current')
  assert.equal(museum.nav[1].href, '/feed/', 'museum Feed links to the feed index')
  assert.equal(museum.hasProjectsTarget, true, 'museum projects target exists')
  assert.equal(museum.hasFeedTarget, true, 'museum feed target exists')
  assert.equal(museum.projects, 8, 'projects section hides Continuum by default')
  assert.equal(museum.feed[0].href, 'https://github.com/aandrx/dotfiles/tree/main/.pi/agent/packages/rue-stack', 'feed starts with the personal rue-stack')
  assert.equal(museum.feed[0].target, '_blank', 'external feed links open in a new tab')
  assert.equal(museum.feed[0].title, 'rue-stack', 'the personal stack is labeled rue-stack')
  assert.equal(museum.feed[0].date, 'Oct 2026', 'the personal stack uses its last commit month')
  assert.equal(museum.feed[0].dateTime, '2026-10-29', 'the personal stack exposes its last commit date')
  assert.equal(museum.feed[0].linkTitle, 'Opens in a new tab', 'external feed links describe the new-tab behavior')
  assert.equal(museum.feed[1].href, 'https://github.com/aandrx/dotfiles', 'feed includes the public dotfiles')
  assert.equal(museum.feed[1].title, 'dotfiles', 'the dotfiles entry uses the short label')
  assert.equal(museum.feed[1].dateTime, '2026-10-31', 'the dotfiles entry exposes its last commit date')
  assert.equal(museum.feedArrows, 0, 'feed rows do not use link icons')
  assert.equal(museum.feedHeadingHref, '/feed/', 'the feed section heading opens the feed page')

  await page.hover('#feed-list .museum-row-link')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#feed-list .museum-row-link'), '::before').opacity === '1')
  const museumFeedHover = await page.evaluate(() => {
    const link = document.querySelector('#feed-list .museum-row-link')
    return {
      paddingLeft: getComputedStyle(link).paddingLeft,
      markerOpacity: getComputedStyle(link, '::before').opacity,
    }
  })
  assert.ok(Math.abs(parseFloat(museumFeedHover.paddingLeft) - 24) < 0.2, 'main feed rows indent on hover')
  assert.equal(museumFeedHover.markerOpacity, '1', 'main feed rows show a square marker on hover')
  await page.mouse.move(0, 0)

  const feedMoreGap = await page.evaluate(() => {
    const last = document.querySelector('#feed-list .museum-row:last-child')?.getBoundingClientRect()
    const more = document.querySelector('#feed .museum-more')?.getBoundingClientRect()
    return last && more ? more.top - last.bottom : null
  })
  assert.ok(feedMoreGap !== null && feedMoreGap >= 0 && feedMoreGap <= 8, 'feed More follows the last row')
  assert.match(museum.feed[2].href, /^\/feed\/on-small-tools\/$/, 'internal feed items link to article pages')

  const hasMuseumCanvas = !!(await page.$('.museum-canvas'))
  if (hasMuseumCanvas) {
    const museumCanvasLabel = await page.$eval('.museum-canvas', (element) => element.getAttribute('aria-label'))
    assert.match(museumCanvasLabel, /photographs/i, 'museum canvas accessibility label describes photographs')
    assert.doesNotMatch(museumCanvasLabel, /frame/i, 'museum canvas accessibility label no longer mentions frames')
    const museumCanvasPresentation = await page.$eval('.museum-canvas', (element) => ({
      presentation: element.getAttribute('data-presentation'),
      fit: element.getAttribute('data-fit'),
    }))
    assert.equal(museumCanvasPresentation.presentation, 'photos-only', 'museum canvas presents photographs without frames')
    assert.equal(museumCanvasPresentation.fit, 'contain', 'museum canvas fits the full photo inside the slot bounds')
    console.log('PASS: museum canvas accessibility label and photo presentation describe photographs')
  } else {
    console.log('SKIP: WebGL canvas unavailable in this browser; fallback remains in place')
  }

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await page.waitForFunction(() => document.querySelector('.mock-museum')?.classList.contains('is-at-bottom'))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.museum-caption')).opacity === '0')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.museum-top-hint')).opacity === '1')
  const bottomState = await page.evaluate(() => ({
    caption: getComputedStyle(document.querySelector('.museum-caption')).opacity,
    canvas: document.querySelector('.museum-canvas') ? getComputedStyle(document.querySelector('.museum-canvas')).opacity : null,
    hint: document.querySelector('.museum-top-hint')?.classList.contains('is-visible'),
    hintOpacity: getComputedStyle(document.querySelector('.museum-top-hint')).opacity,
  }))
  assert.equal(bottomState.caption, '0', 'caption hides at the bottom of the landing page')
  if (bottomState.canvas !== null) assert.equal(bottomState.canvas, '0', 'carousel hides at the bottom of the landing page')
  assert.equal(bottomState.hint, true, 'upward scroll hint appears at the bottom')
  assert.equal(bottomState.hintOpacity, '1', 'upward scroll hint is visible at the bottom')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForFunction(() => !document.querySelector('.mock-museum')?.classList.contains('is-at-bottom'))

  await page.click('.museum-nav a[href="#projects"]')
  await page.waitForFunction(() => Math.abs((document.querySelector('#projects')?.getBoundingClientRect().top ?? 0) - 90) <= 2)
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.museum-caption')).opacity === '0')
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.museum-caption')).opacity), '0', 'Work anchor hides the carousel caption')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))

  const moreButtons = await page.$$('.museum-more')
  assert.equal(moreButtons.length, 2, 'museum exposes Projects and Feed More controls')
  for (const [selector, isProjects] of [['#projects .museum-more', true], ['#feed .museum-more', false]]) {
    const readControl = () => page.$eval(selector, (element) => ({
      expanded: element.getAttribute('aria-expanded'),
      text: element.textContent.replace(/\s+/g, ' ').trim(),
    }))
    const collapsed = await readControl()
    assert.equal(collapsed.expanded, 'false', 'museum More control starts collapsed')
    assert.equal(collapsed.text, 'More ↓', 'museum More control points down for vertical expansion')
    await page.click(selector)
    await page.waitForFunction((control) => document.querySelector(control)?.getAttribute('aria-expanded') === 'true', {}, selector)
    const expanded = await readControl()
    assert.equal(expanded.text, 'Less ↑', 'museum Less control points up for vertical collapse')
    if (isProjects) {
      assert.match(await page.$eval('#projects-more', element => element.textContent ?? ''), /Continuum/, 'projects More reveals Continuum')
    }
    await page.click(selector)
    await page.waitForFunction((control) => document.querySelector(control)?.getAttribute('aria-expanded') === 'false', {}, selector)
  }

  await page.$eval('#feed .museum-more', (button) => button.click())
  await page.waitForFunction(() => document.querySelector('#feed .museum-more')?.getAttribute('aria-expanded') === 'true')
  const articleHrefs = await page.$$eval('#feed-list a[href^="/feed/"], #feed-more a[href^="/feed/"]', links => links.map(link => link.getAttribute('href')))
  assert.equal(articleHrefs.length, 9, 'every internal feed item has an article page')
  for (const href of articleHrefs) {
    const response = await fetch(`${baseURL}${href}`)
    assert.equal(response.status, 200, `${href} returns 200`)
  }
  await page.$eval('#feed .museum-more', (button) => button.click())
  await page.waitForFunction(() => document.querySelector('#feed .museum-more')?.getAttribute('aria-expanded') === 'false')

  const sectionHeadSelector = '.museum-experience .museum-section-head'
  const idleSectionHead = await page.evaluate((selector) => {
    const head = document.querySelector(selector)
    return {
      heading: getComputedStyle(head.querySelector('h2')).color,
      toggle: getComputedStyle(head.querySelector('.museum-section-toggle')).color,
      duration: getComputedStyle(head.querySelector('h2')).transitionDuration,
    }
  }, sectionHeadSelector)
  const hostPrefersReducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  assert.equal(idleSectionHead.duration, hostPrefersReducedMotion ? '0s' : '0.18s', 'museum section-heading motion follows the host preference')
  await page.hover(sectionHeadSelector)
  await page.waitForFunction((selector, idle) => {
    const head = document.querySelector(selector)
    return head ? getComputedStyle(head.querySelector('h2')).color !== idle : false
  }, {}, sectionHeadSelector, idleSectionHead.heading)
  const hoveredSectionHead = await page.evaluate((selector) => {
    const head = document.querySelector(selector)
    return {
      heading: getComputedStyle(head.querySelector('h2')).color,
      toggle: getComputedStyle(head.querySelector('.museum-section-toggle')).color,
    }
  }, sectionHeadSelector)
  assert.notEqual(hoveredSectionHead.heading, idleSectionHead.heading, 'museum section heading darkens on hover')
  assert.notEqual(hoveredSectionHead.toggle, idleSectionHead.toggle, 'museum section toggle darkens on hover')
  await page.mouse.move(0, 0)
  console.log('PASS: museum More/Less arrows and collapsible heading hover feedback')

  const defaultSections = await page.evaluate(() => ({
    experience: document.querySelector('.museum-experience .museum-section-head')?.getAttribute('aria-expanded'),
    organizations: document.querySelector('.museum-organizations .museum-section-head')?.getAttribute('aria-expanded'),
    experienceHeight: document.querySelector('#experience-list')?.getBoundingClientRect().height,
    organizationsHeight: document.querySelector('#organizations-list')?.getBoundingClientRect().height,
  }))
  assert.equal(defaultSections.experience, 'true', 'experience starts expanded')
  assert.equal(defaultSections.organizations, 'true', 'organizations start expanded')
  assert.ok((defaultSections.experienceHeight ?? 0) > 0, 'experience content is visible by default')
  assert.ok((defaultSections.organizationsHeight ?? 0) > 0, 'organization content is visible by default')

  const expandedOrg = await page.$eval('#organizations-list .museum-org-tag', (element) => {
    element.focus()
    return document.activeElement === element
  })
  assert.equal(expandedOrg, true, 'expanded museum organization links can receive focus')

  for (const selector of ['.museum-pill.active', '.museum-pill:not(.active)']) {
    const pill = await page.$(selector)
    assert.ok(pill, `${selector} exists`)
    await pill.hover()
    const decoration = await page.evaluate(element => getComputedStyle(element).textDecorationLine, pill)
    assert.equal(decoration, 'none', `${selector} has no hover underline`)
  }
  const orgTag = await page.$('#organizations-list .museum-org-tag')
  assert.ok(orgTag, 'expanded museum organization link exists')
  await orgTag.hover()
  await page.waitForSelector('.museum-org-preview')
  const orgDecoration = await page.evaluate(element => getComputedStyle(element).textDecorationLine, orgTag)
  assert.equal(orgDecoration, 'none', 'museum organization chip has no hover underline')
  await page.setViewport({ width: 1200, height: 800 })
  await page.waitForFunction(() => !document.querySelector('.museum-org-preview'))
  await page.click('.museum-organizations .museum-section-head')
  await page.waitForFunction(() => !document.querySelector('#organizations-list')?.classList.contains('open'))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#organizations-list .museum-org-tag')).visibility === 'hidden')
  const collapsedOrg = await page.$eval('#organizations-list .museum-org-tag', (element) => {
    element.focus()
    return {
      focused: document.activeElement === element,
      visibility: getComputedStyle(element).visibility,
      tabIndex: element.tabIndex,
    }
  })
  assert.equal(collapsedOrg.focused, false, 'collapsed museum organization links cannot receive focus')
  assert.equal(collapsedOrg.visibility, 'hidden', 'collapsed museum organization content is hidden')
  assert.equal(collapsedOrg.tabIndex, -1, 'collapsed museum organization links leave the tab order')

  let reducedMotionEmulated = false
  try {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    reducedMotionEmulated = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  } catch {
    reducedMotionEmulated = false
  }
  if (reducedMotionEmulated) {
    const museumTransitions = await page.evaluate(() => {
      const duration = (selector) => {
        const element = document.querySelector(selector)
        return element ? getComputedStyle(element).transitionDuration : null
      }
      return {
        loading: duration('.museum-loading'),
        orgTag: duration('.museum-org-tag'),
        feedDate: duration('.museum-row time'),
        sectionHeading: duration('.museum-section-head h2'),
        sectionToggle: duration('.museum-section-toggle'),
        collapse: duration('.museum-collapse'),
        extra: duration('.museum-extra'),
        projectDetail: duration('.museum-project-detail-wrap'),
      }
    })
    for (const [name, value] of Object.entries(museumTransitions)) {
      assert.equal(value, '0s', `museum ${name} transition is disabled under reduced motion`)
    }
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
    console.log('PASS: museum reduced-motion transitions disabled via emulation')
  } else {
    const reducedCss = await readReducedMotionCss()
    for (const selector of ['.museum-loading', '.museum-org-tag', '.museum-row time', '.museum-section-head h2', '.museum-section-toggle', '.museum-collapse', '.museum-extra', '.museum-project-detail-wrap']) {
      assert.ok(hasReducedMotionRule(reducedCss, selector, 'transition:\\s*none'), `${selector} transition is disabled by reduced-motion CSS`)
    }
    console.log('PASS: museum reduced-motion declarations verified from stylesheets')
  }
  console.log('PASS: museum redirect, deleted routes, collapsed controls, and organization preview dismissal')

  const feedIndexResponse = await page.goto(`${baseURL}/feed/`, { waitUntil: 'networkidle2' })
  assert.equal(feedIndexResponse.status(), 200, 'feed index loads')
  const feedIndex = await page.evaluate(() => {
    const inner = document.querySelector('.feed-index-inner')?.getBoundingClientRect()
    return {
      title: document.querySelector('.feed-index-title')?.textContent,
      year: document.querySelector('.feed-year')?.textContent,
      rows: [...document.querySelectorAll('.feed-row-link')].map((link) => ({
        title: link.querySelector('span')?.textContent,
        date: link.querySelector('time')?.textContent,
        href: link.getAttribute('href'),
        target: link.getAttribute('target'),
        linkTitle: link.getAttribute('title'),
      })),
      navCurrent: document.querySelector('.feed-nav a[aria-current="page"]')?.textContent,
      icons: document.querySelectorAll('.feed-row svg, .feed-row img').length,
      centered: inner ? Math.abs((inner.left + inner.right) / 2 - innerWidth / 2) <= 1 : false,
      headerBorder: getComputedStyle(document.querySelector('.feed-top')).borderBottomWidth,
      titleBorder: getComputedStyle(document.querySelector('.feed-index-title')).borderBottomWidth,
      background: getComputedStyle(document.body).backgroundColor,
      nameSize: getComputedStyle(document.querySelector('.feed-name')).fontSize,
      pills: document.querySelectorAll('.feed-pill').length,
    }
  })
  assert.equal(feedIndex.title, 'Feed', 'feed index has a Feed heading')
  assert.equal(feedIndex.year, '2026', 'feed index groups notes by year')
  assert.equal(feedIndex.rows.length, 11, 'feed index lists every note and external link')
  assert.equal(feedIndex.rows[0].title, 'dotfiles', 'feed index is ordered by date')
  assert.equal(feedIndex.rows[0].date, 'Oct 2026', 'feed index shows commit dates')
  assert.equal(feedIndex.rows[0].target, '_blank', 'feed index keeps external links external')
  assert.equal(feedIndex.rows[0].linkTitle, 'Opens in a new tab', 'feed index external rows describe the new-tab behavior')
  assert.equal(feedIndex.navCurrent, 'Feed', 'feed index marks Feed as current')
  assert.equal(feedIndex.icons, 0, 'feed index has no link icons')
  assert.equal(feedIndex.centered, true, 'feed index is centered')
  assert.equal(feedIndex.headerBorder, '0px', 'feed index has no divider under the header')
  assert.equal(feedIndex.titleBorder, '1px', 'feed index has a divider under Feed')
  assert.equal(feedIndex.background, 'rgb(255, 255, 255)', 'feed index keeps the site white background')
  assert.equal(feedIndex.nameSize, '36px', 'feed index keeps the home masthead name scale')
  assert.equal(feedIndex.pills, 3, 'feed index keeps the three home masthead buttons')

  await page.hover('.feed-row-link')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.feed-row-link'), '::before').opacity === '1')
  const feedHover = await page.evaluate(() => {
    const link = document.querySelector('.feed-row-link')
    return {
      paddingLeft: getComputedStyle(link).paddingLeft,
      markerOpacity: getComputedStyle(link, '::before').opacity,
    }
  })
  assert.ok(Math.abs(parseFloat(feedHover.paddingLeft) - 24) < 0.2, 'feed index rows indent on hover')
  assert.equal(feedHover.markerOpacity, '1', 'feed index rows show a square marker on hover')
  await page.mouse.move(0, 0)

  for (const width of [390, 700]) {
    await page.setViewport({ width, height: width === 390 ? 844 : 900 })
    await page.goto(`${baseURL}/feed/`, { waitUntil: 'networkidle2' })
    const mobileFeedIndex = await page.evaluate(() => ({
      nameSize: getComputedStyle(document.querySelector('.feed-name')).fontSize,
      pillHeight: getComputedStyle(document.querySelector('.feed-pill')).height,
      overflow: document.documentElement.scrollWidth - innerWidth,
      topWidth: document.querySelector('.feed-top')?.getBoundingClientRect().width,
    }))
    assert.equal(mobileFeedIndex.nameSize, '21px', `feed index ${width}px name matches the home header`)
    assert.equal(mobileFeedIndex.pillHeight, '24px', `feed index ${width}px pills match the home header`)
    assert.equal(mobileFeedIndex.topWidth, width - (width === 390 ? 40 : 56), `feed index ${width}px header fits the viewport`)
    assert.ok(mobileFeedIndex.overflow <= 1, `feed index has no horizontal overflow at ${width}px`)
  }
  await page.setViewport({ width: 1200, height: 800 })
  console.log('PASS: feed index routing page, hover marker, grouped rows, and centered layout')

  const articleResponse = await page.goto(`${baseURL}${articleHrefs[0]}`, { waitUntil: 'networkidle2' })
  assert.equal(articleResponse.status(), 200, 'first internal feed article loads')
  const article = await page.evaluate(() => ({
    title: document.querySelector('.feed-article h1')?.textContent,
    slug: document.querySelector('[data-feed-article]')?.getAttribute('data-feed-article'),
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    back: document.querySelector('.feed-article-foot a')?.getAttribute('href'),
    dateTime: document.querySelector('.feed-article-date time')?.getAttribute('datetime'),
    navCurrent: document.querySelector('.feed-nav a[aria-current="page"]')?.textContent,
    workHref: document.querySelector('.feed-nav a')?.getAttribute('href'),
    nameSize: getComputedStyle(document.querySelector('.feed-name')).fontSize,
    topWidth: document.querySelector('.feed-top')?.getBoundingClientRect().width,
    paragraphs: document.querySelectorAll('.feed-body p').length,
    bodyText: document.querySelector('.feed-body')?.textContent,
    related: document.querySelector('.feed-related a')?.getAttribute('href'),
    bodyWidth: document.querySelector('.feed-article-main')?.getBoundingClientRect().width,
    headerBorder: getComputedStyle(document.querySelector('.feed-top')).borderBottomWidth,
    background: getComputedStyle(document.body).backgroundColor,
  }))
  assert.equal(article.title, 'On small tools', 'feed article renders its title')
  assert.equal(article.slug, 'on-small-tools', 'feed article exposes its slug')
  assert.ok(!article.robots || !/noindex/.test(article.robots), 'feed article is indexable')
  assert.equal(article.back, '/feed/', 'feed article links back to the feed index')
  assert.equal(article.dateTime, '2026-10-01', 'feed article exposes a machine-readable date')
  assert.equal(article.navCurrent, 'Feed', 'feed article marks the feed navigation as current')
  assert.equal(article.workHref, '/#projects', 'feed article Work link matches the museum Work target')
  assert.equal(article.nameSize, '36px', 'feed article masthead uses the home name scale')
  assert.equal(article.topWidth, 960, 'feed article masthead matches the home header width')
  assert.equal(article.bodyWidth, 664, 'feed article body is centered in the same column')
  assert.equal(article.background, 'rgb(255, 255, 255)', 'feed article keeps the site white background')
  assert.equal(article.headerBorder, '0px', 'feed article has no divider under the header')
  assert.ok(article.paragraphs >= 3, 'feed article includes project-specific body copy')
  assert.match(article.bodyText, /palace-tui/, 'feed article references the project it discusses')
  assert.equal(article.related, 'https://github.com/aandrx/palace-tui', 'feed article links to the related repository')
  console.log('PASS: feed article layout and internal links')

  for (const width of [1440, 390]) {
    await page.setViewport({ width, height: width === 390 ? 844 : 1000 })
    await page.goto(`${baseURL}/feed/photographing-empty-rooms/`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('.feed-figure img')
    await page.waitForFunction(() => {
      const image = document.querySelector('.feed-figure img')
      return image?.complete && image.naturalWidth > 0
    })
    const figure = await page.evaluate(() => {
      const image = document.querySelector('.feed-figure img')
      const rect = image.getBoundingClientRect()
      return {
        rectRatio: rect.width / rect.height,
        naturalRatio: image.naturalWidth / image.naturalHeight,
        overflow: document.documentElement.scrollWidth - innerWidth,
      }
    })
    assert.ok(Math.abs(figure.rectRatio - figure.naturalRatio) < 0.01, `feed article image preserves its full aspect at ${width}px`)
    assert.ok(figure.overflow <= 1, `feed article has no horizontal overflow at ${width}px`)
  }
  console.log('PASS: feed article image preserves the full photograph at desktop and mobile')

  for (const width of [769, 900, 1039]) {
    await page.setViewport({ width, height: 1000 })
    await page.goto(`${baseURL}/photo/about/`, { waitUntil: 'networkidle2' })
    await page.waitForSelector('#container.about-container')
    const about = await page.evaluate(() => {
      const container = document.querySelector('#container.about-container')
      const right = Math.max(
        container.getBoundingClientRect().right,
        ...[...container.querySelectorAll('*')].map((element) => element.getBoundingClientRect().right),
      )
      return { right, viewportWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }
    })
    assert.ok(about.right <= about.viewportWidth + 1, `about content fits at ${width}px (right ${about.right})`)
    assert.ok(about.scrollWidth <= about.viewportWidth + 1, `about page has no horizontal overflow at ${width}px (${about.scrollWidth})`)
  }
  console.log('PASS: about page fits throughout the intermediate breakpoint range')

  const aboutActive = await page.evaluate(() => {
    const link = [...document.querySelectorAll('.sidebar a.nav-item')].find(
      (element) => (element.getAttribute('href') ?? '').replace(/\/+$/, '') === '/photo/about',
    )
    if (!link) return null
    const style = getComputedStyle(link)
    return {
      active: link.classList.contains('active'),
      decoration: style.textDecorationLine,
      color: style.textDecorationColor,
      ariaCurrent: link.getAttribute('aria-current'),
    }
  })
  assert.equal(aboutActive.active, true, 'about nav item is active despite trailingSlash')
  assert.equal(aboutActive.decoration, 'underline', 'about active state is visible')
  assert.equal(aboutActive.ariaCurrent, 'page', 'about nav item exposes aria-current=page')
  assert.equal(aboutActive.color, 'rgb(119, 119, 119)', 'about active underline is visibly #777')

  await page.setViewport({ width: 390, height: 844 })
  await page.goto(`${baseURL}/photo/works/wingspan/`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('.sidebar')

  const worksChildren = await page.evaluate(() => {
    const findLink = (selector) => [...document.querySelectorAll(selector)].find(
      (element) => (element.getAttribute('href') ?? '').replace(/\/+$/, '') === '/photo/works/wingspan',
    )
    const wingspan = findLink('#works-submenu a')
    if (!wingspan) return null
    const style = getComputedStyle(wingspan)
    return {
      active: wingspan.classList.contains('active'),
      decoration: style.textDecorationLine,
      color: style.textDecorationColor,
      ariaCurrent: wingspan.getAttribute('aria-current'),
    }
  })
  assert.equal(worksChildren.active, true, 'wingspan works child is active despite trailingSlash')
  assert.equal(worksChildren.decoration, 'underline', 'wingspan active state is visible')
  assert.equal(worksChildren.ariaCurrent, 'page', 'wingspan link exposes aria-current=page')
  assert.equal(worksChildren.color, 'rgb(119, 119, 119)', 'wingspan active underline is visibly #777')

  await page.goto(`${baseURL}/photo/works/`, { waitUntil: 'networkidle2' })
  await page.waitForSelector('.main-content')

  const cards = await page.$$eval('.project-item', (items) => items.map((item) => {
    const wrapper = item.querySelector('[data-image-key]')
    return {
      href: item.getAttribute('href') ?? '',
      imageKey: wrapper?.getAttribute('data-image-key') ?? '',
      alt: wrapper?.getAttribute('aria-label') ?? '',
    }
  }))
  const expectedWorks = [
    '/photo/works/wingspan',
    '/photo/works/nightfind-2026',
    '/photo/works/nightfind-2025',
    '/photo/works/nightfind-2024',
    '/photo/works/starry-night-2026',
    '/photo/works/lantern-fest-2026',
    '/photo/works/starry-night-2025',
  ]
  const expectedKeys = [
    'fuji-gt-2024-11-12-17-3/DSCF3711-Edit-Edit',
    'nightfind-2024-10-24-30/DSCF9391-Edit',
    'fuji-gt-2025-1-15-31/DSCF9903-Edit',
    'nightfind-2024-09-24-25/DSCF7571-Edit',
    'starrynight-2026-10-15/DSCF3413-Edit',
    'lantern-fest-2026-03-15/DSCF8346-Edit',
    'starrynight-2025-10-16/DSCF5995-Edit',
  ]
  const destinations = cards.map((card) => new URL(card.href, baseURL).pathname.replace(/\/+$/, ''))
  assert.deepEqual(destinations, expectedWorks, 'works page lists exactly the seven real collections')
  assert.deepEqual(cards.map((card) => card.imageKey), expectedKeys, 'works page uses the seven registered cover sources')
  for (const card of cards) {
    assert.ok(card.alt.trim().length > 0 && !/^Project /i.test(card.alt), `meaningful alt text for ${card.href}`)
  }
  const workResponses = await Promise.all(destinations.map(async (href) => {
    const response = await fetch(`${baseURL}${href}/`)
    return { href, status: response.status }
  }))
  for (const { href, status } of workResponses) {
    assert.equal(status, 200, `${href} returns 200`)
  }
  const works = await page.$eval('.main-content', (element) => {
    const rect = element.getBoundingClientRect()
    return { left: rect.left, right: rect.right, viewportWidth: innerWidth }
  })
  assert.ok(works.left >= -1, `works main content starts inside the viewport (left ${works.left})`)
  assert.ok(works.right <= works.viewportWidth + 1, `works main content fits at 390px (right ${works.right})`)
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), 'works page exposes its full vertical content')
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await page.waitForFunction(() => window.scrollY > 0)
  await page.evaluate(async () => {
    for (const item of document.querySelectorAll('.project-item')) {
      item.scrollIntoView({ block: 'center' })
      await new Promise((resolve) => {
        const deadline = Date.now() + 15000
        const check = () => {
          const image = item.querySelector('.portfolio-photo img')
          if (image) {
            if (image.complete && image.naturalWidth > 0) return resolve()
            image.addEventListener('load', resolve, { once: true })
            image.addEventListener('error', resolve, { once: true })
            return
          }
          if (Date.now() > deadline) return resolve()
          setTimeout(check, 50)
        }
        check()
      })
    }
  })
  const loadedImages = await page.$$eval('.project-item', (items) => items.map((item) => {
    const image = item.querySelector('.portfolio-photo img')
    return {
      key: item.querySelector('[data-image-key]')?.getAttribute('data-image-key') ?? '',
      src: image?.getAttribute('src') ?? '',
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
    }
  }))
  assert.equal(loadedImages.length, 7, 'works page renders seven images')
  for (const image of loadedImages) {
    const variant = metadata[image.key]?.variants.find((item) => item.size === 720)
    assert.ok(variant, `works image ${image.key} has a registered 720w variant`)
    assert.equal(image.src, variant.src, `works image ${image.key} uses the registered 720w R2 variant`)
    assert.ok(image.width > 0 && image.height > 0, `works image ${image.key} reports nonzero natural dimensions`)
  }
  await page.evaluate(() => window.scrollTo(0, 0))

  await page.click('button.nav-item')
  await page.waitForFunction(() => document.querySelector('#works-submenu')?.getAttribute('aria-hidden') === 'true')
  const worksLink = await page.evaluate(() => {
    const link = [...document.querySelectorAll('#works-submenu a')].find(
      (element) => (element.getAttribute('href') ?? '').replace(/\/+$/, '') === '/photo/works/wingspan',
    )
    return { tabIndex: link?.tabIndex ?? null }
  })
  assert.equal(worksLink.tabIndex, -1, 'collapsed works submenu links leave the keyboard tab order immediately')
  await page.keyboard.press('Tab')
  assert.match(await page.evaluate(() => document.activeElement?.getAttribute('href') ?? ''), /^\/photo\/feed\/?$/, 'keyboard skips collapsed works links')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#works-submenu')).visibility === 'hidden')
  console.log('PASS: works mobile layout and collapsed works submenu')

  let sharedReducedMotion = false
  try {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    sharedReducedMotion = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  } catch {
    sharedReducedMotion = false
  }
  if (sharedReducedMotion) {
    await page.click('button.nav-item')
    await page.waitForFunction(() => document.querySelector('#works-submenu')?.getAttribute('aria-hidden') === 'false')
    const worksTransition = await page.evaluate(() => getComputedStyle(document.querySelector('#works-submenu')).transitionDuration)
    assert.equal(worksTransition, '0s', 'works submenu transition is disabled under reduced motion')

    await page.click('#works-submenu button[aria-controls="nightfind-submenu"]')
    await page.waitForFunction(() => document.querySelector('#nightfind-submenu')?.getAttribute('aria-hidden') === 'false')
    const nestedTransition = await page.evaluate(() => getComputedStyle(document.querySelector('#nightfind-submenu')).transitionDuration)
    assert.equal(nestedTransition, '0s', 'nested works submenu transition is disabled under reduced motion')

    await page.evaluate(() => {
      const tile = document.createElement('div')
      tile.className = 'instagram-post'
      tile.style.cssText = 'position:fixed;top:0;right:0;width:40px;height:40px;z-index:2147483647;background:#f00'
      const image = document.createElement('img')
      image.className = 'instagram-image'
      image.alt = ''
      image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
      const overlay = document.createElement('div')
      overlay.className = 'instagram-post-overlay'
      tile.append(image, overlay)
      document.body.append(tile)
    })
    const thumbnailTransitions = await page.evaluate(() => ({
      tile: getComputedStyle(document.querySelector('.instagram-post')).transitionDuration,
      image: getComputedStyle(document.querySelector('.instagram-post .instagram-image')).transitionDuration,
      overlay: getComputedStyle(document.querySelector('.instagram-post .instagram-post-overlay')).transitionDuration,
    }))
    for (const [name, value] of Object.entries(thumbnailTransitions)) {
      assert.equal(value, '0s', `instagram thumbnail ${name} transition is disabled under reduced motion`)
    }
    await page.hover('.instagram-post')
    const thumbnailTransforms = await page.evaluate(() => ({
      tile: getComputedStyle(document.querySelector('.instagram-post')).transform,
      image: getComputedStyle(document.querySelector('.instagram-post .instagram-image')).transform,
    }))
    assert.equal(thumbnailTransforms.tile, 'none', 'instagram thumbnail does not scale under reduced motion')
    assert.equal(thumbnailTransforms.image, 'none', 'instagram thumbnail image does not scale under reduced motion')
    await page.evaluate(() => document.querySelector('.instagram-post')?.remove())

    await page.goto(`${baseURL}/feed/on-small-tools/`, { waitUntil: 'networkidle2' })
    const articleMotion = await page.evaluate(() => ({
      nav: getComputedStyle(document.querySelector('.feed-pill')).transitionDuration,
      foot: getComputedStyle(document.querySelector('.feed-article-foot a')).transitionDuration,
      overflow: document.documentElement.scrollWidth - innerWidth,
    }))
    assert.equal(articleMotion.nav, '0s', 'feed article nav transitions are disabled under reduced motion')
    assert.equal(articleMotion.foot, '0s', 'feed article footer transitions are disabled under reduced motion')
    assert.ok(articleMotion.overflow <= 1, 'feed article has no horizontal overflow')
    console.log('PASS: shared reduced-motion submenu, thumbnail, and feed article behavior verified via emulation')
  } else {
    await page.goto(`${baseURL}/feed/on-small-tools/`, { waitUntil: 'networkidle2' })
    const reducedCss = await readReducedMotionCss()
    assert.ok(hasReducedMotionRule(reducedCss, '#works-submenu', 'transition:\\s*none\\s*!important'), 'works submenu transition is disabled by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '#nightfind-submenu', 'transition:\\s*none\\s*!important'), 'nested works submenu transition is disabled by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.page-transition', 'opacity:\\s*1'), 'page transition stays visible under reduced motion')
    assert.ok(hasReducedMotionRule(reducedCss, '.main-content', 'opacity:\\s*1\\s*!important'), 'main content stays visible under reduced motion')
    assert.ok(hasReducedMotionRule(reducedCss, '#container', 'opacity:\\s*1\\s*!important'), 'route containers stay visible under reduced motion')
    assert.ok(hasReducedMotionRule(reducedCss, '.instagram-post:hover', 'transform:\\s*none'), 'instagram thumbnails do not scale by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.instagram-post:hover .instagram-image', 'transform:\\s*none'), 'instagram thumbnail images do not scale by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.feed-pill', 'transition:\\s*none'), 'feed nav transitions are disabled by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.feed-row-link', 'transition:\\s*none'), 'feed row transitions are disabled by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.feed-row-link::before', 'transition:\\s*none'), 'feed row marker transitions are disabled by reduced-motion CSS')
    assert.ok(hasReducedMotionRule(reducedCss, '.feed-article-foot a', 'transition:\\s*none'), 'feed article footer transitions are disabled by reduced-motion CSS')
    console.log('PASS: shared reduced-motion declarations verified from stylesheets')
  }

  assert.deepEqual(errors, [], 'application runtime errors')
  console.log('PASS: personal mockups and focused accessibility regressions')
} finally {
  if (context) await context.close()
  if (remoteEndpoint) await browser.disconnect()
  else await browser.close()
}
