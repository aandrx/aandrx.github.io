import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ProjectsTop from '../../projects-top'
import '../../../feed/feed.css'
import '../../../feed/[slug]/feed-article.css'
import './bloom-mock.css'

export const metadata: Metadata = {
  title: 'Bloom draft · Andrew Liu',
  robots: { index: false, follow: false },
}

const facts = [
  ['Status', 'Experimental WIP'],
  ['Surface', 'Keyboard-first terminal UI'],
  ['Stack', 'Rust, Ratatui, Dart, SQLite'],
  ['Distribution', 'Source-only, not packaged'],
]

export default function BloomMockPage() {
  return (
    <main className="feed-page feed-article bloom-mock">
      <ProjectsTop />

      <article className="feed-article-main">
        <p className="project-mock-label">Draft project page for review. Not linked from Projects yet.</p>

        <header className="feed-article-head">
          <p className="project-kicker">Terminal UI · Experimental · In progress</p>
          <h1>Bloom</h1>
          <p className="feed-article-date">A keyboard-first terminal messenger for iMessage.</p>
        </header>

        <figure className="feed-figure project-hero">
          <Image
            src="/projects/bloom/tui-preview.png"
            alt="An interface design preview of Bloom's dark terminal conversation view."
            width={1728}
            height={1320}
            sizes="(max-width: 720px) 100vw, 664px"
            priority
          />
          <figcaption>Interface design preview, not a runtime screenshot. Bloom is a terminal client, not a web app.</figcaption>
        </figure>

        <div className="feed-body">
          <p className="project-lede">Bloom puts an iMessage client in the terminal without pretending the terminal is the whole system. A local daemon owns the engine, encrypted history, and message transport; the TUI is one client.</p>

          <dl className="project-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2>Why a terminal client</h2>
          <p>Most messaging clients hide the state that matters: what was persisted, what reached the engine, and what happened when the engine died. A keyboard-first TUI makes those states visible. It also makes the interface fast to navigate without turning the project into another desktop chat app.</p>
          <p>Bloom uses an existing OpenBubbles registration. It does not own sign-in, registration, account recovery, or the iMessage transport. That boundary is deliberate: the project is a client and bridge, not a replacement service.</p>

          <h2>The interface</h2>
          <p>The client is built for a terminal window that is already open. Conversations, transcript, composer, and status share one screen, and every action has a key. Nothing depends on a pointer, a window manager, or a browser engine.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/bloom/tui-mobile-preview.png"
              alt="An interface design preview of Bloom in a narrow terminal window."
              width={468}
              height={1012}
              sizes="(max-width: 720px) 100vw, 320px"
            />
            <figcaption>A narrow-terminal layout from the same offline mockup set. Design preview only.</figcaption>
          </figure>

          <h2>One daemon, one owner</h2>
          <p>The TUI never touches the database, the engine, or credentials directly. It talks to <code>bloomd</code> over an authenticated Unix socket. The daemon owns the encrypted SQLite store, the OS keychain access, the engine sidecar, and the transport state.</p>
          <p>That narrow seam keeps the terminal client replaceable. A future GUI can be another daemon client instead of a second copy of the messaging logic. It also makes failure states easier to describe: the UI can reconnect, rebuild a snapshot, or show that the daemon is unavailable without pretending a send succeeded.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/bloom/tui-light-preview.png"
              alt="An interface design preview of Bloom's light terminal theme."
              width={1728}
              height={1320}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>A second theme in the offline interface mockup. Runtime captures are still needed for the finished page.</figcaption>
          </figure>

          <h2>Persistence before fanout</h2>
          <p>Messages are written locally before they are treated as durable. Drafts preserve text, cursor position, paste provenance, and uncertainty. A submitted body stays parked until the daemon acknowledges it, and uncertain sends are never replayed automatically.</p>
          <p>The UI also keeps read positions, search context, and transient panels tied to the conversation that owns them. That sounds like bookkeeping until the engine restarts mid-operation, which is exactly when the difference between “sent”, “possibly sent”, and “saved locally” matters.</p>

          <h2>What is implemented</h2>
          <ul>
            <li>Text messaging, local stored history, and a keyboard-driven conversation list and transcript.</li>
            <li>Automatic engine-child recovery, with daemon-owned session replacement.</li>
            <li>Read-only inbound reaction display, plus inbound text edits and whole-body unsends applied transactionally with explicit Edited and Unsent notes.</li>
            <li>Inbound attachment saving and opening, and outbound attachment send over IPC v9. A live upload completed; the live send was rejected by the engine, so remote delivery is unverified.</li>
            <li>Durable drafts, local search, message and filename search, unread navigation, and themes.</li>
            <li>A source-available Rust workspace with a Dart sidecar and a ratatui terminal client.</li>
          </ul>

          <h2>What is verified, and what is not</h2>
          <p>The repository has synthetic regression coverage, a real daemon/service/store test with a fake child sidecar, PTY tests for the actual TUI, and Dart tests for the owned protocol and codec. The docs also record one authorized live probe that replaced the real sidecar child after 0.42 seconds.</p>
          <p>That is not the same as proving live messaging reliability. Delivery after recovery, repeated engine deaths, daemon restart, credential renewal, and ABI changes remain unverified. A successful startup does not establish that messages are delivered.</p>

          <h2>What holds it back</h2>
          <p>Bloom is not a standalone distribution. It currently needs Rust, Dart 3.13.4, the OpenBubbles Flatpak, and a user-supplied OpenBubbles registration. Linux is the documented setup; Windows is not supported. The TUI is open source, but the engine is not covered by Bloom’s MIT license.</p>
          <p>GPUI and other desktop surfaces are deferred until the messaging loop is reliable. The next work is packaging, the remaining licensing review, and more evidence around recovery and delivery.</p>

          <div className="project-status-note">
            <strong>Waiting on project media</strong>
            <p>The public page still needs real runtime screenshots and a demo capture. I opened <a href="https://github.com/aandrx/bloom/issues/4" target="_blank" rel="noreferrer">issue #4</a> for those assets and verification details.</p>
          </div>

          <div className="feed-related" aria-label="Related links">
            <span>Related</span>
            <a href="https://github.com/aandrx/bloom" target="_blank" rel="noreferrer">Repository</a>
            <a href="https://github.com/aandrx/bloom/blob/main/docs/system-design.md" target="_blank" rel="noreferrer">System design</a>
            <a href="https://github.com/aandrx/bloom/blob/main/docs/status.md" target="_blank" rel="noreferrer">Status and boundaries</a>
            <a href="https://github.com/aandrx/bloom/blob/main/docs/handoff.md" target="_blank" rel="noreferrer">Handoff notes</a>
          </div>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          <Link href="/projects/sink/">Next: sink →</Link>
        </footer>
      </article>
    </main>
  )
}
