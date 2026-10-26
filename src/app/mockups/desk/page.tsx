'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const ITEMS = [
  { id: 'camera', label: 'Camera', note: 'Night photography, since 2024.' },
  { id: 'terminal', label: 'Terminal', note: 'Software systems, AI tools, and infrastructure.' },
  { id: 'prints', label: 'Prints', note: 'A growing archive of work and experiments.' },
] as const

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

const ThreeStage = dynamic(() => import('../three-stage').then((module) => module.ThreeStage), { ssr: false, loading: () => <div className="mock-static">Loading the desk.</div> })

export default function DeskMockupPage() {
  const [selected, setSelected] = useState(0)
  const reduced = useReducedMotion()
  const active = ITEMS[selected] ?? ITEMS[0]


  return (
    <main className="mock-desk">
      <style>{`
        html:has(.mock-desk), body:has(.mock-desk) { overflow-x: hidden !important; overflow-y: auto !important; background: #f2efe8; }
        body:has(.mock-desk) { color: #171511; }
        .mock-desk { min-height: 100dvh; max-width: 1380px; margin: 0 auto; padding: 24px clamp(20px, 4vw, 56px) 40px; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; }
        .mock-desk * { box-sizing: border-box; }
        .mock-top { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding-bottom: 28px; }
        .mock-mark { font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
        .mock-mode { display: flex; align-items: center; gap: 8px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; }
        .mock-mode .active { color: #171511; }
        .mock-mode .muted { color: #9a9286; }
        .mock-mode .slash { color: #b4aa9d; }
        .mock-grid { display: grid; grid-template-columns: minmax(260px, .78fr) minmax(380px, 1.22fr); gap: clamp(24px, 5vw, 76px); align-items: center; }
        .mock-copy { max-width: 390px; }
        .mock-kicker { margin: 0 0 18px; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; color: #8b8173; }
        .mock-copy h1 { margin: 0; font: 400 clamp(3.4rem, 7vw, 6.4rem)/.84 ui-serif, Georgia, serif; letter-spacing: -.065em; }
        .mock-copy h1 span { display: block; }
        .mock-intro { margin: 28px 0 0; max-width: 33ch; font: 17px/1.55 ui-serif, Georgia, serif; color: #4e473d; }
        .mock-scene { position: relative; min-height: 500px; height: min(58vh, 640px); }
        .mock-scene canvas { display: block; touch-action: pan-y; }
        .mock-scene::before { content: ""; position: absolute; inset: 9% 4% 5%; border-radius: 50%; background: radial-gradient(ellipse, rgba(126, 105, 71, .12), transparent 68%); pointer-events: none; }
        .mock-scene-label { position: absolute; left: 4%; bottom: 2%; display: flex; align-items: center; gap: 10px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; color: #766b5c; pointer-events: none; }
        .mock-scene-label::before { content: ""; width: 22px; height: 1px; background: #b3a691; }
        .mock-static { display: grid; height: 100%; place-items: center; color: #766b5c; font: 12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; }
        .mock-objects { display: flex; gap: 8px; margin-top: -8px; padding-top: 12px; }
        .mock-object { border: 1px solid #cfc5b6; background: transparent; color: #655c4f; padding: 7px 10px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease; }
        .mock-object:hover { background: #e7e0d4; }
        .mock-object.active { background: #171511; border-color: #171511; color: #f2efe8; }
        .mock-note { min-height: 24px; margin: 18px 0 0; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: #766b5c; }
        .mock-work { margin-top: clamp(42px, 8vh, 90px); border-top: 1px solid #cfc5b6; }
        .mock-work-title { display: flex; justify-content: space-between; gap: 16px; padding: 13px 0 10px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .13em; text-transform: uppercase; color: #8b8173; }
        .mock-row { display: grid; grid-template-columns: 1.1fr 2.4fr auto; gap: 18px; align-items: baseline; padding: 15px 0; border-top: 1px solid #ddd4c7; }
        .mock-row strong { font: 400 18px/1.2 ui-serif, Georgia, serif; }
        .mock-row span { font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; color: #766b5c; }
        .mock-row em { font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; font-style: normal; letter-spacing: .1em; text-transform: uppercase; color: #9a8f80; }
        .mock-foot { display: flex; justify-content: space-between; gap: 18px; margin-top: 38px; padding-top: 14px; border-top: 1px solid #cfc5b6; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; color: #8b8173; }
        .mock-foot a { color: inherit; text-decoration: none; }
        .mock-foot a:hover { color: #171511; }
        .mock-object:focus-visible, .mock-foot a:focus-visible { outline: 2px solid #171511; outline-offset: 3px; }
        @media (max-width: 800px) {
          .mock-desk { padding-top: 18px; }
          .mock-grid { grid-template-columns: 1fr; gap: 12px; }
          .mock-copy { max-width: 100%; }
          .mock-copy h1 { font-size: clamp(3.5rem, 17vw, 5.4rem); }
          .mock-intro { margin-top: 20px; max-width: 38ch; }
          .mock-scene { min-height: 320px; height: 44vh; order: -1; }
          .mock-work { margin-top: 36px; }
          .mock-row { grid-template-columns: 1fr auto; gap: 4px 14px; }
          .mock-row span { grid-column: 1 / -1; }
          .mock-foot { flex-direction: column; gap: 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mock-object { transition: none; }
        }
      `}</style>

      <header className="mock-top">
        <span className="mock-mark">AL / personal</span>
        <div className="mock-mode" aria-label="Site mode">
          <span className="active">personal</span>
          <span className="slash">/</span>
          <span className="muted">photography</span>
        </div>
      </header>

      <section className="mock-grid">
        <div className="mock-copy">
          <p className="mock-kicker">Computational Media · Georgia Tech</p>
          <h1><span>Andrew</span><span>Liu</span></h1>
          <p className="mock-intro">I build software systems, tools, and small experiments. I also photograph the night.</p>
          <div className="mock-objects" aria-label="Choose an object">
            {ITEMS.map((item, index) => (
              <button key={item.id} type="button" className={`mock-object${selected === index ? ' active' : ''}`} onClick={() => setSelected(index)} aria-pressed={selected === index}>
                {item.label}
              </button>
            ))}
          </div>
          <p className="mock-note">{active.note}</p>
        </div>

        <div className="mock-scene" aria-label="Interactive desk scene">
          <ThreeStage variant="desk" selected={selected} onSelect={setSelected} reduced={reduced} fallbackClass="mock-static" />
          <span className="mock-scene-label">Drag your eye · click an object</span>
        </div>
      </section>

      <section className="mock-work" aria-labelledby="mock-work-title">
        <div className="mock-work-title" id="mock-work-title"><span>Selected work</span><span>2024 — now</span></div>
        <div className="mock-row"><strong>Loom</strong><span>Escrow payments and autonomous fraud agents, from prototype to state machine.</span><em>Systems / AI</em></div>
        <div className="mock-row"><strong>sink</strong><span>A self-hosted Obsidian sync plugin with conflict resolution and a diff view.</span><em>Tooling</em></div>
        <div className="mock-row"><strong>HarmonyAPI</strong><span>A fast healthcare literature API built around retrieval and analysis.</span><em>API / health</em></div>
      </section>

      <footer className="mock-foot">
        <span>Atlanta, Georgia</span>
        <span><a href="https://github.com/aandrx">GitHub</a> · hello@example.com</span>
      </footer>
    </main>
  )
}
