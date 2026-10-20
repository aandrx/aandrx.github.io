# Portfolio image loading

## What visitors see

- Project titles, descriptions and fixed-size photo slots render without waiting for image downloads.
- The first project photo is eager. Other photos become eligible within half a viewport of the visible region, horizontally or vertically.
- The feed uses independent 720w covers. Changing a cover does not reorder a carousel.
- A carousel immediately lays out every slide using published dimensions. Only visible and nearby photos are requested. Direct scrubbing, arrow keys, Home/End, wheel and dragging work before the photos load.
- Photos fade independently. Gallery and feed covers use a slower 600ms entrance, while carousel slides keep a 240ms fade so navigation stays responsive. A slow or failed image never blocks another image. Unloaded slots reserve their final geometry without painting a grey block, so photos appear from the page background rather than flashing a placeholder. Failed photos and downloads exceeding 30 seconds have a retry action. Reduced-motion preferences disable transitions.
- The active color dot and whole-post palette are available immediately. Browsing does not call the color API.

## Image delivery

`PortfolioImage` supplies explicit `srcSet` candidates from the existing R2 720w and 1920w files. Its `sizes` describes the height-based gallery/carousel layout so browsers account for actual displayed width and device pixel ratio. Grid thumbnails deliberately use 720w only.

The global Next optimizer remains disabled. These remote assets do not need another resize service. Local Home/About images keep their existing Next Image behavior.

## Publishing and curation

1. Upload the 720w and 1920w variants to the registered R2 bucket.
2. Add their folder/filenames to `src/data/image-sources.json`.
3. Set page selections in their `src/app/works/.../page.tsx` files. Set feed selection, order, independent cover and text in `src/data/feed-posts.json`.
4. Run `npm run images:generate` and `npm test` before deploying.

The publishing script needs Node, curl and sharp. It downloads with finite retries, timeouts and size limits and runs four image-analysis jobs at a time. Normal regeneration reuses completed analysis and does not download unchanged registered images again. An incomplete run leaves the published manifests unchanged, with successful analysis retained in an ignored local cache. Cache entries are written through a unique temporary file and renamed into place, and a truncated cache entry is treated as a miss, so an interrupted earlier run cannot block the next one.

When **replacing the contents of existing R2 object names**, run the generator with its `--refresh` option. This recomputes content revisions and prevents the new deployment from reusing old image URLs. Refresh ignores prior analysis and the local cache entirely, so it also recovers when either was left malformed by an interrupted run. Prefer new filenames for new edits when possible. This does not configure R2's Cache-Control policy; bucket/CDN cache policy is managed separately.

### Generated files: do not edit by hand

- `src/data/image-metadata.json`: verified dimensions, variants, content revisions and per-image colors. This small manifest is safe for client use.
- `src/data/image-analysis.json`: per-image color histograms used for curation and the server compatibility API. Never import this into a client component.
- `src/data/post-palettes.json`: whole-post palettes plus their exact ordered image selections. A changed feed selection without regeneration raises an explicit publishing error instead of silently showing stale colors.

The generator samples the same variant and uses the same scoring rules as the previous runtime API. Keeping quantized histograms preserves whole-post palette behavior when photos are added, removed or reordered. Only final metadata and palettes are needed by the browser; histograms and sharp stay out of the client bundle.

## Component responsibilities

- `ProjectGallery`: shared server-rendered page structure; no image-preloading effect. It normalizes descriptions into plain paragraph strings before the client boundary, so streamed React child elements cannot be omitted by client-side text extraction.
- `PortfolioImage`: responsive variants, nearby eligibility, independent fade, failure/retry, and early/cached-load recovery.
- `FeedGallery`: accessible thumbnail buttons and selected post; portals the dialog outside the background.
- `FeedCarousel`: local navigation/pointer state, fixed filmstrip geometry, lookahead, resize handling, focus containment/return, inert background and scroll locking.
- `DynamicColumns`: measures only when paragraph text, dimensions or viewport change. The unmeasured server-rendered copy is height-constrained, clipped and hidden until its paragraphs are distributed; the wrapper contains the finished floated columns. A layout is ready only when its measured paragraph signature matches the current text. Titles and photo slots do not wait on this text-only measurement. Callback/JSX identity changes do not trigger repeated text layout during carousel interaction.

Native image requests already in flight cannot always be canceled reliably. The implementation stops scheduling distant photos, unmounts pending slide images when leaving their window, and disposes the carousel on close. There are no abandoned remote-analysis requests to cancel.

`/api/post-colors` remains a compatibility endpoint for registered assets. It combines published histograms without fetching any URLs. Unknown origins/assets, excessively large bodies and lists over 64 URLs are rejected. It does not require a process-local cache or sharp on the request path.

## Verification

`npm test` verifies registry coverage, variant geometry, revisions, color validity, image selections, curation and parity with the previous palette scoring algorithm. It also runs the publisher cache-recovery fixtures and checks the route-level image-probe lint rule. CI runs it alongside lint, type checking and a production build.

For the browser regression test, start the site and a disposable Firefox with WebDriver BiDi enabled separately. Set `BROWSER_WS_ENDPOINT` to its session endpoint, optionally set `SITE_URL`, and run `npm run test:browser`. The runner creates and closes its own browser context; it never starts/stops the browser or web server.

`npm run test:browser:ci` is the self-contained gate: it builds an isolated temporary copy with dummy database settings, serves it on a free loopback port, launches a disposable Firefox with its own profile, and always removes the server, browser and temporary files. It never writes to the working tree's `.next` or touches a running developer server. CI runs this gate in a separate job with a cached Firefox build. The runner downloads the verified stable build pinned in `scripts/run-browser-tests.mjs`; set `FIREFOX_BIN` to use an already installed Firefox locally, or `PUPPETEER_FIREFOX_BUILD_ID` to try a different build.

The browser test holds all R2 requests to prove the modal and colors do not depend on image completion. It then supplies tiny, correctly proportioned WebP fixtures so regressions are reproducible without depending on CDN availability. It verifies nearby-only requests, keyboard/wheel/drag/scrub navigation, distant jumps, focus restoration, no text remeasurement during carousel navigation, an aborted request and retry, mobile layout, preservation across responsive resizing and API input limits. It also holds hydration, checks that pending text is clipped without hiding the title, splits the Starry Night descriptions at a 1280x300 viewport, and requires any paragraph below the layout bottom to be reachable by scrolling; an injected oversized paragraph proves the same containment contract. Set `LIVE_IMAGES=1` for an optional smoke test against the actual R2 files. Publishing generation separately validates and analyzes the real remote variants.

Do not run `next build` in the same output directory as a running `next dev` process. For parallel verification, build an isolated source copy so the developer's `.next` chunks remain untouched.
