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
        const topLocal = [...local.entries()].sort((a, b) => b[1] - a[1])[0]
        perImage.push(topLocal ? toHex(topLocal[0]) : '')
      } catch {
        perImage.push('')
      }
    }

    const colors = [...globalHistogram.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_COLORS)
      .map(([key]) => toHex(key))

    const result: Result = { colors, perImage, ratios }
    cache.set(cacheKey, result)
    return NextResponse.json(result)
  } catch (error) {
    console.error('post-colors error', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ colors: [], perImage: [], ratios: {} })
  }
}