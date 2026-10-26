'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const PROJECTS = [
  { id: 'loom', title: 'Loom', note: 'Escrow payments, autonomous fraud agents, and the state machine underneath.', meta: 'Systems / AI' },
  { id: 'sink', title: 'sink', note: 'A self-hosted Obsidian sync layer with conflict resolution and a diff view.', meta: 'Tooling / sync' },
  { id: 'harmony', title: 'HarmonyAPI', note: 'A healthcare literature API built around retrieval, latency, and analysis.', meta: 'API / health' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

const ThreeStage = dynamic(() => import('../three-stage').then((module) => module.ThreeStage), { ssr: false, loading: () => <div className="mono-static">Loading the monolith.</div> })

export default function MonolithMockupPage() {
  const [selected, setSelected] = useState(0)
  const reduced = useReducedMotion()
  const project = PROJECTS[selected]


  return (
    <main className="mock-monolith">
      <style>{`
        html:has(.mock-monolith), body:has(.mock-monolith) { overflow-x: hidden !important; overflow-y: auto !important; background: #08090a; }
        body:has(.mock-monolith) { color: #f1eee6; }
        .mock-monolith { min-height: 100dvh; max-width: 1400px; margin: 0 auto; padding: 25px clamp(20px, 4vw, 58px) 34px; font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
        .mock-monolith * { box-sizing: border-box; }
        .mono-top { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding-bottom: 42px; }
        .mono-mark { font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; text-transform: uppercase; color: #a5aaa2; }
        .mono-mode { display: flex; gap: 8px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; text-transform: uppercase; }
        .mono-mode .active { color: #f1eee6; }
        .mono-mode .muted { color: #5d625d; }
        .mono-mode .slash { color: #3d423d; }
        .mono-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: clamp(22px, 5vw, 70px); align-items: center; }
        .mono-copy { position: relative; z-index: 1; max-width: 420px; }
        .mono-kicker { margin: 0 0 16px; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; color: #7e8c78; }
        .mono-copy h1 { margin: 0; font: 400 clamp(3.8rem, 8vw, 7.8rem)/.82 ui-sans-serif, system-ui, sans-serif; letter-spacing: -.085em; }
        .mono-copy h1 span { display: block; }
        .mono-intro { max-width: 32ch; margin: 26px 0 0; font: 16px/1.55 ui-serif, Georgia, serif; color: #aeb4aa; }
        .mono-projects { margin-top: 34px; border-top: 1px solid #2b322d; }
        .mono-project { width: 100%; display: grid; grid-template-columns: 24px 1fr auto; gap: 12px; align-items: baseline; padding: 14px 0; border: 0; border-bottom: 1px solid #242a25; background: transparent; color: #8d958b; text-align: left; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; }
        .mono-project strong { font: 400 18px/1.1 ui-serif, Georgia, serif; letter-spacing: -.02em; text-transform: none; color: #f1eee6; }
        .mono-project.active { color: #c7f36b; }
        .mono-project.active strong { color: #c7f36b; }
        .mono-project:focus-visible { outline: 2px solid #c7f36b; outline-offset: 3px; }
        .mono-scene { position: relative; height: min(69vh, 720px); min-height: 460px; }
        .mono-scene canvas { display: block; touch-action: pan-y; }
        .mono-scene::before { content: ""; position: absolute; inset: 10% 0 2%; background: radial-gradient(ellipse at 50% 50%, rgba(104, 143, 90, .12), transparent 65%); pointer-events: none; }
        .mono-caption { position: absolute; right: 2%; bottom: 1%; display: flex; align-items: center; gap: 10px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; color: #697568; pointer-events: none; }
        .mono-caption::before { content: ""; width: 24px; height: 1px; background: #485347; }
        .mono-static { display: grid; height: 100%; place-items: center; color: #788477; font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .mono-detail { display: grid; grid-template-columns: 1.1fr 2fr auto; gap: 16px; align-items: baseline; margin-top: 25px; padding-top: 15px; border-top: 1px solid #2b322d; }
        .mono-detail strong { font: 400 19px/1.2 ui-serif, Georgia, serif; }
        .mono-detail span { color: #9da69a; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .mono-detail em { color: #6f7e6c; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; font-style: normal; letter-spacing: .1em; text-transform: uppercase; }
        .mono-foot { display: flex; justify-content: space-between; gap: 18px; margin-top: 48px; padding-top: 14px; border-top: 1px solid #242a25; color: #6f7a6d; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; }
        .mono-foot a { color: inherit; text-decoration: none; }
        .mono-foot a:hover { color: #c7f36b; }
        .mono-foot a:focus-visible { outline: 2px solid #c7f36b; outline-offset: 3px; }
        @media (max-width: 820px) {
          .mono-top { padding-bottom: 28px; }
          .mono-grid { grid-template-columns: 1fr; gap: 10px; }
          .mono-copy { max-width: 100%; }
          .mono-copy h1 { font-size: clamp(3.8rem, 19vw, 6rem); }
          .mono-intro { max-width: 39ch; }
          .mono-projects { margin-top: 25px; }
          .mono-scene { height: 47vh; min-height: 300px; order: -1; }
          .mono-detail { grid-template-columns: 1fr auto; gap: 6px 14px; }
          .mono-detail span { grid-column: 1 / -1; }
          .mono-foot { flex-direction: column; gap: 8px; }
        }
      `}</style>

      <header className="mono-top">
        <span className="mono-mark">AL / personal</span>
        <div className="mono-mode" aria-label="Site mode"><span className="active">personal</span><span className="slash">/</span><span className="muted">photography</span></div>
      </header>

      <section className="mono-grid">
        <div className="mono-copy">
          <p className="mono-kicker">Software · systems · photography</p>
          <h1><span>Andrew</span><span>Liu</span></h1>
          <p className="mono-intro">Computational Media at Georgia Tech. I make software for people, then photograph the quiet parts of the night.</p>
          <div className="mono-projects" aria-label="Selected work">
            {PROJECTS.map((item, index) => (
              <button key={item.id} type="button" className={`mono-project${selected === index ? ' active' : ''}`} onClick={() => setSelected(index)} aria-pressed={selected === index}>
                <span>0{index + 1}</span><strong>{item.title}</strong><span>{item.meta}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mono-scene" aria-label="Interactive monolith scene">
          <ThreeStage variant="monolith" selected={selected} onSelect={setSelected} reduced={reduced} fallbackClass="mono-static" />
          <span className="mono-caption">Move your eye · choose a slab</span>
        </div>
      </section>

      <div className="mono-detail">
        <strong>{project.title}</strong>
        <span>{project.note}</span>
        <em>{project.meta}</em>
      </div>

      <footer className="mono-foot">
        <span>Atlanta, Georgia</span>
        <span><a href="https://github.com/aandrx">GitHub</a> · hello@example.com</span>
      </footer>
    </main>
  )
}
