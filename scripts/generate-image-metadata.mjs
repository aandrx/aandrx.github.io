import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { quantize, dominantColor, combineHistograms, palette } from '../src/lib/image-colors.mjs'

const exec = promisify(execFile)
const root = new URL('../', import.meta.url)
const dataPath = (name) => new URL(`src/data/${name}`, root)
const readJson = async (name, fallback) => {
  try { return JSON.parse(await readFile(dataPath(name), 'utf8')) }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error }
}
const sources = await readJson('image-sources.json', [])
const posts = await readJson('feed-posts.json', [])
const refresh = process.argv.includes('--refresh')
// Refresh re-analyzes every source, so never parse a stale (or malformed) prior analysis.
const previous = refresh ? {} : await readJson('image-analysis.json', {})
const base = 'https://pub-a490d2e7f9254d579a1364365ba09b45.r2.dev'
const results = {}
const cacheDir = new URL('scripts/.image-cache/', root)
await mkdir(cacheDir, { recursive: true })
const tasks = sources.flatMap((group) => group.filenames.map((filename) => ({ ...group, filename })))
if (new Set(tasks.map(({ folder, filename }) => `${folder}/${filename}`)).size !== tasks.length) {
  throw new Error('Duplicate image source key')
}

async function download(url) {
  // Finite deadlines/retries and file sizes. All URLs come from the fixed registry.
  const { stdout } = await exec('curl', [
    '-fLsS', '--max-time', '30', '--retry', '2', '--retry-delay', '1',
    '--max-filesize', '20000000', url,
  ], { encoding: 'buffer', maxBuffer: 20_000_000 })
  return stdout
}

async function readLocalCache(cacheFile) {
  let text
  try { text = await readFile(cacheFile, 'utf8') }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error }
  try { return JSON.parse(text) }
  catch (error) {
    // An interrupted earlier run can leave a truncated cache file; treat only
    // malformed JSON as a cache miss. Filesystem errors still surface above.
    if (error instanceof SyntaxError) return undefined
    throw error
  }
}

async function writeLocalCache(cacheFile, value) {
  // Unique sibling file plus rename so readers never observe partial JSON.
  const temporary = new URL(`${cacheFile.href}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, JSON.stringify(value))
    await rename(temporary, cacheFile)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}

let next = 0
async function worker() {
  while (next < tasks.length) {
    const { folder, filename, sampleWidth } = tasks[next++]
    if (!/^[a-zA-Z0-9_-]+$/.test(folder) || !/^[a-zA-Z0-9_-]+$/.test(filename)) {
      throw new Error('Invalid source path')
    }
    const key = `${folder}/${filename}`
    const cacheFile = new URL(`${createHash('sha256').update(key).digest('hex')}.json`, cacheDir)
    let cached
    if (!refresh) {
      cached = previous[key]
      if (!cached) cached = await readLocalCache(cacheFile)
    }
    if (!refresh && cached?.algorithm === 1 && cached?.sampleWidth === sampleWidth) {
      results[key] = cached
      continue
    }
    const variants = []
    let sample
    for (const size of [720, 1920]) {
      const url = `${base}/${key}-${size}w.webp`
      const buffer = await download(url)
      const { width, height } = await sharp(buffer).metadata()
      if (!width || !height) throw new Error(`Missing dimensions: ${url}`)
      const revision = createHash('sha256').update(buffer).digest('hex').slice(0, 16)
      variants.push({ size, width, height, src: `${url}?v=${revision}`, revision })
      if (size === sampleWidth) sample = buffer
    }
    if (!sample) throw new Error(`No sample source for ${key}`)
    const { data, info } = await sharp(sample).resize({ width: 48, withoutEnlargement: true }).raw().toBuffer({ resolveWithObject: true })
    const histogram = new Map()
    for (let i = 0; i < data.length; i += info.channels) {
      const bucket = `${quantize(data[i])},${quantize(data[i + 1])},${quantize(data[i + 2])}`
      histogram.set(bucket, (histogram.get(bucket) || 0) + 1)
    }
    results[key] = { algorithm: 1, sampleWidth, variants, color: dominantColor(histogram), histogram: [...histogram] }
    await writeLocalCache(cacheFile, results[key])
    console.log(`Analyzed ${key}`)
  }
}
await Promise.all(Array.from({ length: 4 }, worker))

const analysis = Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)))
const metadata = Object.fromEntries(Object.entries(analysis).map(([key, { variants, color }]) => {
  const largest = variants[variants.length - 1]
  return [key, { width: largest.width, height: largest.height, color, variants }]
}))
const palettes = {}
for (const post of posts) {
  const keys = post.filenames.map((filename) => `${post.folder}/${filename}`)
  if (!keys.length || keys.some((key) => !analysis[key])) throw new Error(`Missing images in post ${post.id}`)
  if (!analysis[`${post.folder}/${post.cover}`]) throw new Error(`Missing cover for post ${post.id}`)
  palettes[post.id] = { keys, colors: palette(combineHistograms(keys.map((key) => analysis[key].histogram))) }
}
await mkdir(new URL('src/data/', root), { recursive: true })
for (const [name, value] of Object.entries({ 'image-analysis.json': analysis, 'image-metadata.json': metadata, 'post-palettes.json': palettes })) {
  // Generated files are replaced only after the entire registry has succeeded.
  const path = dataPath(name)
  const temporary = new URL(`${path.href}.${randomUUID()}.tmp`)
  try {
    await writeFile(temporary, JSON.stringify(value, null, 2) + '\n')
    await rename(temporary, path)
  } catch (error) {
    await unlink(temporary).catch(() => {})
    throw error
  }
}
console.log(`Generated metadata for ${tasks.length} images and ${posts.length} post palettes. Use --refresh when replacing existing R2 objects.`)
