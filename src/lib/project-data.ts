export type ProjectItem = {
  title: string
  repo: string
  summary: string
  detail: string
  tag?: string
}

export const PROJECTS: ProjectItem[] = [
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

export const MORE_PROJECTS: ProjectItem[] = [
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

export const PROJECT_GROUPS = [
  { title: 'Selected work', entries: PROJECTS },
  { title: 'More work', entries: MORE_PROJECTS },
]
