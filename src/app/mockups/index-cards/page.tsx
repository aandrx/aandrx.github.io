'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const CARDS = [
  { id: 'loom', title: 'Loom', meta: '01 / systems', note: 'Escrow payments and autonomous fraud agents.', tint: '#eee5d4' },
  { id: 'sink', title: 'sink', meta: '02 / tooling', note: 'Self-hosted Obsidian sync with conflict resolution.', tint: '#d9e0d2' },
  { id: 'harmony', title: 'HarmonyAPI', meta: '03 / api', note: 'Healthcare literature retrieval and analysis.', tint: '#e8d9ce' },
  { id: 'continuum', title: 'Continuum', meta: '04 / infrastructure', note: 'A productivity dashboard across Vue, Flask, Docker and Kubernetes.', tint: '#d7dde5' },
  { id: 'photography', title: 'Photography', meta: '05 / archive', note: 'Night walks, quiet streets, and the people in between.', tint: '#e9e2d2' },
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

const ThreeStage = dynamic(() => import('../three-stage').then((module) => module.ThreeStage), { ssr: false, loading: () => <div className="index-static">Loading the index.</div> })

export default function IndexCardsMockupPage() {
  const [selected, setSelected] = useState(0)
  const reduced = useReducedMotion()
  const card = CARDS[selected]


  return (
    <main className="mock-index">
      <style>{`
        html:has(.mock-index), body:has(.mock-index) { overflow-x: hidden !important; overflow-y: auto !important; background: #f7f4ed; }
        body:has(.mock-index) { color: #211e1a; }
        .mock-index { min-height: 100dvh; max-width: 1380px; margin: 0 auto; padding: 24px clamp(20px, 4vw, 56px) 38px; font: 15px/1.55 ui-sans-serif, system-ui, sans-serif; }
        .mock-index * { box-sizing: border-box; }
        .index-top { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding-bottom: 35px; }
        .index-mark { font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; color: #8c7c6a; }
        .index-mode { display: flex; gap: 8px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; text-transform: uppercase; }
        .index-mode .active { color: #211e1a; }
        .index-mode .muted { color: #ad9e8b; }
        .index-mode .slash { color: #c8baa8; }
        .index-grid { display: grid; grid-template-columns: minmax(250px, .78fr) minmax(400px, 1.22fr); gap: clamp(20px, 5vw, 68px); align-items: center; }
        .index-copy { max-width: 390px; }
        .index-kicker { margin: 0 0 16px; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .15em; text-transform: uppercase; color: #9a8975; }
        .index-copy h1 { margin: 0; font: 400 clamp(3.3rem, 7vw, 6.3rem)/.86 ui-serif, Georgia, serif; letter-spacing: -.07em; }
        .index-copy h1 span { display: block; }
        .index-intro { max-width: 34ch; margin: 26px 0 0; font: 17px/1.55 ui-serif, Georgia, serif; color: #5e5144; }
        .index-scene { position: relative; height: min(58vh, 620px); min-height: 440px; }
        .index-scene canvas { display: block; touch-action: pan-y; }
        .index-scene::before { content: ""; position: absolute; inset: 9% 5% 3%; border-radius: 50%; background: radial-gradient(ellipse, rgba(157, 126, 93, .12), transparent 68%); pointer-events: none; }
        .index-caption { position: absolute; right: 4%; bottom: 1%; display: flex; align-items: center; gap: 9px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; color: #9b8a76; pointer-events: none; }
        .index-caption::before { content: ""; width: 22px; height: 1px; background: #c6b6a2; }
        .index-static { display: grid; height: 100%; place-items: center; color: #9b8a76; font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .index-tabs { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 4px; }
        .index-tab { border: 1px solid #d7cbba; background: transparent; color: #7f6f5d; padding: 7px 9px; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; cursor: pointer; transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease; }
        .index-tab:hover { background: #eee6d9; }
        .index-tab.active { background: #211e1a; border-color: #211e1a; color: #f7f4ed; }
        .index-tab:focus-visible { outline: 2px solid #211e1a; outline-offset: 3px; }
        .index-detail { display: grid; grid-template-columns: 1.1fr 2.1fr auto; gap: 16px; align-items: baseline; margin-top: 30px; padding-top: 15px; border-top: 1px solid #d7cbba; }
        .index-detail strong { font: 400 20px/1.2 ui-serif, Georgia, serif; }
        .index-detail span { color: #776957; font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
        .index-detail em { color: #a2927d; font: 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace; font-style: normal; letter-spacing: .1em; text-transform: uppercase; }
        .index-foot { display: flex; justify-content: space-between; gap: 18px; margin-top: 42px; padding-top: 14px; border-top: 1px solid #d7cbba; color: #978671; font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .1em; text-transform: uppercase; }
        .index-foot a { color: inherit; text-decoration: none; }
        .index-foot a:hover { color: #211e1a; }
        .index-foot a:focus-visible { outline: 2px solid #211e1a; outline-offset: 3px; }
        @media (max-width: 800px) {
          .index-grid { grid-template-columns: 1fr; gap: 8px; }
          .index-copy { max-width: 100%; }
          .index-copy h1 { font-size: clamp(3.5rem, 18vw, 5.5rem); }
          .index-intro { max-width: 39ch; }
          .index-scene { height: 44vh; min-height: 300px; order: -1; }
          .index-detail { grid-template-columns: 1fr auto; gap: 6px 14px; }
          .index-detail span { grid-column: 1 / -1; }
          .index-foot { flex-direction: column; gap: 8px; }
        }
        @media (prefers-reduced-motion: reduce) { .index-tab { transition: none; } }
      `}</style>

      <header className="index-top">
        <span className="index-mark">AL / personal</span>
        <div className="index-mode" aria-label="Site mode"><span className="active">personal</span><span className="slash">/</span><span className="muted">photography</span></div>
      </header>

      <section className="index-grid">
        <div className="index-copy">
          <p className="index-kicker">Index of selected work</p>
          <h1><span>Andrew</span><span>Liu</span></h1>
          <p className="index-intro">A small collection of things I have built, written, and looked at for too long.</p>
          <div className="index-tabs" aria-label="Choose a card">
            {CARDS.map((item, index) => (
              <button key={item.id} type="button" className={`index-tab${selected === index ? ' active' : ''}`} onClick={() => setSelected(index)} aria-pressed={selected === index}>
                {item.title}
              </button>
            ))}
          </div>
        </div>
        <div className="index-scene" aria-label="Interactive index card scene">
          <ThreeStage variant="cards" selected={selected} onSelect={setSelected} reduced={reduced} fallbackClass="index-static" />
          <span className="index-caption">Move your eye · choose a card</span>
        </div>
      </section>

      <div className="index-detail">
        <strong>{card.title}</strong>
        <span>{card.note}</span>
        <em>{card.meta}</em>
      </div>

      <footer className="index-foot">
        <span>Atlanta, Georgia</span>
        <span><a href="https://github.com/aandrx">GitHub</a> · hello@example.com</span>
      </footer>
    </main>
  )
}
