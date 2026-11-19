import Image from 'next/image'
import Link from 'next/link'
import type { ProjectItem } from '@/lib/project-data'
import ProjectsTop from '../projects-top'
import '../../feed/feed.css'
import '../../feed/[slug]/feed-article.css'
import './voice-plotter-article.css'

const facts = [
  ['Team', 'Four-person EG-UY 1004 project'],
  ['Role', 'Software, firmware, stroke font, integration'],
  ['Output', 'Uppercase handwriting on paper'],
  ['Speed', 'About 15 seconds per letter'],
]

type Props = {
  project: ProjectItem
  next?: ProjectItem
}

export default function VoicePlotterArticle({ project, next }: Props) {
  return (
    <main className="feed-page feed-article voice-plotter-article" data-project-article={project.slug}>
      <ProjectsTop />

      <article className="feed-article-main">
        <header className="feed-article-head">
          <p className="project-kicker">Hardware · Fall 2025 · Team project</p>
          <h1>Voice Plotter</h1>
          <p className="feed-article-date">A pen plotter that writes what you say.</p>
        </header>

        <figure className="feed-figure project-hero">
          <Image
            src="/projects/voice-plotter/hero.jpeg"
            alt="The Voice Plotter prototype, a desk-sized three-axis pen plotter."
            width={1600}
            height={1960}
            sizes="(max-width: 720px) 100vw, 664px"
            priority
          />
          <figcaption>The prototype. Team project for EG-UY 1004 SLDP at NYU Tandon, Fall 2025.</figcaption>
        </figure>

        <div className="feed-body">
          <p className="project-lede">You speak, and the machine writes it on paper. A microphone captures a phrase, a cloud service turns it into text, and an Arduino draws each letter with a pen.</p>

          <dl className="project-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h2>The problem</h2>
          <p>Handwriting machines usually ask you to type. This one starts with speech. The input is a phrase, not a file or a coordinate list. The output is physical writing, with all the timing and failure modes of a small CNC machine attached.</p>
          <p>The result is a desk-sized 3-axis plotter modelled on the motion system of an open-frame 3D printer. X moves the pen carriage on a timing belt, Y moves the paper platform, and two lead screws lift the pen. It prints about 15 seconds per letter.</p>

          <h2>The path from a sentence to a stroke</h2>
          <p>A Python host records 16 kHz audio, sends it to Google Speech-to-Text, uppercases the result, and streams the characters over a 9600-baud serial link. The Arduino looks each character up in a hand-authored stroke font, converts the drawing operations into stepper coordinates, and drives four motors through two I2C motor shields.</p>
          <p>The seam between the host and the machine is deliberately narrow. Above it is Python and a cloud API. Below it is firmware that knows only text and coordinates. That made it possible to develop the speech and motion systems separately against a virtual COM port pair before integrating them.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/voice-plotter/isometric.jpeg"
              alt="Isometric view of the Voice Plotter frame and motion system."
              width={1200}
              height={1600}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>The frame and motion system. Mechanical design and fabrication were led by Katie Ma.</figcaption>
          </figure>

          <h2>The font is the interface</h2>
          <p>The plotter has 27 glyphs, A through Z and a space, described by 73 drawing operations. Each glyph fits a 7 mm box. A line is 40 mm wide, so the machine fits five glyphs before wrapping.</p>
          <p>The font lives in the firmware, where it belongs. A small Python tool parses the drawing functions and generates an interactive atlas for the browser. Change a glyph in the firmware, rerun the parser, and the atlas follows. The font and the documentation cannot quietly drift apart.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/voice-plotter/atlas.png"
              alt="The interactive glyph atlas showing letters and their stroke counts."
              width={1260}
              height={1275}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>The glyph atlas is generated from the firmware, not transcribed by hand.</figcaption>
          </figure>

          <figure className="feed-figure compact-figure">
            <Image
              src="/projects/voice-plotter/layout.png"
              alt="A paper-layout preview showing five uppercase letters on a 40 mm line."
              width={1226}
              height={429}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>The paper preview uses the same metrics as the machine: 40 mm line, five glyphs, then wrap.</figcaption>
          </figure>

          <h2>What I built</h2>
          <ul>
            <li>The Arduino firmware, including the stroke font, motor motion, LCD menu, serial protocol, and emergency stop.</li>
            <li>The Python host for speech capture, transcription, serial delivery, manual text entry, and motor tests.</li>
            <li>The integration path between the two systems, including the virtual COM port setup and test procedure.</li>
            <li>The generated glyph atlas, code flowcharts, and the software sections of the project documentation.</li>
          </ul>
          <p>It was a four-person project. Katie Ma led the mechanical design and fabrication, Shih Kai Chu handled circuitry and power, and Fanni Miettinen led project management, documentation, and assembly. I am describing the software side because that is the part I can account for directly.</p>

          <h2>What holds it back</h2>
          <p>The machine is open loop. There are no endstops, encoders, or paper-contact sensors, so it has to start from a known physical position. Motion is blocking, which means a stop releases the motors and halts the current move. The font is uppercase only, and the voice path needs a laptop, Python, and a cloud API.</p>
          <p>Those are honest limits, not footnotes. The next version would add endstops and homing, a non-blocking motion state machine, runtime glyph data, a look-ahead planner, and eventually on-device speech recognition.</p>

          <figure className="feed-figure">
            <Image
              src="/projects/voice-plotter/printed-hello.jpg"
              alt="A sheet of paper with HELLO written by the Voice Plotter."
              width={1280}
              height={2276}
              sizes="(max-width: 720px) 100vw, 664px"
            />
            <figcaption>The finished print. The full demo takes 89 seconds in real time.</figcaption>
          </figure>

          <h2>What I would show next</h2>
          <p>The strongest next step is not another feature. It is a repeatable print test with a known home position, a measured line of text, and a failure case that can be reproduced. That would turn the prototype story into a machine story.</p>

          <div className="feed-related" aria-label="Related links">
            <span>Related</span>
            <a href="https://github.com/aandrx/voice-plotter" target="_blank" rel="noreferrer">Repository</a>
            <a href="https://github.com/aandrx/voice-plotter/blob/main/docs/architecture.md" target="_blank" rel="noreferrer">Architecture notes</a>
            <a href="https://github.com/aandrx/voice-plotter/blob/main/docs/case-study.md" target="_blank" rel="noreferrer">Case study</a>
            <a href="https://github.com/aandrx/voice-plotter/tree/main/media/demo" target="_blank" rel="noreferrer">Demo videos</a>
          </div>
        </div>

        <footer className="feed-article-foot">
          <Link href="/projects/">← Projects</Link>
          {next ? (
            <Link href={`/projects/${next.slug}/`}>Next: {next.title} →</Link>
          ) : (
            <Link href="/projects/">Projects →</Link>
          )}
        </footer>
      </article>
    </main>
  )
}
