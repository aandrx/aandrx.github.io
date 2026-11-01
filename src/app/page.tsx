'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MuseumItem } from '@/components/museum/museum-wall'
import { FEED_DEFAULT, FEED_MORE, type FeedEntry } from '@/lib/feed-data'
import SpotifyStatus from '@/components/museum/spotify-status'

type GalleryItem = MuseumItem & { project: string; date: string }

const GALLERY: GalleryItem[] = [
  {
    image: '/museum/works/wingspan.webp',
    aspect: 1920 / 2688,
    project: 'Wingspan',
    date: '2024 – 2026',
    width: 1.417,
    height: 1.88,
    offsetY: 0,
  },
  {
    image: '/museum/works/nightfind-2026.webp',
    aspect: 1920 / 2688,
    project: 'Nightfind 2026',
    date: 'Oct 2026',
    width: 1.177,
    height: 1.62,
    offsetY: 0,
  },
  {
    image: '/museum/works/nightfind-2025.webp',
    aspect: 1920 / 1371,
    project: 'Nightfind 2025',
    date: '2025',
    width: 2.121,
    height: 1.54,
    offsetY: 0,
  },
  {
    image: '/museum/works/nightfind-2024.webp',
    aspect: 1920 / 2688,
    project: 'Nightfind 2024',
    date: 'Sep 2024',
    width: 1.253,
    height: 1.71,
    offsetY: 0,
  },
  {
    image: '/museum/works/starry-night-filming-2026.webp',
    aspect: 1920 / 1280,
    project: 'Starry Night Trailer',
    date: 'Sep 2026',
    width: 2.355,
    height: 1.63,
    offsetY: 0,
  },
  {
    image: '/museum/works/starry-night-2026.webp',
    aspect: 1920 / 1280,
    project: 'Starry Night 2026',
    date: 'Oct 2026',
    width: 2.355,
    height: 1.63,
    offsetY: 0,
  },
  {
    image: '/museum/works/lantern-fest-2026.webp',
    aspect: 1920 / 2688,
    project: 'Lantern Fest 2026',
    date: 'Mar 2026',
    width: 1.269,
    height: 1.72,
    offsetY: 0,
  },
  {
    image: '/museum/works/starry-night-2025.webp',
    aspect: 1920 / 2880,
    project: 'Starry Night 2025',
    date: 'Oct 2025',
    width: 1.199,
    height: 1.75,
    offsetY: 0,
  },
]

type ExperienceItem = {
  company: string
  role: string
  date: string
  note: string
  mode: string
  location: string
  tag?: string
  orgUrl?: string
  orgPreview?: string
}

const EXPERIENCE: ExperienceItem[] = [
  {
    company: 'Bits of Good',
    role: 'Software Developer',
    date: 'Aug 2026 – now',
    location: 'Atlanta, GA',
    note: 'Product maintenance, nonprofit products, CI/CD, and the operational details that keep a product alive.',
    mode: 'On-site',
  },
  {
    company: 'AWS',
    role: 'Systems Development Engineer Intern',
    date: 'Summer 2026',
    location: 'Arlington, VA',
    note: 'Internal tools, streaming data systems, and failure-prediction workflows for controls engineers.',
    mode: 'On-site',
  },
  {
    company: 'PNNL',
    role: 'Software Engineer Intern',
    date: 'Aug 2025 – May 2026',
    location: 'Atlanta, GA',
    note: 'Data processing, visualization, and integration for research teams across the laboratory.',
    mode: 'Remote',
  },
  {
    company: 'PNNL',
    role: 'Software Engineer Intern',
    date: 'Summer 2025',
    location: 'Richland, WA',
    note: 'React components, responsive interfaces, and C++ API integration for travel analytics.',
    mode: 'On-site',
  },
  {
    company: 'PNNL',
    role: 'Computational Biology Intern',
    date: 'Summer 2024',
    location: 'Richland, WA',
    note: 'Machine learning, statistical models, and cluster analysis for kinase substrate research.',
    mode: 'On-site',
  },
  {
    company: 'PNNL',
    role: 'Computational Biology Intern',
    date: 'Summer 2023',
    location: 'Richland, WA',
    note: 'Machine learning and HPC analysis for phosphorylation pattern detection.',
    mode: 'On-site',
  },
  {
    company: 'PNNL',
    role: 'Applied Machine and Reinforcement Learning Intern',
    date: 'Summer 2022',
    location: 'Richland, WA',
    note: 'Reinforcement learning and process optimization for energy and chemical systems.',
    mode: 'On-site',
  },
]

const ORGANIZATIONS: ExperienceItem[] = [
  {
    company: 'Georgia Tech VIP Program',
    orgUrl: 'https://vip.gatech.edu/',
    orgPreview: '/museum/orgs/vip.png',
    role: 'Undergraduate Researcher',
    date: '2026 – now',
    location: 'Atlanta, GA',
    note: 'Undergraduate research through the Georgia Tech VIP program.',
    mode: 'On-site',
    tag: 'Org',
  },
  {
    company: 'WebDev @ GT',
    orgUrl: 'https://gt-webdev-website.vercel.app/',
    orgPreview: '/museum/orgs/webdev.png',
    role: 'Full Stack Engineer',
    date: 'Jan – Aug 2026',
    location: 'Atlanta, GA',
    note: 'Full-stack development for BuzzBoard.',
    mode: 'Hybrid',
    tag: 'Org',
  },
  {
    company: 'Bits of Good',
    orgUrl: 'https://bitsofgood.org/',
    orgPreview: '/museum/orgs/bits-of-good.png',
    role: 'Developer Bootcamper',
    date: 'Jan – Aug 2026',
    location: 'Atlanta, GA',
    note: 'Web development training within the Bits of Good program.',
    mode: 'Hybrid',
    tag: 'Org',
  },
  {
    company: 'Georgia Tech Chinese Student Association',
    orgUrl: 'https://csa.gtorg.gatech.edu/',
    orgPreview: '/museum/orgs/csa.png',
    role: 'Photographer',
    date: 'Sep 2024 – now',
    location: 'Atlanta, GA',
    note: 'Events and promotional content.',
    mode: 'On-site',
    tag: 'Org',
  },
  {
    company: 'Technology Student Association',
    orgUrl: 'https://tsaweb.org/',
    orgPreview: '/museum/orgs/tsa.png',
    role: 'Chapter President',
    date: 'Sep 2022 – Aug 2024',
    location: 'Richland, WA',
    note: 'Chapter leadership and competition events.',
    mode: 'On-site',
    tag: 'Org',
  },
]

type ProjectItem = {
  title: string
  repo: string
  summary: string
  detail: string
  tag?: string
}

const PROJECTS: ProjectItem[] = [
  {
    title: 'sink',
    repo: 'https://github.com/aandrx/sink',
    summary: 'Obsidian sync, conflicts, and diffs',
    detail: 'A small sync layer with conflict detection and file-level diffs.',
  },
  {
    title: 'Shend',
    repo: 'https://github.com/aandrx/shend',
    summary: 'A Discord video compressor',
    detail: 'A self-hosted bot that compresses large videos and returns inline embeds or direct downloads.',
  },
  {
    title: 'Webby',
    repo: 'https://github.com/jynlee7/webby',
    summary: 'Sticky notes for Mac apps and Chrome',
    detail: 'A work-in-progress notes tool that stays attached to apps and exact web pages.',
  },
  {
    title: 'Hope for Haiti',
    repo: 'https://github.com/GTBitsOfGood/hope-for-haiti',
    summary: 'Medical supply chain platform',
    detail: 'A GT Bits of Good client project for medical supply distribution and partner coordination.',
    tag: 'Client',
  },
  {
    title: 'Loom',
    repo: 'https://github.com/aandrx/Loom',
    summary: 'Escrow payments and autonomous agents',
    detail: 'Escrow state transitions, agent coordination, and a typed payment ledger.',
  },
  {
    title: 'HarmonyAPI',
    repo: 'https://github.com/aandrx/harmonyAPI',
    summary: 'Healthcare literature retrieval',
    detail: 'A compact API surface for literature retrieval and ranked passages.',
  },
  {
    title: 'palace-tui',
    repo: 'https://github.com/aandrx/palace-tui',
    summary: 'A terminal knowledge graph',
    detail: 'Keyboard-first navigation for a local knowledge graph.',
  },
]

const MORE_PROJECTS: ProjectItem[] = [
  {
    title: 'Continuum',
    repo: 'https://github.com/aandrx/continuum',
    summary: 'Vue and Kubernetes dashboard',
    detail: 'A small operational dashboard for services and cluster state.',
  },
  {
    title: 'Ina',
    repo: 'https://github.com/aandrx/ina-bot',
    summary: 'A small automation bot',
    detail: 'A compact bot for repetitive tasks and small workflow experiments.',
  },
  {
    title: 'Spendwise',
    repo: 'https://github.com/aandrx/spendwise-pages',
    summary: 'A personal finance prototype',
    detail: 'A spending tracker built around a small, clear data model.',
  },
  {
    title: 'Sophitia',
    repo: 'https://github.com/aandrx/sophitia',
    summary: 'An experimental web project',
    detail: 'A place for interaction experiments and unfinished interface ideas.',
  },
]

const DEFAULT_GALLERY_INDEX = 4

function ProjectRow({ project }: { project: ProjectItem }) {
  const [open, setOpen] = useState(false)
  const id = `project-${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <li className="museum-project">
      <div className="museum-project-head">
        <a className="museum-project-link" href={project.repo} target="_blank" rel="noreferrer">
          <span className="museum-project-title">{project.title}{project.tag ? <span className="museum-project-tag">{project.tag}</span> : null}</span>
          <span className="museum-project-summary">{project.summary}</span>
        </a>
        <button
          className="museum-project-toggle"
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${open ? 'Hide' : 'Show'} details for ${project.title}`}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="museum-toggle-icon" aria-hidden="true" />
        </button>
      </div>
      <div className={`museum-project-detail-wrap${open ? ' open' : ''}`} id={id}>
        <div>
          <p className="museum-project-detail">{project.detail}</p>
        </div>
      </div>
    </li>
  )
}

function FeedRow({ entry }: { entry: FeedEntry }) {
  const date = entry.dateTime
    ? <time dateTime={entry.dateTime}>{entry.date}</time>
    : <span className="museum-row-date">{entry.date}</span>
  const content = (
    <>
      <strong>{entry.title}</strong>
      {date}
    </>
  )

  return (
    <li className="museum-row">
      {entry.external ? (
        <a className="museum-row-link" href={entry.href} target="_blank" rel="noreferrer" title="Opens in a new tab">
          {content}
        </a>
      ) : (
        <Link className="museum-row-link" href={entry.href}>
          {content}
        </Link>
      )}
    </li>
  )
}

function OrgTag({ href, name, preview, focusable }: { href: string; name: string; preview: string; focusable: boolean }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 20, top: 20 })

  const place = (x: number, y: number) => {
    const width = 320
    const height = 236
    setPosition({
      left: Math.max(12, Math.min(x + 18, window.innerWidth - width - 12)),
      top: Math.max(12, Math.min(y + 18, window.innerHeight - height - 12)),
    })
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <a
        className="museum-org-tag"
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Org, open ${name} website`}
        tabIndex={focusable ? undefined : -1}
        onMouseEnter={(event) => {
          place(event.clientX, event.clientY)
          setOpen(true)
        }}
        onMouseMove={(event) => place(event.clientX, event.clientY)}
        onMouseLeave={() => setOpen(false)}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          place(rect.right, rect.top)
          setOpen(true)
        }}
        onBlur={() => setOpen(false)}
      >
        Org
      </a>
      {open
        ? createPortal(
            <div className="museum-org-preview" style={{ left: position.left, top: position.top }} aria-hidden="true">
              <div
                className="museum-org-preview-image"
                style={{
                  backgroundImage: `url("${preview}")`,
                }}
              />
              <span>{name}</span>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

const MuseumWall = dynamic(() => import('@/components/museum/museum-wall').then((module) => module.MuseumWall), {
  ssr: false,
  loading: () => <div className="museum-static">Loading the gallery.</div>,
})

export default function MuseumMockupPage() {
  const [selected, setSelected] = useState(DEFAULT_GALLERY_INDEX)
  const [showMoreProjects, setShowMoreProjects] = useState(false)
  const [showMoreFeed, setShowMoreFeed] = useState(false)
  const [experienceOpen, setExperienceOpen] = useState(true)
  const [organizationsOpen, setOrganizationsOpen] = useState(true)
  const [scrollHint, setScrollHint] = useState(1)
  const [atBottom, setAtBottom] = useState(false)
  const [pastStage, setPastStage] = useState(false)
  const [galleryReady, setGalleryReady] = useState(false)
  const reduced = useReducedMotion()
  useEffect(() => {
    const fallback = window.setTimeout(() => setGalleryReady(true), 4000)
    return () => window.clearTimeout(fallback)
  }, [])
  useEffect(() => {
    const update = () => {
      const lower = document.querySelector('.museum-columns')
      const stage = document.querySelector('.museum-stage')
      if (!lower) return
      const top = lower.getBoundingClientRect().top
      const start = window.innerHeight
      const end = window.innerHeight * 0.85
      setScrollHint(Math.max(0, Math.min(1, (top - end) / (start - end))))
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      setAtBottom(window.scrollY >= maxScroll - 48)
      setPastStage(!!stage && stage.getBoundingClientRect().bottom < 120)
    }
    const restore = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      if (window.scrollY > 0 && maxScroll - window.scrollY <= 48) window.scrollTo(0, maxScroll)
      update()
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const onPageShow = () => restore()
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('load', onPageShow)
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    const firstFrame = requestAnimationFrame(() => {
      restore()
      requestAnimationFrame(update)
    })
    const interval = window.setInterval(restore, 200)
    const stopRestoring = window.setTimeout(() => window.clearInterval(interval), 2500)
    const timers = [window.setTimeout(restore, 100), window.setTimeout(restore, 500), window.setTimeout(restore, 1200)]
    document.fonts?.ready.then(restore)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('load', onPageShow)
      observer.disconnect()
      cancelAnimationFrame(firstFrame)
      window.clearInterval(interval)
      window.clearTimeout(stopRestoring)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])
  const selectedItem = GALLERY[selected]

  return (
    <main id="top" className={`mock-museum${atBottom ? ' is-at-bottom' : ''}${pastStage ? ' is-past-stage' : ''}`} aria-busy={!galleryReady}>
      <style>{`
        html:has(.mock-museum), body:has(.mock-museum) { overflow-x: hidden !important; overflow-y: auto !important; background: #fff; }
        body:has(.mock-museum) { color: #000; }
        .mock-museum { min-height: 100dvh; padding: calc(10px + var(--site-top-gap)) clamp(20px, 4vw, 56px) 38px; font: 15px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .mock-museum * { box-sizing: border-box; }
        .museum-header { position: relative; z-index: 40; }
        .museum-top { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; max-width: 960px; margin: 0 auto; padding-bottom: 8px; }
        .museum-name-slot { visibility: hidden; font: 500 36px/40px "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: .0075em; }
        .museum-name { position: fixed; top: calc(10px + var(--site-top-gap)); left: max(clamp(20px, 4vw, 56px), calc((100vw - 960px) / 2)); z-index: 50; background: transparent; color: #000; font: 500 36px/40px "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: .0075em; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; }
        .museum-name:hover { color: #000; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .2em; text-decoration-color: #b25b3b; }
        .museum-nav { display: flex; gap: 6px; align-items: center; padding-top: 2px; }
        .museum-pill { display: inline-flex; align-items: center; justify-content: center; height: 25px; padding: 0 16px; border: 1px solid #000; border-radius: 0; color: #000; font: 400 13px/1 "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: 0; text-decoration: none; }
        .museum-pill.active { background: #000; color: #fff; }
        .museum-pill:not(.active) { border-color: #bbb; color: #555; }
        .museum-pill:hover, .museum-pill:focus-visible { text-decoration: none; }
        .museum-pill:not(.active):hover { border-color: #000; color: #000; }
        .museum-intro { max-width: 960px; margin: 0 auto 4px; }
        .museum-lede { max-width: 960px; margin: 0; text-wrap: balance; font: 500 clamp(24px, 3.1vw, 36px)/1.12 "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: -.02em; }
        .museum-year { display: inline-flex; align-items: center; justify-content: center; height: 25px; margin-right: .18em; padding: 0 14px; border-radius: 0; background: #000; color: #fff; font: 400 16px/1 "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: 0; vertical-align: middle; position: relative; top: -0.05em; }
        .museum-stage { position: relative; width: auto; max-width: none; height: calc(100svh - 180px); min-height: 340px; margin: 0 calc(50% - 50vw); background: #fff; overflow: visible; }
        .museum-canvas { position: relative; z-index: 0; filter: drop-shadow(12px 18px 24px rgba(0, 0, 0, 0.48)); transition: opacity .2s ease; }
        .mock-museum.is-at-bottom .museum-canvas { opacity: 0; }
        .museum-canvas:focus, .museum-canvas:focus-visible { outline: none; }
        .museum-static { display: grid; height: 100%; place-items: center; color: #666; font: 11px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-loading { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; background: #fff; color: #666; font: 500 20px/1.2 "Helvetica Neue", Helvetica, Arial, sans-serif; opacity: 1; transition: opacity .55s ease; }
        .museum-loading.is-ready { opacity: 0; pointer-events: none; }
        .museum-under { max-width: 960px; margin: 0 auto; }
        .museum-caption { position: absolute; left: 0; right: 0; bottom: 35px; z-index: 2; text-align: center; pointer-events: none; transition: opacity .2s ease; }
        .mock-museum.is-at-bottom .museum-caption,
        .mock-museum.is-past-stage .museum-caption { opacity: 0; }
        .museum-caption strong { display: block; color: #000; font: 400 16px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-caption span { display: block; color: #666; font: 400 14px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-top-fade { position: fixed; top: 0; left: 0; z-index: 30; width: 100vw; height: 120px; background: linear-gradient(to bottom, #fff 0%, #fff 75%, rgba(255,255,255,0) 100%); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .25s ease, visibility 0s .25s; }
        .museum-top-fade.is-visible { opacity: 1; visibility: visible; transition-delay: 0s; }
        .museum-top-hint { position: fixed; top: 14px; left: 50%; z-index: 45; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: #333; opacity: 0; visibility: hidden; transform: translateX(-50%); pointer-events: none; transition: opacity .25s ease, visibility 0s .25s; }
        .museum-top-hint.is-visible { opacity: 1; visibility: visible; pointer-events: auto; transition-delay: 0s; }
        .museum-top-hint svg { display: block; width: 22px; height: 22px; }
        .museum-scroll-hint { position: fixed; right: 0; bottom: 0; left: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; height: 96px; padding-bottom: 18px; color: #333; pointer-events: none; background: linear-gradient(to top, #fff 0%, rgba(255,255,255,.82) 24%, rgba(255,255,255,0) 100%); transition: opacity .2s ease; }
        .museum-scroll-hint span { display: block; width: 22px; height: 22px; animation: museum-scroll-bob 1.7s ease-in-out infinite; }
        .museum-scroll-hint svg { display: block; width: 22px; height: 22px; }
        @keyframes museum-scroll-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 6px; } }
        .museum-experience, .museum-organizations { max-width: 960px; margin-left: auto; margin-right: auto; }
        .museum-experience { margin-top: 48px; }
        .museum-organizations { margin-top: 26px; }
        .museum-section-head { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding-bottom: 6px; border-bottom: 1px solid #e3e3e3; cursor: pointer; }
        .museum-section-head:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
        .museum-section-head h2 { margin: 0; font: 400 18px/24px "Helvetica Neue", Helvetica, Arial, sans-serif; transition: color .18s ease; }
        .museum-section-toggle { width: 24px; height: 24px; position: relative; flex: 0 0 24px; color: #000; transition: color .18s ease; }
        .museum-section-head:hover h2, .museum-section-head:hover .museum-section-toggle { color: #666; }
        .museum-toggle-icon { display: block; position: absolute; top: 50%; left: 50%; width: 13px; height: 13px; transform: translate(-50%, -50%); }
        .museum-toggle-icon::before, .museum-toggle-icon::after { content: ""; display: block; position: absolute; top: 50%; left: 0; width: 13px; height: 1.5px; background: currentColor; transition: transform .3s cubic-bezier(.22,1,.36,1); }
        .museum-toggle-icon::before { transform: translateY(-50%); }
        .museum-toggle-icon::after { transform: translateY(-50%) rotate(90deg); }
        [aria-expanded="true"] .museum-toggle-icon::after { transform: translateY(-50%) rotate(0deg); }
        .museum-collapse { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .35s cubic-bezier(.22,1,.36,1), visibility 0s .35s; }
        .museum-collapse.open { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
        .museum-collapse-inner { overflow: hidden; }
        .museum-experience-row { display: grid; grid-template-columns: 220px minmax(0, 1fr) 180px; gap: 16px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #e3e3e3; }
        .museum-experience-title { display: flex; flex-direction: column; gap: 3px; }
        .museum-experience-title strong { font: 400 16px/1.3 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; }
        .museum-experience-role { font: 12px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #555; }
                .museum-org-tag { display: inline-block; margin-left: 6px; padding: 0 4px; border: 1px solid #bbb; color: #666; font: 400 9px/14px "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; text-decoration: none; vertical-align: 1px; transition: background .18s ease, color .18s ease, border-color .18s ease; }
        .museum-org-tag:hover, .museum-org-tag:focus-visible { border-color: #18181b; background: #18181b; color: #fff; outline: none; text-decoration: none; }
        .museum-org-preview { position: fixed; z-index: 100; width: 320px; height: 236px; padding: 6px; border: 1px solid #d7d7d7; background: #fff; box-shadow: 0 16px 44px rgba(0, 0, 0, .16); pointer-events: none; }
        .museum-org-preview-image { width: 100%; height: 190px; background-color: #f1f1f1; background-position: top center; background-size: cover; }
        .museum-org-preview > span { display: block; padding: 7px 2px 0; color: #555; font: 400 12px/1.3 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-experience-row p { margin: 0; font: 400 16px/1.45 "Helvetica Neue", Helvetica, Arial, sans-serif; color: #555; }
        .museum-experience-when { display: flex; flex-direction: column; gap: 1px; text-align: right; }
        .museum-experience-when time, .museum-experience-date { color: #000; font: 400 16px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; white-space: nowrap; }
        .museum-experience-when span { color: #666; font: 400 13px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif; white-space: nowrap; }
        .museum-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 960px; margin: 24px auto 0; padding-top: 0; }
        #projects, #feed, #experience { scroll-margin-top: 90px; }
        .museum-column { display: flex; flex-direction: column; min-width: 0; }
        .museum-column h2 { margin: 0; padding: 4px 0; border-bottom: 1px solid #e3e3e3; font: 400 18px/24px "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-column h2 a { color: inherit; text-decoration: none; }
        .museum-column h2 a:hover, .museum-column h2 a:focus-visible { text-decoration: underline; text-underline-offset: .18em; }
        .museum-list { margin: 0; padding: 0; list-style: none; }
        .museum-row { display: flex; justify-content: space-between; gap: 18px; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #e3e3e3; color: rgba(24, 24, 27, 0.55); font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-row-link { position: relative; display: flex; align-items: baseline; justify-content: space-between; gap: 10px; width: 100%; min-width: 0; padding-left: 0; color: inherit; text-decoration: none; transition: padding-left .3s cubic-bezier(.22,1,.36,1); }
        .museum-row-link::before { content: ""; position: absolute; left: 0; top: 50%; width: 14px; height: 14px; margin-top: -7px; background: #000; opacity: 0; transform: translateX(-14px); transition: opacity .22s ease, transform .3s cubic-bezier(.22,1,.36,1); }
        .museum-row-link > * { position: relative; z-index: 1; }
        .museum-row strong { font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; color: #000; }
        .museum-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .museum-row time, .museum-row-date { flex: 0 0 auto; color: #666; font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; transition: color .18s ease; }
        .museum-row-link:hover, .museum-row-link:focus-visible { padding-left: 24px; }
        .museum-row-link:hover::before, .museum-row-link:focus-visible::before { opacity: 1; transform: translateX(0); }
        .museum-row-link:hover time, .museum-row-link:focus-visible time, .museum-row-link:hover .museum-row-date, .museum-row-link:focus-visible .museum-row-date { color: #333; }
        .museum-project { border-bottom: 1px solid #e3e3e3; }
        .museum-project-head { display: flex; align-items: center; gap: 10px; }
        .museum-project-link { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 0 6px; flex: 1; min-width: 0; padding: 5px 0 5px 0; color: #666; text-decoration: none; transition: padding-left .3s cubic-bezier(.22,1,.36,1); }
        .museum-project-link::before { content: ""; position: absolute; left: 0; top: 50%; margin-top: -7px; width: 14px; height: 14px; background: #000; opacity: 0; transform: translateX(-14px); transition: opacity .22s ease, transform .3s cubic-bezier(.22,1,.36,1); }
        .museum-project-link:hover { padding-left: 24px; text-decoration: none; }
        .museum-project-link:hover::before { opacity: 1; transform: translateX(0); }
        .museum-project-title { color: #18181b; white-space: nowrap; font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-project-tag { display: inline-block; margin-left: 5px; padding: 0 3px; border: 1px solid #ccc; color: #666; font: 400 9px/13px "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: .06em; text-transform: uppercase; vertical-align: 1px; }
        .museum-project-summary { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #666; font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; transition: color .18s ease; }
        .museum-project-link:hover .museum-project-summary { color: #333; }
        .museum-project-link:focus-visible { outline: 2px solid #000; outline-offset: 2px; }
        .museum-project-toggle { width: 24px; height: 32px; position: relative; flex: 0 0 24px; display: flex; align-items: center; justify-content: center; padding: 0; border: 0; background: none; color: #777; cursor: pointer; }
        .museum-project-toggle .museum-toggle-icon, .museum-project-toggle .museum-toggle-icon::before, .museum-project-toggle .museum-toggle-icon::after { width: 11px; }
        .museum-project-toggle:focus-visible { outline: 2px solid #000; outline-offset: 2px; }
        .museum-project-detail-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s cubic-bezier(.22,1,.36,1); }
        .museum-project-detail-wrap.open { grid-template-rows: 1fr; }
        .museum-project-detail-wrap > div { overflow: hidden; }
        .museum-project-detail { max-width: 56ch; margin: 0 0 11px; color: #555; font: 400 13px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .museum-extra { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s cubic-bezier(.22,1,.36,1); }
        .museum-extra.open { grid-template-rows: 1fr; }
        .museum-extra > div { overflow: hidden; }
        .museum-more { display: inline-flex; gap: 4px; margin-top: 5px; padding: 0; border: 0; background: none; align-self: flex-start; color: #666; font: 400 16px/22px "Helvetica Neue", Helvetica, Arial, sans-serif; cursor: pointer; text-decoration: none; transition: color .18s ease; }
        .museum-more:hover { color: #000; }
        .museum-more:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
        .museum-foot { display: flex; justify-content: space-between; align-items: center; gap: 24px; max-width: 960px; margin: 72px auto 0; padding-top: 0; color: #62626a; font: 400 15px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: 0; text-transform: none; }
        .museum-foot a { color: inherit; text-decoration: underline; text-underline-offset: .18em; }
        .museum-foot a:hover { color: #18181b; }
        .museum-link:focus-visible, .museum-music:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
        .museum-music { display: flex; align-items: center; justify-content: flex-end; gap: 10px; max-width: 64%; color: #18181b; text-decoration: none; text-align: right; }
        .museum-music:hover { text-decoration: none; }
        .museum-music-copy { display: block; }
        .museum-music-label { color: #62626a; }
        .museum-music-title { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .18em; }
        .museum-music:hover .museum-music-title { color: #62626a; }
        .museum-music-art { width: 48px; height: 48px; flex: 0 0 48px; background-color: #eee; background-position: center; background-size: cover; }
        .museum-music-empty { color: #62626a; }
        @media (max-width: 800px) {
          .mock-museum { padding-top: calc(8px + var(--site-top-gap)); }
          .museum-top { flex-wrap: wrap; gap: 14px; padding-bottom: 16px; }
          .museum-name-slot { font-size: 21px; line-height: 24px; }
          .museum-name { top: calc(8px + var(--site-top-gap)); left: 20px; font-size: 21px; line-height: 24px; }
          .museum-nav { padding-top: 0; }
          .museum-pill { height: 24px; padding: 0 10px; font-size: 11px; }
          .museum-intro { margin-bottom: 4px; }
          .museum-lede { font-size: 21px; line-height: 1.15; letter-spacing: -.015em; }
          .museum-year { height: 18px; padding: 0 9px; font-size: 10px; }
          .museum-stage { height: 46vh; min-height: 280px; }
          .museum-caption { bottom: 7px; }
          .museum-scroll-hint, .museum-top-hint, .museum-top-fade { display: none; }
          .museum-experience-row { grid-template-columns: minmax(0, 1fr) auto; gap: 5px 14px; }
          .museum-experience-row p { grid-column: 1 / -1; grid-row: 2; }
          .museum-experience-when { grid-column: 2; grid-row: 1; }
          .museum-experience { margin-top: 40px; }
          .museum-organizations { margin-top: 24px; }
          .museum-columns { grid-template-columns: 1fr; gap: 30px; margin-top: 24px; }
          .museum-foot { flex-direction: column; align-items: flex-start; gap: 18px; margin-top: 52px; }
          .museum-music { max-width: 100%; justify-content: flex-start; text-align: left; }
          .museum-music-art { width: 40px; height: 40px; flex-basis: 40px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .museum-pill, .museum-more, .museum-toggle-icon::before, .museum-toggle-icon::after, .museum-collapse, .museum-project-link, .museum-project-detail-wrap, .museum-extra, .museum-loading, .museum-scroll-hint, .museum-top-hint, .museum-top-fade, .museum-caption, .museum-canvas, .museum-org-tag, .museum-row time, .museum-row-link, .museum-row-link::before, .museum-project-link::before, .museum-project-summary, .museum-section-head h2, .museum-section-toggle { transition: none; }
          .museum-scroll-hint span { animation: none; }
        }
      `}</style>

      <div className={`museum-loading${galleryReady ? ' is-ready' : ''}`} aria-hidden={galleryReady}>
        <span>Andrew Liu.</span>
      </div>

      <header className="museum-header">
        <div className="museum-top">
          <span className="museum-name-slot" aria-hidden="true">Andrew Liu.</span>
          <Link className="museum-name" href="/">Andrew Liu.</Link>
          <nav className="museum-nav" aria-label="Site sections">
            <a className="museum-pill active" href="#projects" aria-current="page">Work</a>
            <Link className="museum-pill" href="/feed/">Feed</Link>
            <Link className="museum-pill" href="/photo/">Photo</Link>
          </nav>
        </div>
      </header>

      <section className="museum-intro">
        <p className="museum-lede"><span className="museum-year">B.S. 2028</span> I’m a Computational Media student at Georgia Tech, building software, systems, and photographs.</p>
      </section>

      <section className="museum-stage" aria-label="Interactive gallery wall" data-count={GALLERY.length}>
        <MuseumWall items={GALLERY} selected={selected} onSelect={setSelected} reduced={reduced} fallbackClass="museum-static" onReady={() => setGalleryReady(true)} />
        <div className="museum-caption" aria-live="polite">
          <strong>{selectedItem.project}</strong>
          <span>{selectedItem.date}</span>
        </div>
      </section>

      <div className={`museum-top-fade${atBottom ? ' is-visible' : ''}`} aria-hidden="true" />
      <a className={`museum-top-hint${atBottom ? ' is-visible' : ''}`} href="#top" aria-label="Back to top" tabIndex={atBottom ? undefined : -1}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 10.5 8 5.5 13 10.5" /></svg>
      </a>

      <div className="museum-scroll-hint" style={{ opacity: scrollHint }} aria-hidden={scrollHint < 0.1} role="img" aria-label="Scroll down for more">
        <span aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5.5 8 10.5 13 5.5" /></svg></span>
      </div>

      <div className="museum-under">
        {/* Temporary layout iteration: Projects/Feed first, Experience/Organizations collapsed below. */}
        <section className="museum-columns" aria-label="Projects and notes">
          <div className="museum-column" id="projects">
            <h2>Projects</h2>
            <ul className="museum-list" id="projects-list">
              {PROJECTS.map((project) => <ProjectRow key={project.title} project={project} />)}
            </ul>
            <div className={`museum-extra${showMoreProjects ? ' open' : ''}`} id="projects-more">
              <div>
                <ul className="museum-list">
                  {MORE_PROJECTS.map((project) => <ProjectRow key={project.title} project={project} />)}
                </ul>
              </div>
            </div>
            <button className="museum-more" type="button" aria-expanded={showMoreProjects} aria-controls="projects-more" onClick={() => setShowMoreProjects((value) => !value)}>
              {showMoreProjects ? 'Less' : 'More'} <span aria-hidden="true">{showMoreProjects ? '↑' : '↓'}</span>
            </button>
          </div>
          <div className="museum-column" id="feed">
            <h2><Link href="/feed/">Feed</Link></h2>
            <ul className="museum-list" id="feed-list">
              {FEED_DEFAULT.map((entry) => <FeedRow key={`${entry.title}-${entry.date}`} entry={entry} />)}
            </ul>
            <div className={`museum-extra${showMoreFeed ? ' open' : ''}`} id="feed-more">
              <div>
                <ul className="museum-list">
                  {FEED_MORE.map((entry) => <FeedRow key={`${entry.title}-${entry.date}`} entry={entry} />)}
                </ul>
              </div>
            </div>
            <button className="museum-more" type="button" aria-expanded={showMoreFeed} aria-controls="feed-more" onClick={() => setShowMoreFeed((value) => !value)}>
              {showMoreFeed ? 'Less' : 'More'} <span aria-hidden="true">{showMoreFeed ? '↑' : '↓'}</span>
            </button>
          </div>
        </section>

        <section id="experience" className="museum-experience" aria-labelledby="museum-experience-title">
          <div
            className="museum-section-head"
            role="button"
            tabIndex={0}
            aria-expanded={experienceOpen}
            aria-controls="experience-list"
            aria-label={experienceOpen ? 'Collapse experience' : 'Expand experience'}
            onClick={() => setExperienceOpen((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setExperienceOpen((value) => !value)
              }
            }}
          >
            <h2 id="museum-experience-title">Experience</h2>
            <span className="museum-section-toggle" aria-hidden="true"><span className="museum-toggle-icon" /></span>
          </div>
          <div className={`museum-collapse${experienceOpen ? ' open' : ''}`} id="experience-list" aria-hidden={!experienceOpen}>
            <div className="museum-collapse-inner">
              {EXPERIENCE.map((item) => (
                <article className="museum-experience-row" key={`${item.company}-${item.role}-${item.date}`}>
                  <div className="museum-experience-title">
                    <strong>{item.company}</strong>
                    <span className="museum-experience-role">{item.role}</span>
                  </div>
                  <p>{item.note}</p>
                  <div className="museum-experience-when">
                    <span className="museum-experience-date">{item.date}</span>
                    <span>{item.mode} – {item.location}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="organizations" className="museum-organizations" aria-labelledby="museum-organizations-title">
          <div
            className="museum-section-head"
            role="button"
            tabIndex={0}
            aria-expanded={organizationsOpen}
            aria-controls="organizations-list"
            aria-label={organizationsOpen ? 'Collapse organizations' : 'Expand organizations'}
            onClick={() => setOrganizationsOpen((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setOrganizationsOpen((value) => !value)
              }
            }}
          >
            <h2 id="museum-organizations-title">Organizations</h2>
            <span className="museum-section-toggle" aria-hidden="true"><span className="museum-toggle-icon" /></span>
          </div>
          <div className={`museum-collapse${organizationsOpen ? ' open' : ''}`} id="organizations-list" aria-hidden={!organizationsOpen}>
            <div className="museum-collapse-inner">
              {ORGANIZATIONS.map((item) => (
                <article className="museum-experience-row" key={`${item.company}-${item.role}-${item.date}`}>
                  <div className="museum-experience-title">
                    <strong>{item.company}</strong>
                    <span className="museum-experience-role">{item.role}{item.orgUrl ? <OrgTag href={item.orgUrl} name={item.company} preview={item.orgPreview ?? ''} focusable={organizationsOpen} /> : null}</span>
                  </div>
                  <p>{item.note}</p>
                  <div className="museum-experience-when">
                    <span className="museum-experience-date">{item.date}</span>
                    <span>{item.mode} – {item.location}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      </div>

      <footer className="museum-foot">
        <span>aandrx on <a href="https://github.com/aandrx">GitHub</a></span>
        <SpotifyStatus />
      </footer>
    </main>
  )
}
