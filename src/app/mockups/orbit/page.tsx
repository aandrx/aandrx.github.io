'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const NODES = [
  { id: 'loom', title: 'Loom', meta: 'systems / AI', note: 'Escrow payments and autonomous fraud agents.', position: [0.2, 1.72, 0.1] as const, color: '#2b5cff' },
  { id: 'sink', title: 'sink', meta: 'tooling / sync', note: 'A self-hosted Obsidian sync layer with conflict resolution.', position: [1.62, 0.2, 0.5] as const, color: '#d7ff64' },
  { id: 'harmony', title: 'HarmonyAPI', meta: 'api / health', note: 'Healthcare literature retrieval and analysis.', position: [-1.55, -0.1, 0.42] as const, color: '#ff8a5c' },
  { id: 'continuum', title: 'Continuum', meta: 'infrastructure', note: 'A dashboard spanning Vue, Flask, Docker and Kubernetes.', position: [0.18, -1.68, -0.2] as const, color: '#2b5cff' },
  { id: 'photography', title: 'Photography', meta: 'archive', note: 'Night walks, quiet streets, and the people in between.', position: [-0.55, 1.05, -1.15] as const, color: '#d7ff64' },
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

const ThreeStage = dynamic(() => import('../three-stage').then((module) => module.ThreeStage), { ssr: false, loading: () => <div className="orbit-static">Loading the map.</div> })

export default function OrbitMockupPage() {
  const [selected, setSelected] = useState(0)
  const reduced = useReducedMotion()
  const node = NODES[selected]


  return (
    <main className="mock-orbit">
      <style>{`
        html:has(.mock-orbit), body:has(.mock-orbit) { overflow-x: hidden !important; overflow-y: auto !important; background: #e8edf0; }
        body:has(.mock-orbit) { color: #14202b; }
        .mock-orbit { min-height: 100dvh; max-width: 1400px; margin: 0 auto; padding: 24px clamp(20px, 4vw, 58px) 36px; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; }
        .mock-orbit * { box-sizing: border-box; }
        .orbit-top { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding-bottom: 38px; }
        .orbit-mark { font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; text-transform: uppercase; color: #5d7180; }
        .orbit-mode { display: flex; gap: 8px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; }
        .orbit-mode .active { color: #14202b; }
        .orbit-mode .muted { color: #8296a2; }
        .orbit-mode .slash { color: #a9b8c0; }
        .orbit-grid { display: grid; grid-template-columns: minmax(260px, .8fr) minmax(420px, 1.2fr); gap: clamp(20px, 5vw, 70px); align-items: center; }
        .orbit-copy { max-width: 400px; }
        .orbit-kicker { margin: 0 0 16px; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; color: #5c7180; }
        .orbit-copy h1 { margin: 0; font: 400 clamp(3.2rem, 7vw, 6.5rem)/.84 ui-sans-serif, system-ui, sans-serif; letter-spacing: -.085em; }
        .orbit-copy h1 span { display: block; }
        .orbit-intro { max-width: 34ch; margin: 26px 0 0; font: 17px/1.55 ui-serif, Georgia, serif; color: #536572; }
        .orbit-list { margin-top: 30px; border-top: 1px solid #c2d0d6; }
        .orbit-item { width: 100%; display: grid; grid-template-columns: 30px 1fr auto; gap: 12px; align-items: baseline; padding: 13px 0; border: 0; border-bottom: 1px solid #cfdae0; background: transparent; color: #6f8390; text-align: left; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; }
        .orbit-item strong { font: 400 17px/1.1 ui-serif, Georgia, serif; letter-spacing: -.02em; text-transform: none; color: #14202b; }
        .orbit-item.active { color: #2b5cff; }
        .orbit-item.active strong { color: #2b5cff; }
        .orbit-item:focus-visible { outline: 2px solid #2b5cff; outline-offset: 3px; }
        .orbit-scene { position: relative; height: min(66vh, 680px); min-height: 450px; }
        .orbit-scene canvas { display: block; touch-action: pan-y; }
        .orbit-scene::before { content: ""; position: absolute; inset: 5% 0 2%; border-radius: 50%; background: radial-gradient(ellipse, rgba(43, 92, 255, .10), transparent 65%); pointer-events: none; }
        .orbit-caption { position: absolute; right: 3%; bottom: 1%; display: flex; align-items: center; gap: 9px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; color: #6e8492; pointer-events: none; }
        .orbit-caption::before { content: ""; width: 22px; height: 1px; background: #9cabb4; }
        .orbit-static { display: grid; height: 100%; place-items: center; color: #6e8492; font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .orbit-detail { display: grid; grid-template-columns: 1.1fr 2.2fr auto; gap: 16px; align-items: baseline; margin-top: 22px; padding-top: 15px; border-top: 1px solid #c2d0d6; }
        .orbit-detail strong { font: 400 19px/1.2 ui-serif, Georgia, serif; }
        .orbit-detail span { color: #5d7180; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .orbit-detail em { color: #7e929e; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; font-style: normal; letter-spacing: .1em; text-transform: uppercase; }
        .orbit-foot { display: flex; justify-content: space-between; gap: 18px; margin-top: 42px; padding-top: 14px; border-top: 1px solid #c2d0d6; color: #6e8492; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; }
        .orbit-foot a { color: inherit; text-decoration: none; }
        .orbit-foot a:hover { color: #14202b; }
        .orbit-foot a:focus-visible { outline: 2px solid #2b5cff; outline-offset: 3px; }
        @media (max-width: 820px) {
          .orbit-grid { grid-template-columns: 1fr; gap: 8px; }
          .orbit-copy { max-width: 100%; }
          .orbit-copy h1 { font-size: clamp(3.4rem, 18vw, 5.7rem); }
          .orbit-intro { max-width: 39ch; }
          .orbit-list { margin-top: 24px; }
          .orbit-scene { height: 46vh; min-height: 310px; order: -1; }
          .orbit-detail { grid-template-columns: 1fr auto; gap: 6px 14px; }
          .orbit-detail span { grid-column: 1 / -1; }
          .orbit-foot { flex-direction: column; gap: 8px; }
        }
      `}</style>

      <header className="orbit-top">
        <span className="orbit-mark">AL / personal</span>
        <div className="orbit-mode" aria-label="Site mode"><span className="active">personal</span><span className="slash">/</span><span className="muted">photography</span></div>
      </header>

      <section className="orbit-grid">
        <div className="orbit-copy">
          <p className="orbit-kicker">A map of current work</p>
          <h1><span>Andrew</span><span>Liu</span></h1>
          <p className="orbit-intro">I like the space between a system and the person using it: software, tools, and photographs that make the seams visible.</p>
          <div className="orbit-list" aria-label="Selected work">
            {NODES.map((item, index) => (
              <button key={item.id} type="button" className={`orbit-item${selected === index ? ' active' : ''}`} onClick={() => setSelected(index)} aria-pressed={selected === index}>
                <span>0{index + 1}</span><strong>{item.title}</strong><span>{item.meta}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="orbit-scene" aria-label="Interactive orbit scene">
          <ThreeStage variant="orbit" selected={selected} onSelect={setSelected} reduced={reduced} fallbackClass="orbit-static" />
          <span className="orbit-caption">Move your eye · select a node</span>
        </div>
      </section>

      <div className="orbit-detail">
        <strong>{node.title}</strong>
        <span>{node.note}</span>
        <em>{node.meta}</em>
      </div>

      <footer className="orbit-foot">
        <span>Atlanta, Georgia</span>
        <span><a href="https://github.com/aandrx">GitHub</a> · hello@example.com</span>
      </footer>
    </main>
  )
}
