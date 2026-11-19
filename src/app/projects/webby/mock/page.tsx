import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ProjectsTop from '../../projects-top'
import '../../../feed/feed.css'
import '../../../feed/[slug]/feed-article.css'
import '../../project-article.css'
import './webby-mock.css'

export const metadata: Metadata = {
  title: 'Webby draft · Andrew Liu',
  robots: { index: false, follow: false },
}

const facts = [
  ['Status', 'Work in progress, no release'],
  ['Team', 'Built with Jayden Lee'],
  ['Stack', 'Swift, AppKit, Chrome extension'],
  ['Target', 'macOS 14+, universal'],
]

export default function WebbyMockPage() {
  return (
    <main className="feed-page feed-article webby-mock">
      <ProjectsTop />

      <article className="feed-article-main">
        <p className="project-mock-label">Draft project page for review. Not linked from Projects yet.</p>

        <header className="feed-article-head">
          <p className="project-kicker">macOS app · Work in progress · Team project</p>
          <h1>Webby</h1>
          <p className="feed-article-date">Sticky notes that stay attached to the app or the web page you left them on.</p>
        </header>

        <div className="project-status-note webby-media-note">
          <strong>No app build has been published</strong>
          <p>The two images on this page are captures of Webby's public design-direction site, not the app. A runtime capture is requested in issue #68.</p>
        </div>

        <figure className="feed-figure project-hero">
          <Image
            src="/projects/webby/design-hero.png"
            alt="The Webby skin directions page, showing a glass lens over the word webby and the headline One note. Any skin."
            width={1440}
            height={1100}
            sizes="(max-width: 720px) 100vw, 664px"
            priority
          />
          <figcaption>The public skin-direction page. The glass lens is a live canvas on that site; this is not a screenshot of Webby itself.</figcaption>
        </figure>

        <div className="feed-body">
          <p className="project-lede">Webby puts a note over the app or page that owns it, and puts it back when you return. The note is not pinned to a screen coordinate. It is pinned to a window, a browser tab, or a path on a site.</p>

          <dl className="project-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2>Where a note belongs</h2>
          <p>An app note follows its window. Webby reads the focused window's frame through macOS Accessibility and places notes relative to it, so moving or resizing the window keeps the note in context. Without that permission, notes still work, but at fixed screen positions.</p>
          <p>A web note is stricter. It needs a focused Chrome window whose Accessibility bounds match the bounds the extension reported. When those do not agree, Webby falls back to Chrome's app context: the web notes hide and Chrome app notes stay at their stored offsets rather than floating over the wrong page.</p>
          <p>That fallback is the design. Showing the previous page's notes over a private window would be worse than showing nothing.</p>

          <h2>The browser is the hard part</h2>
          <p>Chrome does not expose a stable, synchronous answer to “which page is in front.” Webby uses a small extension and a native messaging host to receive tab inventories, activations, URL updates, navigation, and closure. A note can stick to one page, a parent path, a whole site, or the Chrome app.</p>
          <p>Tab identity survives more than a navigation. A relaunched Webby asks for an inventory so notes on already-open tabs are not lost, and tab notes are designed to come back after a Chrome restart or a session restore. Incognito is handled separately: with extension access enabled, Chrome reports the private window, and app notes remain eligible while web notes do not.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/webby/design-directions.png"
              alt="The skin directions section of the Webby site, showing the Clear Glass direction and its note example."
              width={1440}
              height={1100}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>Five proposed skin directions, drawn by the skin engine on the design site. Proposed looks, not shipped app UI.</figcaption>
          </figure>

          <h2>Skins as a file, not a plugin</h2>
          <p>A <code>.webbyskin</code> is a ZIP containing <code>skin.json</code>, PNG images, and WAV sounds. There is no code in a skin, which keeps the format reviewable: an importer can inspect every asset before it stages a note panel, collapsed bar, Library window, or voice orb.</p>
          <p>The rules are accessibility-first. Every text and fill pair has to meet 4.5:1 when composited over both white and black, because the page behind a note is unknown. Texture stays at the edges rather than under body text, Reduce Transparency switches to an opaque fill, and Increase Contrast applies the skin's overrides last.</p>
          <p>The archive layer has code and tests. The five looks are still directions: the design document calls the visual principles proposed, and the site says the skin engine is what Webby <em>would</em> use. This page does not present them as shipped.</p>

          <h2>What is verified</h2>
          <p>CI runs on macOS 15. It builds the Swift package, runs the test suites, builds and verifies a <code>Webby.app</code> bundle, checks that release mode fails closed without signing inputs, and validates the Chrome extension against the app. The latest run on <code>main</code> passed after the tab-notes merge.</p>
          <p>The Chrome integration has recorded evidence beyond unit tests. A disposable Chrome profile produced real window bounds and a real navigation stream, including Punycode hosts and the empty-URL-then-update activation sequence. Recorded normal, incognito-enabled, and incognito-denied sessions replay through Swift tests, and synthetic fixtures cover mismatched bounds, overlapping profiles, reconnects, prefix boundaries, and separate YouTube videos. The document labels which cases were live and which were synthetic.</p>

          <h2>What is not verified</h2>
          <p>There is no release. <code>release/history.json</code> is empty, the README says so, and release packaging is still being built. The packaging scripts and runbook exist, but no release has run and the signing inputs are unconfirmed. Without a signed, notarized build there is nothing for a reader to download, and no runtime screenshot to show.</p>
          <p>The interactive acceptance pass is also still open: Accessibility permission changes, typing and dragging notes, full-screen and multiple displays, multiple Chrome profiles, and switching between normal and incognito windows with extension access on and off. The recorded browser observations do not substitute for that packaged-app pass.</p>

          <h2>What holds it back</h2>
          <p>The remaining work is distribution, not a missing feature. The app has to be signed and notarized, the extension has to be installed from a stable location, and the whole flow has to survive a machine that has never granted Accessibility before.</p>
          <p>Webby also asks for a permission that many people reasonably refuse. The app is designed to remain useful without it, at fixed note positions, but the part that makes it feel native is the part that needs trust.</p>

          <h2>Credit</h2>
          <p>Webby is a two-person project. I built alongside Jayden Lee; my commits concentrate in the core library, skin archive, persistence, and release planning, and Jayden's in the app and window layer, the Chrome bridge, and the release runbook. The final split is one of the things issue #68 asks us to confirm.</p>

          <div className="project-status-note">
            <strong>Waiting on project media</strong>
            <p>The public page needs a runtime capture of a note following a window and a Chrome tab, plus a demo of the skin import. I opened <a href="https://github.com/jynlee7/webby/issues/68" target="_blank" rel="noreferrer">issue #68</a> for those assets and the final contribution split.</p>
          </div>

          <nav className="feed-related" aria-label="Related links">
            <span>Related</span>
            <a href="https://github.com/jynlee7/webby" target="_blank" rel="noreferrer">Repository</a>
            <a href="https://jynlee7.github.io/webby/" target="_blank" rel="noreferrer">Skin directions</a>
            <a href="https://github.com/jynlee7/webby/blob/main/design.md" target="_blank" rel="noreferrer">Design principles</a>
            <a href="https://github.com/jynlee7/webby/blob/main/CHROME-VALIDATION.md" target="_blank" rel="noreferrer">Chrome validation</a>
          </nav>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          <Link href="/projects/hope-for-haiti/">Next: Hope for Haiti →</Link>
        </footer>
      </article>
    </main>
  )
}
