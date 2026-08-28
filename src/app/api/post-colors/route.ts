import { NextResponse } from 'next/server'
import sharp from 'sharp'

const TOP_COLORS = 5
const SAMPLE = 48

// Quantize channels so visually-similar pixels collapse into the same bucket.
const quantize = (ch: number): number => Math.round(ch / 24) * 24

const toHex = (key: string): string => {
  const [r, g, b] = key.split(',').map(Number)
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// "Most prominent" color for a single image: pick the most colorful color that is
// actually present. Frequency is sublinear (sqrt) so it just needs to appear, not
// dominate. Chroma rewards saturated color, and a "hue purity" term favors
// single-dominant-hue colors (red/green/blue) over secondaries like yellow,
// cyan, magenta - so a bright firework trail doesn't outrank the saturated
// red/green burst color. Brightness is deliberately ignored (user preference).
const perImageColorScore = ([key, count]: [string, number]): number => {
  const [r, g, b] = key.split(',').map(Number)
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  const mid = r + g + b - mx - mn
  const chroma = (mx - mn) / 255
  const purity = (mx - mid) / 255 // 1 for a pure primary, ~0 for a secondary
  return Math.sqrt(count) * (0.1 + 2.6 * chroma + 1.6 * chroma * purity)
}

interface Result {
  colors: string[]
  perImage: string[]
  ratios: Record<string, { w: number; h: number }>
}

// In-memory cache keyed by the joined image URLs so reopening a post (or
// sharing images) never refetches/reprocesses.
const cache = new Map<string, Result>()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const urls: unknown[] = Array.isArray(body?.urls) ? body.urls : []
    const srcs = urls.filter((u): u is string => typeof u === 'string' && /^https:\/\//.test(u))

    if (srcs.length === 0) {
      return NextResponse.json({ colors: [], perImage: [], ratios: {} })
    }

    const cacheKey = srcs.join('|')
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const globalHistogram = new Map<string, number>()
    const perImage: string[] = []
    const ratios: Record<string, { w: number; h: number }> = {}

    for (const url of srcs) {
      try {
        const res = await fetch(url)
        if (!res.ok) {
          perImage.push('')
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        const { data, info } = await sharp(buf)
          .resize({ width: SAMPLE, withoutEnlargement: true })
          .raw()
          .toBuffer({ resolveWithObject: true })

        // Aspect ratio is preserved by single-axis resize, so inform from the
        // sampled size is correct for the full image too.
        ratios[url] = { w: info.width, h: info.height }

        const local = new Map<string, number>()
        const channels = info.channels
        for (let i = 0; i < data.length; i += channels) {
          const key = `${quantize(data[i])},${quantize(data[i + 1])},${quantize(data[i + 2])}`
          globalHistogram.set(key, (globalHistogram.get(key) || 0) + 1)
          local.set(key, (local.get(key) || 0) + 1)
        }
        const topLocal = [...local.entries()].sort((a, b) => perImageColorScore(b) - perImageColorScore(a))[0]
        perImage.push(topLocal ? toHex(topLocal[0]) : '')
      } catch {
        perImage.push('')
      }
    }

    // Pick the top colours for the palette, but weight frequency by brightness so
    // bright subjects (which occupy fewer pixels in dark photos) still surface.
    // A fully black color (L=0) scores count*0.35; a bright one (L=1) scores
    // count*2.0, so a bright color needs roughly a fifth of black's pixels to tie.
    // Pick the top colours for the palette, weighting frequency by "colorfulness":
    // heavily reward saturation/chroma (so blacks & greys fall down the list) and
    // also reward brightness so the picked colours actually read. A neutral grey
    // (chroma 0, luma 1) scores count*0.9; a vivid saturated colour scores ~3x
    // more, so even a modest patch of colour outranks large grey/black bands.
    const score = ([key, count]: [string, number]) => {
      const [r, g, b] = key.split(',').map(Number)
      const mx = Math.max(r, g, b)
      const mn = Math.min(r, g, b)
      const chroma = (mx - mn) / 255
      const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      return count * (0.2 + 2.4 * chroma + 0.7 * luma)
    }
    const colors = [...globalHistogram.entries()]
      .map(([key, count]) => ({ key, score: score([key, count]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_COLORS)
      .map(({ key }) => toHex(key))

    const result: Result = { colors, perImage, ratios }
    cache.set(cacheKey, result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('post-colors error', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ colors: [], perImage: [], ratios: {} })
  }
}