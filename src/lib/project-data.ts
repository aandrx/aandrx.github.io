export type ProjectItem = {
  slug: string
  title: string
  repo: string
  summary: string
  detail: string
  tag?: string
}

export const PROJECTS: ProjectItem[] = [
  {
    slug: 'bloom',
    title: 'Bloom',
    repo: 'https://github.com/aandrx/bloom',
    summary: 'A keyboard-first terminal messenger',
    detail: 'An experimental, source-only TUI messenger built on an existing OpenBubbles registration, with local history and automatic engine recovery.',
  },
  {
    title: 'sink',
    slug: 'sink',
    repo: 'https://github.com/aandrx/sink',
    summary: 'Obsidian sync with conflict review',
    detail: 'A self-hosted, CouchDB-backed Obsidian sync tool with explicit conflict review and recovery controls. Its stability notes currently recommend keeping the release disabled in a live vault.',
  },
  {
    title: 'Shend',
    slug: 'shend',
    repo: 'https://github.com/aandrx/shend',
    summary: 'A self-hosted Discord video compressor',
    detail: 'A bot that compresses large videos for Discord, with cleanup and failure handling. It was historically run on a home server; current operation is unverified.',
  },
  {
    title: 'Webby',
    slug: 'webby',
    repo: 'https://github.com/jynlee7/webby',
    summary: 'Sticky notes for Mac apps and Chrome',
    detail: 'A work-in-progress notes tool that stays attached to apps and exact web pages.',
  },
  {
    title: 'Hope for Haiti',
    slug: 'hope-for-haiti',
    repo: 'https://github.com/GTBitsOfGood/hope-for-haiti',
    summary: 'Medical supply pricebook workflows',
    detail: 'A GT Bits of Good client project where I worked on pricebook workflows, CSV review, stale-price handling, and normalized NDC and UPC data.',
    tag: 'Client',
  },
  {
    title: 'Loom',
    slug: 'loom',
    repo: 'https://github.com/aandrx/Loom',
    summary: 'Escrow payments and autonomous agents',
    detail: 'A HackNYU 2025 hackathon prototype exploring escrow state transitions, agent coordination, and a typed payment ledger.',
  },
  {
    title: 'HarmonyAPI',
    slug: 'harmonyapi',
    repo: 'https://github.com/aandrx/harmonyAPI',
    summary: 'Healthcare literature retrieval',
    detail: 'A hackathon API prototype combining PubMed retrieval, summaries, and rule-based risk scoring. Its public demo endpoint was unavailable when last checked.',
  },
  {
    title: 'palace-tui',
    slug: 'palace-tui',
    repo: 'https://github.com/aandrx/palace-tui',
    summary: 'A terminal knowledge graph prototype',
    detail: 'Markdown ingestion, SQLite storage, and keyboard-first browsing. Graph rendering and NLP features remain unfinished.',
  },
]

export const MORE_PROJECTS: ProjectItem[] = [
  {
    title: 'Animal Training App',
    slug: 'animal-training-app',
    repo: 'https://github.com/BoG-Developer-Bootcamp-Spring-26/project3-s26-hork',
    summary: 'A Bits of Good animal training manager',
    detail: 'A team-built animal training management app from the Bits of Good developer bootcamp. Owners manage animal profiles and training logs; admins review users, animals, and training activity. Built with Next.js, TypeScript, MongoDB, JWT authentication, and Argon2 password hashing.',
  },
  {
    title: 'Continuum',
    slug: 'continuum',
    repo: 'https://github.com/aandrx/continuum',
    summary: 'A personal kanban prototype',
    detail: 'A Vue and Flask kanban prototype with Pinia, SQLite, and a localStorage fallback. Authentication and external integrations are planned, not implemented.',
  },
  {
    title: 'Ina',
    slug: 'ina',
    repo: 'https://github.com/aandrx/ina-bot',
    summary: 'An unfinished Discord bot',
    detail: 'An early Discord bot with prefix commands, slash commands, UI components, and a partially completed migration to cogs. It has been dormant since 2023.',
  },
  {
    title: 'Spendwise',
    slug: 'spendwise',
    repo: 'https://github.com/aandrx/spendwise-pages',
    summary: 'Team Android budgeting coursework',
    detail: 'A Georgia Tech CS 2340 team Android budgeting app, documented through a separate Next.js showcase site. I worked on frontend and UX; the Android app itself is not in the public repository.',
  },
  {
    title: 'Sophitia',
    slug: 'sophitia',
    repo: 'https://github.com/aandrx/sophitia',
    summary: 'An After Effects layer helper',
    detail: 'A single-file After Effects ScriptUI panel for adjustment layers, null parenting, time remap, and single-frame layer work. It is a dormant 2023 script.',
  },
]

export const PROJECT_ENTRIES: ProjectItem[] = [...PROJECTS, ...MORE_PROJECTS]

export function getProject(slug: string): ProjectItem | undefined {
  return PROJECT_ENTRIES.find((project) => project.slug === slug)
}

export function getNextProject(slug: string): ProjectItem | undefined {
  const index = PROJECT_ENTRIES.findIndex((project) => project.slug === slug)
  return index >= 0 ? PROJECT_ENTRIES[index + 1] : undefined
}

export const PROJECT_GROUPS = [
  { title: 'Selected work', entries: PROJECTS },
  { title: 'More work', entries: MORE_PROJECTS },
]
