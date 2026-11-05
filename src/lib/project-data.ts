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
    detail: 'An experimental TUI messenger built on an existing OpenBubbles registration, with local history and automatic engine recovery.',
  },
  {
    title: 'sink',
    slug: 'sink',
    repo: 'https://github.com/aandrx/sink',
    summary: 'Obsidian sync, conflicts, and diffs',
    detail: 'A small sync layer with conflict detection and file-level diffs.',
  },
  {
    title: 'Shend',
    slug: 'shend',
    repo: 'https://github.com/aandrx/shend',
    summary: 'A Discord video compressor',
    detail: 'A self-hosted bot that compresses large videos and returns inline embeds or direct downloads.',
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
    summary: 'Medical supply chain platform',
    detail: 'A GT Bits of Good client project for medical supply distribution and partner coordination.',
    tag: 'Client',
  },
  {
    title: 'Loom',
    slug: 'loom',
    repo: 'https://github.com/aandrx/Loom',
    summary: 'Escrow payments and autonomous agents',
    detail: 'Escrow state transitions, agent coordination, and a typed payment ledger.',
  },
  {
    title: 'HarmonyAPI',
    slug: 'harmonyapi',
    repo: 'https://github.com/aandrx/harmonyAPI',
    summary: 'Healthcare literature retrieval',
    detail: 'A compact API surface for literature retrieval and ranked passages.',
  },
  {
    title: 'palace-tui',
    slug: 'palace-tui',
    repo: 'https://github.com/aandrx/palace-tui',
    summary: 'A terminal knowledge graph',
    detail: 'Keyboard-first navigation for a local knowledge graph.',
  },
]

export const MORE_PROJECTS: ProjectItem[] = [
  {
    title: 'Continuum',
    slug: 'continuum',
    repo: 'https://github.com/aandrx/continuum',
    summary: 'Vue and Kubernetes dashboard',
    detail: 'A small operational dashboard for services and cluster state.',
  },
  {
    title: 'Ina',
    slug: 'ina',
    repo: 'https://github.com/aandrx/ina-bot',
    summary: 'A small automation bot',
    detail: 'A compact bot for repetitive tasks and small workflow experiments.',
  },
  {
    title: 'Spendwise',
    slug: 'spendwise',
    repo: 'https://github.com/aandrx/spendwise-pages',
    summary: 'A personal finance prototype',
    detail: 'A spending tracker built around a small, clear data model.',
  },
  {
    title: 'Sophitia',
    slug: 'sophitia',
    repo: 'https://github.com/aandrx/sophitia',
    summary: 'An experimental web project',
    detail: 'A place for interaction experiments and unfinished interface ideas.',
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
