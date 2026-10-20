# aandrx.github.io

Personal portfolio and photo journal. Live at [aandrx.vercel.app](https://aandrx.vercel.app/).

[![Continuous Integration](https://github.com/aandrx/aandrx.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/aandrx/aandrx.github.io/actions/workflows/ci.yml)

## Stack

- Next.js 15 App Router, React 18 and TypeScript
- Tailwind CSS plus route-specific stylesheets
- Prisma with PostgreSQL on Neon for contact, RSVP and newsletter data
- Cloudflare R2 for photo delivery
- Sharp for build-time image metadata and colour analysis

## Local development

Requirements: Node 20.9 or newer, npm and curl. Firefox is downloaded automatically by the isolated browser test.

```bash
npm install
cp .env.example .env.local
npx prisma generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Public pages use generated image data and do not need a database connection. Fill in `.env.local` only when working on the API routes.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run metadata, publisher and route-policy tests without network access |
| `npm run test:browser` | Run the browser suite against an existing site and BiDi Firefox |
| `npm run test:browser:ci` | Build and test an isolated production copy, then clean up |
| `npm run images:generate` | Refresh generated image metadata and post palettes |

## Image pipeline

Photos are hosted on R2 in matching 720w and 1920w WebP variants. The site reads dimensions, colours and content revisions from generated data, so pages never download an image just to measure it.

1. Upload both variants to the registered folder.
2. Add the folder and filenames to `src/data/image-sources.json`.
3. Select photos in the project page and in `src/data/feed-posts.json`.
4. Run `npm run images:generate`.
5. Run `npm test` and the browser gate before deploying.

Use `npm run images:generate -- --refresh` after replacing the contents of existing R2 object names. Generated files must not be edited by hand:

- `src/data/image-metadata.json`
- `src/data/image-analysis.json`
- `src/data/post-palettes.json`

See [explanations/IMAGE_LOADING.md](explanations/IMAGE_LOADING.md) for the loading strategy, ownership boundaries and publisher recovery behaviour.

## Testing

`npm test` covers image metadata, feed selections, palette parity, publisher cache recovery and the route-level image probe rule. It uses local fixtures and never calls R2.

`npm run test:browser:ci` builds an isolated copy of the site, serves it on a free loopback port, launches a disposable Firefox with its own profile, and removes everything afterwards. It covers first paint, pending text, short viewports, nearby image loading, retry behaviour, carousel navigation, focus handling, mobile layout and the colour API. Browser images are deterministic fixtures by default; set `LIVE_IMAGES=1` for an optional live R2 smoke test.

For manual browser testing, run the site and a Firefox instance with WebDriver BiDi enabled separately, then set `BROWSER_WS_ENDPOINT` and optionally `SITE_URL` before running `npm run test:browser`.

## CI and deployment

`.github/workflows/ci.yml` runs on pushes, pull requests, a daily schedule and manual dispatch:

- `build` runs ESLint, TypeScript, the test suite and a production build with dummy database URLs.
- `browser` runs the isolated production browser gate with a cached Firefox build.

`.github/workflows/codeql.yml` runs GitHub CodeQL security analysis on pushes, pull requests and a weekly schedule. `.github/workflows/dependency-review.yml` checks pull requests for high-severity dependency changes. Dependabot checks npm and GitHub Actions weekly, grouping npm minor and patch updates.

Vercel deploys from `main`. Production promotion waits for the `build`, `browser` and `Analyze JavaScript and TypeScript` Deployment Checks. The legacy GitHub Pages site is not updated. The public `images.unoptimized` setting keeps remote R2 variants on their own URLs instead of routing them through the Next image optimizer.

## Project layout

- `src/app` contains routes and page styles.
- `src/components` contains shared gallery, carousel, image and layout components.
- `src/lib` contains image resolution, feed and column helpers.
- `src/data` contains authored registries plus generated image data.
- `scripts` contains image publishing and isolated browser test runners.
- `tests` contains unit, policy and browser regression tests.
- `explanations` contains longer design and operations notes.

---

*ib ziyile*
