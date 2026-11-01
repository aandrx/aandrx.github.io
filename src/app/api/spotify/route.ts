import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type SpotifyTrack = {
  title: string
  artist: string
  album: string
  albumArt: string | null
  url: string | null
  isPlaying: boolean
  playedAt: string | null
}

type SpotifyImage = { url?: string }
type SpotifyArtist = { name?: string }
type SpotifyItem = {
  name?: string
  artists?: SpotifyArtist[]
  album?: { name?: string; images?: SpotifyImage[] }
  external_urls?: { spotify?: string }
}
type SpotifyPayload = {
  is_playing?: boolean
  item?: SpotifyItem | null
  items?: Array<{ track?: SpotifyItem; played_at?: string }>
}

const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API_URL = 'https://api.spotify.com/v1'

let tokenCache: { value: string; expiresAt: number } | null = null
let lastTrack: SpotifyTrack | null = null

function credentials() {
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
  }
}

function toTrack(item: SpotifyItem, isPlaying: boolean, playedAt: string | null): SpotifyTrack | null {
  if (!item.name) return null
  return {
    title: item.name,
    artist: item.artists?.map((artist) => artist.name).filter(Boolean).join(', ') || 'Unknown artist',
    album: item.album?.name || '',
    albumArt: item.album?.images?.[0]?.url || null,
    url: item.external_urls?.spotify || null,
    isPlaying,
    playedAt,
  }
}

async function accessToken(clientId: string, clientSecret: string, refreshToken: string) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.value
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('Spotify token refresh failed')
  const data = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) throw new Error('Spotify token missing')
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return data.access_token
}

async function spotify(path: string, token: string) {
  return fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
}

export async function GET() {
  const { clientId, clientSecret, refreshToken } = credentials()
  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json({ configured: false, track: null }, { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    const token = await accessToken(clientId, clientSecret, refreshToken)
    const current = await spotify('/me/player/currently-playing', token)
    if (current.status === 200) {
      const payload = (await current.json()) as SpotifyPayload
      const track = payload.item ? toTrack(payload.item, Boolean(payload.is_playing), null) : null
      if (track) {
        lastTrack = track
        return NextResponse.json({ configured: true, track }, { headers: { 'Cache-Control': 'no-store' } })
      }
    }

    const recent = await spotify('/me/player/recently-played?limit=1', token)
    if (recent.ok) {
      const payload = (await recent.json()) as SpotifyPayload
      const entry = payload.items?.[0]
      const track = entry?.track ? toTrack(entry.track, false, entry.played_at ?? null) : null
      if (track) {
        lastTrack = track
        return NextResponse.json({ configured: true, track }, { headers: { 'Cache-Control': 'no-store' } })
      }
    }
  } catch {
    // Keep the last successful track visible when Spotify is unavailable.
  }

  return NextResponse.json({ configured: true, track: lastTrack }, { headers: { 'Cache-Control': 'no-store' } })
}
