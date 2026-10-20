import { NextResponse } from 'next/server'
import analysisJson from '@/data/image-analysis.json'
import { getPortfolioAsset, imageKey } from '@/lib/portfolio-images'
import { combineHistograms, palette } from '@/lib/image-colors.mjs'

// JSON tuple shapes are validated by the publishing tests.
const analysis = analysisJson as unknown as Record<string, { histogram: [string, number][] }>

// Compatibility endpoint for registered portfolio assets. No remote fetches,
// image decoding, cold analysis, or process-local result cache is needed.
export async function POST(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return NextResponse.json({ error: 'Expected image URLs' }, { status: 400 })
  try {
    const decoder = new TextDecoder()
    let text = ''
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 32_768) {
        await reader.cancel()
        return NextResponse.json({ error: 'Request too large' }, { status: 413 })
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    const { urls } = JSON.parse(text)
    if (!Array.isArray(urls) || urls.length > 64 || urls.some((url) => typeof url !== 'string' || !url.startsWith('https://'))) {
      return NextResponse.json({ error: 'Supply at most 64 registered image URLs' }, { status: 400 })
    }
    const assets = urls.map((url: string) => getPortfolioAsset(url))
    const histograms = urls.map((url: string) => analysis[imageKey(url)].histogram)
    return NextResponse.json({
      colors: palette(combineHistograms(histograms)),
      perImage: assets.map((asset) => asset.color),
      ratios: Object.fromEntries(urls.map((url: string, index: number) => [url, { w: assets[index].width, h: assets[index].height }])),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request or unregistered image. Publish image metadata first.' }, { status: 400 })
  } finally { reader.releaseLock() }
}
