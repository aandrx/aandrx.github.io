'use client'

import { useEffect, useState } from 'react'

type Track = {
  title: string
  artist: string
  album: string
  albumArt: string | null
  url: string | null
  isPlaying: boolean
  playedAt: string | null
}

type Payload = { configured: boolean; track: Track | null }

const PLAYING_LABELS = [
  'On the stereo',
  'Currently playing',
  'Bopping to',
  'Ear candy',
  'Spinning',
  'Vibing to',
  'Now playing',
  'Locked into',
  'Soundtracking',
  'On repeat',
]

const IDLE_LABELS = [
  'Last played',
  'Most recently',
  'Still stuck on',
  'Left on repeat',
  'Recently spinning',
  'Last heard',
  'Still humming',
  'Paused on',
  'Last in queue',
  'Coming back to',
]

export default function SpotifyStatus() {
  const [track, setTrack] = useState<Track | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [playingLabel, setPlayingLabel] = useState(PLAYING_LABELS[0])
  const [idleLabel, setIdleLabel] = useState(IDLE_LABELS[0])

  useEffect(() => {
    setPlayingLabel(PLAYING_LABELS[Math.floor(Math.random() * PLAYING_LABELS.length)])
    setIdleLabel(IDLE_LABELS[Math.floor(Math.random() * IDLE_LABELS.length)])
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch('/api/spotify', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as Payload
        if (!active) return
        setConfigured(data.configured)
        if (data.track) setTrack(data.track)
      } catch {
        // Keep the last known track on transient failures.
      } finally {
        if (active) setLoaded(true)
      }
    }

    void load()
    const timer = window.setInterval(load, 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (configured === false) {
    return <span className="museum-music-empty">On the stereo / Spotify not connected</span>
  }

  if (!track) {
    return <span className="museum-music-empty">On the stereo / {loaded ? 'No recent track' : 'Loading'}</span>
  }

  const art = track.albumArt && track.albumArt.startsWith('https://') ? track.albumArt : null
  const label = track.isPlaying ? playingLabel : idleLabel
  const content = (
    <>
      <span className="museum-music-copy" aria-live="polite">
        <span className="museum-music-label">{label}</span>{' '}
        <span className="museum-music-title">{track.title},</span>{' '}
        <span>{track.artist}</span>
      </span>
      {art ? <span className="museum-music-art" style={{ backgroundImage: `url("${art}")` }} aria-hidden="true" /> : null}
    </>
  )

  return track.url ? (
    <a className="museum-music" href={track.url} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <span className="museum-music">{content}</span>
  )
}
