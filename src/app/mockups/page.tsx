const MOCKUPS = [
  { href: '/mockups/desk/', title: 'Desk', note: 'Warm editorial page with a camera, terminal, and print stack.' },
  { href: '/mockups/monolith/', title: 'Monolith', note: 'Dark, sculptural page with three project slabs.' },
  { href: '/mockups/index-cards/', title: 'Index cards', note: 'Paper-toned page with a fanned project card stack.' },
  { href: '/mockups/orbit/', title: 'Orbit', note: 'Blueprint page with project nodes on an orbital map.' },
]

export default function MockupsPage() {
  return (
    <main className="mockup-index">
      <style>{`
        html:has(.mockup-index), body:has(.mockup-index) { overflow-x: hidden !important; overflow-y: auto !important; background: #f4f2ec; }
        body:has(.mockup-index) { color: #1d1b17; }
        .mockup-index { min-height: 100dvh; max-width: 900px; margin: 0 auto; padding: 40px 24px 60px; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; }
        .mockup-index * { box-sizing: border-box; }
        .mockup-index h1 { margin: 0; font: 400 clamp(2.6rem, 7vw, 4.5rem)/.9 ui-serif, Georgia, serif; letter-spacing: -.06em; }
        .mockup-index p { max-width: 56ch; color: #746a5d; }
        .mockup-index-list { margin-top: 38px; border-top: 1px solid #d7cec0; }
        .mockup-index-link { display: grid; grid-template-columns: 1fr 2fr auto; gap: 16px; align-items: baseline; padding: 18px 0; border-bottom: 1px solid #ddd4c7; color: inherit; text-decoration: none; }
        .mockup-index-link strong { font: 400 22px/1.1 ui-serif, Georgia, serif; }
        .mockup-index-link span { color: #746a5d; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .mockup-index-link em { font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; font-style: normal; letter-spacing: .12em; text-transform: uppercase; color: #a0927e; }
        .mockup-index-link:hover strong { text-decoration: underline; text-underline-offset: 3px; }
        .mockup-index-link:focus-visible { outline: 2px solid #1d1b17; outline-offset: 4px; }
        .mockup-index-foot { margin-top: 36px; color: #9a8d7a; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; }
        @media (max-width: 650px) { .mockup-index-link { grid-template-columns: 1fr auto; } .mockup-index-link span { grid-column: 1 / -1; } }
      `}</style>
      <h1>Personal mockups</h1>
      <p>Four isolated directions for the personal side. Nothing here is linked from the photography site.</p>
      <div className="mockup-index-list">
        {MOCKUPS.map((mockup, index) => (
          <a key={mockup.href} className="mockup-index-link" href={mockup.href}>
            <strong>{mockup.title}</strong>
            <span>{mockup.note}</span>
            <em>0{index + 1}</em>
          </a>
        ))}
      </div>
      <div className="mockup-index-foot">Noindex · branch preview only</div>
    </main>
  )
}
