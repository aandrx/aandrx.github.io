import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { combineHistograms, palette, dominantColor, quantize } from '../src/lib/image-colors.mjs'

const read = async (file) => JSON.parse(await readFile(new URL(`../src/data/${file}`, import.meta.url), 'utf8'))
const [sources, metadata, analysis, posts, palettes] = await Promise.all([
  'image-sources.json', 'image-metadata.json', 'image-analysis.json', 'feed-posts.json', 'post-palettes.json',
].map(read))

test('every registered image has verified dimensions, variants and valid color metadata', () => {
  const keys = sources.flatMap(({ folder, filenames }) => filenames.map((filename) => `${folder}/${filename}`))
  assert.equal(new Set(keys).size, keys.length)
  assert.deepEqual(Object.keys(metadata).sort(), [...keys].sort())
  assert.deepEqual(Object.keys(analysis).sort(), [...keys].sort())
  for (const key of keys) {
    const asset = metadata[key]
    assert.ok(asset.width > 0 && asset.height > 0, key)
    assert.match(asset.color, /^#[0-9A-F]{6}$/)
    assert.deepEqual(asset.variants.map((variant) => variant.size), [720, 1920])
    assert.equal(new Set(asset.variants.map((variant) => variant.width)).size, asset.variants.length)
    for (const variant of asset.variants) {
      assert.ok(variant.width > 0 && variant.height > 0)
      assert.match(variant.src, /^https:\/\/pub-a490d2e7f9254d579a1364365ba09b45\.r2\.dev\//)
      assert.match(variant.revision, /^[a-f0-9]{16}$/)
      assert.ok(variant.src.endsWith(`?v=${variant.revision}`))
    }
    for (const entry of analysis[key].histogram) {
      assert.equal(entry.length, 2)
      assert.match(entry[0], /^\d+,\d+,\d+$/)
      assert.ok(entry[0].split(',').every((channel) => Number(channel) <= 255))
      assert.ok(Number.isInteger(entry[1]) && entry[1] > 0)
    }
    assert.equal(dominantColor(new Map(analysis[key].histogram)), asset.color)
  }
})

test('feed selections, independent covers and post palettes stay in sync', () => {
  assert.deepEqual(posts.map((post) => post.id), [13, 12, 9, 10, 11])
  assert.deepEqual(posts.map((post) => post.filenames.length), [21, 10, 7, 2, 3])
  for (const post of posts) {
    const keys = post.filenames.map((filename) => `${post.folder}/${filename}`)
    assert.ok(metadata[`${post.folder}/${post.cover}`])
    assert.deepEqual(palettes[post.id].keys, keys)
    assert.deepEqual(palettes[post.id].colors, palette(combineHistograms(keys.map((key) => analysis[key].histogram))))
  }
  assert.equal(posts[0].cover, 'DSCF3474-Edit')
})

test('precomputed palettes preserve the previous runtime scoring algorithm', () => {
  // Independent reference implementation of the existing post-color score.
  for (const post of posts) {
    const histogram = new Map()
    for (const filename of post.filenames) {
      for (const [key, count] of analysis[`${post.folder}/${filename}`].histogram) histogram.set(key, (histogram.get(key) ?? 0) + count)
    }
    const colors = [...histogram].map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number)
      const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
      const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
      return { key, score: count * (0.2 + 2.4 * chroma + 0.7 * luma) }
    }).sort((a, b) => b.score - a.score).slice(0, 5).map(({ key }) => '#' + key.split(',').map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase())
    assert.deepEqual(colors, palettes[post.id].colors)
  }
})

test('curation recomputes the whole palette, not just a merge of dominant colors', () => {
  const histograms = [
    [['240,0,0', 20], ['0,0,0', 100]],
    [['0,240,0', 20], ['0,0,0', 100]],
  ]
  const combined = combineHistograms(histograms)
  assert.equal(combined.get('0,0,0'), 200)
  assert.deepEqual(palette(combined), ['#00F000', '#F00000', '#000000'])
  assert.deepEqual(palette(new Map(histograms[0])), ['#F00000', '#000000'])
  assert.deepEqual(palette(combineHistograms([])), [])
  assert.equal(quantize(255), 255)
  assert.equal(quantize(0), 0)
})
