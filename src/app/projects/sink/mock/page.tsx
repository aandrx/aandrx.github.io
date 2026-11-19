import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ProjectsTop from '../../projects-top'
import '../../../feed/feed.css'
import '../../../feed/[slug]/feed-article.css'
import '../../project-article.css'
import './sink-mock.css'

export const metadata: Metadata = {
  title: 'Sink draft · Andrew Liu',
  robots: { index: false, follow: false },
}

const facts = [
  ['Status', 'Released, 0.2.23'],
  ['Surface', 'Obsidian desktop and mobile'],
  ['Stack', 'TypeScript, CouchDB, PouchDB'],
  ['Server', 'Self-hosted Docker over Tailscale'],
]

export default function SinkMockPage() {
  return (
    <main className="feed-page feed-article sink-mock">
      <ProjectsTop />

      <article className="feed-article-main">
        <p className="project-mock-label">Draft project page for review. Not linked from Projects yet.</p>

        <header className="feed-article-head">
          <p className="project-kicker">Obsidian plugin · Released · Self-hosted</p>
          <h1>Sink</h1>
          <p className="feed-article-date">A sync plugin that makes you look at the conflict before it writes.</p>
        </header>

        <figure className="feed-figure project-hero">
          <Image
            src="/projects/sink/mobile-list-dark.png"
            alt="Sink's mobile sync review showing file cards with Local, Remote, and Skip controls in dark theme."
            width={468}
            height={1013}
            sizes="(max-width: 720px) 100vw, 320px"
            priority
          />
          <figcaption>The mobile review workspace, rendered from the real review component at a 390 by 844 phone viewport. Not a physical device capture.</figcaption>
        </figure>

        <div className="feed-body">
          <p className="project-lede">Sink keeps an Obsidian vault in sync through a CouchDB instance you run yourself. When two devices disagree, it stops and asks which side wins instead of merging behind your back.</p>

          <dl className="project-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2>Why self-host a sync layer</h2>
          <p>An Obsidian vault is a folder of plain files, so the usual answer is a hosted sync service. Sink takes the other route: CouchDB in Docker on a machine you control, reached over Tailscale, with no third-party cloud in the path. The plugin is forked from the architecture of obsidian-livesync and stripped to the essentials.</p>
          <p>Encryption is optional and end-to-end: AES-256-GCM with PBKDF2 key derivation. A setup URI carries the connection settings to a new device in one paste, so adding a phone does not mean retyping a server address and a password.</p>

          <h2>Conflicts are a decision</h2>
          <p>Divergent edits and retained CouchDB revisions are never silently merged. Each file gets an explicit Local or Remote choice, deletions require confirmation, and a cancelled review ends the operation without applying the selected changes. Retained conflict revisions need a chosen leaf before Remote can be applied.</p>
          <p>That is a deliberate downgrade from automatic merging. An earlier patch-based replacement was not a genuine three-way merge, so it was removed rather than dressed up. The current behaviour is slower and honest: you see both sides and pick one.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/sink/mobile-detail-light.png"
              alt="A unified diff detail view in Sink's mobile review, showing a file's local and remote lines in light theme."
              width={468}
              height={1013}
              sizes="(max-width: 720px) 100vw, 320px"
            />
            <figcaption>The detail sheet uses a unified diff rather than two cramped side-by-side panes. Rendered from the real component, not a device capture.</figcaption>
          </figure>

          <h2>Two review surfaces, one decision model</h2>
          <p>Desktop keeps a side-by-side diff viewer with aligned lines, red and green highlighting, synchronized scrolling, collapsible context, and change navigation. Mobile opens a full-screen card workspace: rounded file cards, a Local, Remote, or Skip segmented control on each, a detail view with a back button, and a safe-area-aware bottom bar showing the live effective count and an Apply action. Bulk actions set every file at once, and blocked rows explain why they cannot be applied.</p>
          <p>The presentation differs; the semantics do not. Both surfaces send the same review result to the sync engine, so a decision made on a phone means exactly what it means on a laptop.</p>

          <div className="sink-pair">
            <figure className="feed-figure">
              <Image
                src="/projects/sink/mobile-binary-dark.png"
                alt="Sink's mobile review showing a binary attachment with its decision controls in dark theme."
                width={468}
                height={1013}
                sizes="(max-width: 520px) 100vw, (max-width: 720px) 45vw, 240px"
              />
              <figcaption>A binary attachment in the review. Rendered from the real component at a 390 by 844 viewport; not a device capture.</figcaption>
            </figure>
            <figure className="feed-figure">
              <Image
                src="/projects/sink/mobile-conflict-light.png"
                alt="Sink's mobile review showing a retained conflict revision picker in light theme."
                width={468}
                height={1013}
                sizes="(max-width: 520px) 100vw, (max-width: 720px) 45vw, 240px"
              />
              <figcaption>A retained conflict revision, which needs an explicit choice. Rendered from the real component; not a device capture.</figcaption>
            </figure>
          </div>

          <h2>Attachments and snapshots</h2>
          <p>Binary attachments carry one content identity across inline, chunked, encrypted, and plaintext storage, so an unchanged attachment no longer reappears in every startup review. Before a batch is applied, Sink writes a local safety snapshot; Settings shows the five most recent, and older ones stay stored rather than being pruned.</p>
          <p>The limits are deliberate and visible: 20 MiB per file, a 32 MiB estimated budget per automatic snapshot, and diff previews capped at 1 MiB and 4,000 lines. A batch that would need a larger backup is refused rather than applied without one.</p>

          <h2>What is verified</h2>
          <p>The 0.2.23 release records 168 unit and DOM tests passing, a clean typecheck and build, and 11 of 11 isolated Electron and CouchDB end-to-end runs. Those runs cover review paging, cancel and confirm, secondary-device permission, divergent edits, reconnect and catch-up, startup reconciliation, encrypted chunk transfer, unchanged attachment restarts, snapshot display, inbound filtering, and retained conflict resolution.</p>
          <p>The mobile workspace has DOM tests for card layout, decision emission, detail navigation, bulk actions, revision selection, and paging, plus a rendered check of the real component at a 390 by 844 viewport in light and dark themes. The four images on this page come from that check.</p>

          <h2>What is not verified</h2>
          <p>The mobile layout was never exercised on a physical iPhone or iPad, or inside the Obsidian iOS app. The render check validates layout and component state, not WKWebView safe-area behaviour or touch gestures, and there is no mobile end-to-end harness.</p>
          <p>More seriously, the grey-screen crash that motivated the stability work still has unconfirmed causality. The project's own stability notes recommend keeping Sink disabled in a live vault until a controlled test plan passes, and the dependency audit reports moderate advisories in the existing PouchDB and UUID chain that are not established as the cause.</p>

          <h2>What holds it back</h2>
          <p>A sync plugin that can take down the application it runs inside is not finished, whatever its test count says. The release exists, the review interface works, and the conflict model is sound, but the stability question is open. That is why this page says released, not recommended.</p>
          <p>Config sync also defaults to off for new installations, and Sink excludes workspace state, plugin-enable lists, and its own plugin directory from syncing regardless of that toggle. Those exclusions are preventive: they stop the sync path from being used to change which plugins are enabled.</p>

          <div className="project-status-note">
            <strong>Waiting on project media</strong>
            <p>The page still needs desktop review screenshots and a short demo capture. I opened <a href="https://github.com/aandrx/sink/issues/1" target="_blank" rel="noreferrer">issue #1</a> for those assets and the verification details.</p>
          </div>

          <nav className="feed-related" aria-label="Related links">
            <span>Related</span>
            <a href="https://github.com/aandrx/sink" target="_blank" rel="noreferrer">Repository</a>
            <a href="https://github.com/aandrx/sink/blob/main/docs/setup.md" target="_blank" rel="noreferrer">Setup guide</a>
            <a href="https://github.com/aandrx/sink/blob/main/docs/STABILITY.md" target="_blank" rel="noreferrer">Stability notes</a>
            <a href="https://github.com/aandrx/sink/blob/main/docs/releases/0.2.23.md" target="_blank" rel="noreferrer">0.2.23 release notes</a>
          </nav>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          <Link href="/projects/shend/">Next: Shend →</Link>
        </footer>
      </article>
    </main>
  )
}
