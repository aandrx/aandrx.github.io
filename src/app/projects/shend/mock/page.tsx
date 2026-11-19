import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import ProjectsTop from '../../projects-top'
import '../../../feed/feed.css'
import '../../../feed/[slug]/feed-article.css'
import '../../project-article.css'
import './shend-mock.css'

export const metadata: Metadata = {
  title: 'Shend draft · Andrew Liu',
  robots: { index: false, follow: false },
}

const facts = [
  ['Status', 'Historically operational, current state unverified'],
  ['Surface', 'Discord slash commands plus a browser upload form'],
  ['Stack', 'Python 3.11, discord.py, FastAPI, FFmpeg'],
  ['Hosting', 'Docker Compose behind Tailscale Funnel'],
]

export default function ShendMockPage() {
  return (
    <main className="feed-page feed-article shend-mock">
      <ProjectsTop />

      <article className="feed-article-main">
        <p className="project-mock-label">Draft project page for review. Not linked from Projects yet.</p>

        <header className="feed-article-head">
          <p className="project-kicker">Discord bot · Historically operational · Self-hosted</p>
          <h1>Shend</h1>
          <p className="feed-article-date">A bot that gets a video under Discord's upload cap without asking you to think about bitrates.</p>
        </header>

        <figure className="feed-figure project-hero">
          <Image
            src="/projects/shend/shend-banner.png"
            alt="The Shend project banner from the repository."
            width={680}
            height={240}
            sizes="(max-width: 720px) 100vw, 664px"
            priority
          />
          <figcaption>The repository banner. There is no runtime capture of the bot yet.</figcaption>
        </figure>

        <div className="feed-body">
          <p className="project-lede">Discord caps uploads at 10 MB. Shend takes a large video through a private link, re-encodes it to a byte target, and hands back something that fits, either embedded in the channel or as a download in your DMs.</p>

          <dl className="project-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2>The 10 MB problem</h2>
          <p>The usual workaround is to re-encode by hand and guess at a bitrate until the file squeaks under the limit. Shend moves that guess into code: you ask for a link, upload in a browser, and the bot does the arithmetic and the encoding on its own machine.</p>
          <p>It ran on a home server behind Tailscale Funnel, so there was no domain to buy and no port to forward. That deployment is what the repository documents. Whether it is running today is not something the repository can tell you.</p>

          <h2>How a job runs</h2>
          <p>A slash command starts it. <code>/upload</code> and <code>/downsize</code> both reply privately with a single-use URL that expires in fifteen minutes, so the file never passes through Discord's own upload path. The browser form posts the video to a FastAPI endpoint, which checks the token, the caller's rate limit, and free disk space before it touches the file.</p>
          <p>Validation reads magic numbers rather than trusting the extension, and only MP4, QuickTime, and AVI are accepted. Files are stored under UUID names, with the original filename kept in SQLite and used only when building the download response.</p>

          <h2>Hitting a byte target</h2>
          <p>The encoder probes the duration with <code>ffprobe</code>, converts the 9.5 MB target into bits, subtracts a fixed 96 kbps for audio, and divides what is left by the duration. That number becomes the video bitrate for a two-pass libx264 run. If the computed bitrate falls below 500 kbps, the scale drops from 1280 wide to 854 wide rather than producing something unwatchable.</p>

          <figure className="feed-figure shend-code">
            <pre tabIndex={0}><code>{`ffmpeg -y -i input.mp4 -vf scale=1280:-2 \\
  -c:v libx264 -b:v <target> -pass 1 -passlogfile <log> \\
  -an -f null /dev/null

ffmpeg -y -i input.mp4 -vf scale=1280:-2 \\
  -c:v libx264 -b:v <target> -pass 2 -passlogfile <log> \\
  -c:a aac -b:a 96000 -movflags +faststart output.mp4`}</code></pre>
            <figcaption>The two passes from <code>compress.py</code>, with the computed bitrate and scale substituted in.</figcaption>
          </figure>

          <h2>Two ways to get the file back</h2>
          <p>In embed mode the result moves into the uploads directory and the bot posts a viewer link to the channel. That page carries Open Graph video tags, so Discord renders the clip inline instead of as a bare URL. In download mode the file stays in temp and the bot sends a private link that returns it as an attachment with the original name and a <code>_downsized</code> suffix.</p>
          <p>Both modes share the same compression path. The difference is where the output lands and how it is announced.</p>

          <h2>Guardrails</h2>
          <p>Every upload passes a per-user hourly limit and a disk pressure check that refuses work once usage reaches half a gigabyte below the configured cap. Tokens are single-use and time-limited. The container runs unprivileged, and the host mounts are documented with <code>noexec</code>, <code>nosuid</code>, and <code>nodev</code>.</p>
          <p>None of that is unusual on its own. It matters here because the service accepts arbitrary files from strangers on a Discord server and writes them to disk.</p>

          <h2>Cleanup runs itself</h2>
          <p>An hourly scheduler deletes temp files older than an hour, moves uploads older than seven days into an archive, purges the oldest archive files when disk usage passes 85 percent until it drops below 80, and removes database rows whose files are gone. The three directories have different lifetimes on purpose: temp is a working area, uploads is the public window, archive is the long tail.</p>

          <h2>What is verified, and what is not</h2>
          <p>There is no automated test suite and no CI. <code>test_compress.py</code> is a manual script that compresses one local file and prints the resulting size; it asserts nothing. The repository documents a deployment, not a test result, so the honest summary is that the bot worked on a home server and the code is readable, not that it is proven.</p>
          <p>Current operation is unverified. There is also no runtime capture: the only images in the repository are a banner and a small logo.</p>

          <h2>What holds it back</h2>
          <p>Compression runs inside the upload request, so a long video holds the connection open for the whole encode. There is no job queue and no second worker, which is fine for a handful of friends and wrong for anything larger.</p>
          <p>Two smaller inconsistencies are worth naming. The README lists 10 uploads per hour as the default while <code>config.py</code> falls back to 3 when the variable is unset, and the viewer page advertises 1280 by 720 in its Open Graph tags regardless of the width the encoder actually chose, so a 480p fallback still claims 720p.</p>

          <div className="project-status-note">
            <strong>Waiting on project media</strong>
            <p>The page needs a runtime capture of a real job, from slash command to delivered file. I opened <a href="https://github.com/aandrx/shend/issues/1" target="_blank" rel="noreferrer">issue #1</a> for that and for the current deployment status.</p>
          </div>

          <nav className="feed-related" aria-label="Related links">
            <span>Related</span>
            <a href="https://github.com/aandrx/shend" target="_blank" rel="noreferrer">Repository</a>
            <a href="https://github.com/aandrx/shend/blob/main/docs/CLEANUP.md" target="_blank" rel="noreferrer">Cleanup guide</a>
            <a href="https://github.com/aandrx/shend/blob/main/docs/TROUBLESHOOTING.md" target="_blank" rel="noreferrer">Troubleshooting</a>
          </nav>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          <Link href="/projects/webby/">Next: Webby →</Link>
        </footer>
      </article>
    </main>
  )
}
