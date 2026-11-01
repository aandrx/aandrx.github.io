export type FeedEntry = {
  title: string
  date: string
  dateTime?: string
  href: string
  external?: boolean
}

export type FeedLink = {
  label: string
  href: string
}

export type FeedPost = {
  slug: string
  title: string
  date: string
  dateTime: string
  body: string[]
  links?: FeedLink[]
  image?: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
}

export const FEED_LINKS: FeedEntry[] = [
  {
    title: 'rue-stack',
    date: 'Oct 2026',
    dateTime: '2026-10-29',
    href: 'https://github.com/aandrx/dotfiles/tree/main/.pi/agent/packages/rue-stack',
    external: true,
  },
  {
    title: 'dotfiles',
    date: 'Oct 2026',
    dateTime: '2026-10-31',
    href: 'https://github.com/aandrx/dotfiles',
    external: true,
  },
]

export const FEED_POSTS: FeedPost[] = [
  {
    slug: 'on-small-tools',
    title: 'On small tools',
    date: 'Oct 2026',
    dateTime: '2026-10-01',
    body: [
      'palace-tui is a terminal interface for a local knowledge graph. It opens into a list of nodes, and the keyboard moves between searching, opening a node, and following a connection.',
      'The tool does not try to be a full editor. It reads a local graph and shows the neighboring nodes.',
      'The interaction depends on key handling and focus state. A terminal has no pointer to fall back on, so every state has to be visible in the prompt, the selection, or the line above it.',
    ],
    links: [{ label: 'palace-tui repository', href: 'https://github.com/aandrx/palace-tui' }],
  },
  {
    slug: 'the-useful-part-of-a-prototype',
    title: 'The useful part of a prototype',
    date: 'Sep 2026',
    dateTime: '2026-09-01',
    body: [
      'The useful part of Webby is the rule for when a note should appear. The note has to stay with a Chrome tab or a Mac window and survive a switch to another app.',
      'The attachment rule is the part that needed testing. Once the note followed the right window, the rest of the interface could stay plain: a short text field, a small list, and a close action.',
      'The repository is still a work in progress. The current build tests the attachment rule, not the final product.',
    ],
    links: [{ label: 'Webby repository', href: 'https://github.com/jynlee7/webby' }],
  },
  {
    slug: 'what-i-keep-returning-to',
    title: 'What I keep returning to',
    date: 'Aug 2026',
    dateTime: '2026-08-01',
    image: '/museum/works/nightfind-2025.webp',
    imageAlt: 'Nightfind 2025, a collection cover from the Museum gallery.',
    imageWidth: 1920,
    imageHeight: 1371,
    body: [
      'Nightfind 2025 collects photographs from three walks: January 15 to 31, August 11 to 17, and September 18. The set is about exposure and the small amount of color that remains after dark.',
      'Most frames use a streetlight or a window as the main light source. The edit keeps blacks deep and leaves the brightest area unmasked.',
      'The collection is on the photography side of the site. The set depends on steady hands, a wide aperture, and enough patience to wait for the light to settle.',
    ],
    links: [{ label: 'Nightfind 2025 collection', href: '/photo/works/nightfind-2025/' }],
  },
  {
    slug: 'notes-on-restraint',
    title: 'Notes on restraint',
    date: 'Jul 2026',
    dateTime: '2026-07-01',
    body: [
      'HarmonyAPI searches a set of healthcare papers and returns ranked passages. The API has one job: accept a query and return passages with enough context to check the source.',
      'The response keeps the passage, the paper title, and the rank close together, so a caller can display a result without another lookup.',
      'The endpoint returns the evidence once. It does not return a second copy in a different shape.',
    ],
    links: [{ label: 'HarmonyAPI repository', href: 'https://github.com/aandrx/harmonyAPI' }],
  },
  {
    slug: 'a-place-for-unfinished-work',
    title: 'A place for unfinished work',
    date: 'Jun 2026',
    dateTime: '2026-06-01',
    body: [
      'Sophitia is a place for interface experiments that are not ready to become products. It holds small interaction studies, half-built screens, and notes about what did not work.',
      'The repository is intentionally unfinished. A sketch can stay in the history after the idea stops being useful, which makes it easier to compare one attempt with the next.',
      'Spendwise and Ina live in the same part of the work: small tools with a narrow job. None of them needs a launch page to be worth keeping.',
    ],
    links: [{ label: 'Sophitia repository', href: 'https://github.com/aandrx/sophitia' }],
  },
  {
    slug: 'photographing-empty-rooms',
    title: 'Photographing empty rooms',
    date: 'May 2026',
    dateTime: '2026-05-01',
    image: '/museum/works/wingspan.webp',
    imageAlt: 'Wingspan, a collection cover from the Museum gallery.',
    imageWidth: 1920,
    imageHeight: 2688,
    body: [
      'Wingspan began in transit. The empty rooms in the set are airport terminals, concourses, and streets between flights, with the frame set by whatever the trip made available.',
      'Most frames were made while waiting: before a flight, after landing, or beside a window. The camera points away from the center of the action, toward the frames around it.',
      'The collection is made from trips in November 2024, January 2025, June 2026, and January 2026. The dates are part of the work because the light and the routes changed between them.',
    ],
    links: [{ label: 'Wingspan collection', href: '/photo/works/wingspan/' }],
  },
  {
    slug: 'a-smaller-interface',
    title: 'A smaller interface',
    date: 'Apr 2026',
    dateTime: '2026-04-01',
    body: [
      'Continuum is a dashboard for services and cluster state. The first screen should show what is running and what needs attention.',
      'The interface uses a small set of rows and a status label. There is no second navigation layer for the same data, and no chart unless the chart changes a decision.',
      'The Vue front end talks to the cluster through a narrow set of API calls. Keeping that list short makes the screens and the failure states easier to follow.',
    ],
    links: [{ label: 'Continuum repository', href: 'https://github.com/aandrx/continuum' }],
  },
  {
    slug: 'notes-from-a-build',
    title: 'Notes from a build',
    date: 'Mar 2026',
    dateTime: '2026-03-01',
    body: [
      'Shend compresses large videos for Discord. The bot accepts a file, runs the encoder, and returns either an inline embed or a download link when the result is too large for the player.',
      'A job can fail at upload, at encoding, or at delivery. The bot needs to keep those states separate so a retry does not start from the beginning.',
      'The repository is self-hosted. That choice adds setup work, but it keeps processing and files on the machine running the bot.',
    ],
    links: [{ label: 'Shend repository', href: 'https://github.com/aandrx/shend' }],
  },
  {
    slug: 'unfinished-on-purpose',
    title: 'Unfinished, on purpose',
    date: 'Feb 2026',
    dateTime: '2026-02-01',
    body: [
      'Loom is an escrow prototype with a typed payment ledger and a small set of agent roles. The state machine is the part that matters: funds move only when the ledger records a valid transition.',
      'The repository is not finished. The state names and transition rules are public; the agent coordination is still under test.',
      'The product question is not settled yet. Keeping the ledger and states readable is more useful right now than adding another demo path.',
    ],
    links: [{ label: 'Loom repository', href: 'https://github.com/aandrx/Loom' }],
  },
]

const toEntry = (post: FeedPost): FeedEntry => ({
  title: post.title,
  date: post.date,
  dateTime: post.dateTime,
  href: `/feed/${post.slug}/`,
})

export const FEED_DEFAULT: FeedEntry[] = [
  ...FEED_LINKS,
  ...FEED_POSTS.slice(0, 3).map(toEntry),
]

export const FEED_MORE: FeedEntry[] = FEED_POSTS.slice(3).map(toEntry)

export const FEED_ENTRIES: FeedEntry[] = [
  ...FEED_LINKS,
  ...FEED_POSTS.map(toEntry),
].sort((a, b) => (b.dateTime ?? '').localeCompare(a.dateTime ?? ''))

export function getFeedPost(slug: string): FeedPost | undefined {
  return FEED_POSTS.find((post) => post.slug === slug)
}

export function getNextFeedPost(slug: string): FeedPost | undefined {
  const index = FEED_POSTS.findIndex((post) => post.slug === slug)
  return index >= 0 ? FEED_POSTS[index + 1] : undefined
}
