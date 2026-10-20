import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// These tests execute the real publishing script inside a throwaway copy of the
// project, with a stub curl on PATH so no live R2 requests are made. The stub is
// a POSIX shell script; on Windows curl.exe would be resolved instead and could
// reach the network, so report that limit rather than running unsafely.
const platformSkip = process.platform === 'win32'
  ? 'deterministic curl stub requires a POSIX shell; Windows would resolve curl.exe and hit the network'
  : false

const execute = promisify(execFile)
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
// The default target is the checkout script. IMAGE_PUBLISHING_SCRIPT lets a
// reviewer point the same harness at a baseline copy without editing the repo.
const scriptSource = process.env.IMAGE_PUBLISHING_SCRIPT ?? join(projectRoot, 'scripts', 'generate-image-metadata.mjs')
const cacheName = (key) => `${createHash('sha256').update(key).digest('hex')}.json`
const cachedEntry = (overrides = {}) => ({
  algorithm: 1,
  sampleWidth: 720,
  variants: [
    { size: 720, width: 720, height: 480, src: 'https://example.invalid/cached-720w.webp?v=cached', revision: 'cached' },
    { size: 1920, width: 1920, height: 1280, src: 'https://example.invalid/cached-1920w.webp?v=cached', revision: 'cached' },
  ],
  color: '#010203',
  histogram: [['1,2,3', 1]],
  ...overrides,
})

async function createFixture({ analysis, analysisRaw, cache = {}, cacheDirs = [] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'image-publishing-'))
  try {
    const scriptsDir = join(dir, 'scripts')
    const cacheDir = join(scriptsDir, '.image-cache')
    const dataDir = join(dir, 'src', 'data')
    const binDir = join(dir, 'bin')
    const downloadsDir = join(dir, 'downloads')
    const logPath = join(dir, 'curl.log')
    for (const path of [scriptsDir, cacheDir, join(dir, 'src', 'lib'), dataDir, binDir, downloadsDir]) {
      await mkdir(path, { recursive: true })
    }
    await writeFile(join(scriptsDir, 'generate-image-metadata.mjs'), await readFile(scriptSource))
    await writeFile(join(dir, 'src', 'lib', 'image-colors.mjs'), await readFile(join(projectRoot, 'src', 'lib', 'image-colors.mjs')))
    await symlink(join(projectRoot, 'node_modules'), join(dir, 'node_modules'), 'dir')
    await sharp({ create: { width: 720, height: 480, channels: 3, background: { r: 48, g: 120, b: 200 } } })
      .webp().toFile(join(downloadsDir, '720.webp'))
    await sharp({ create: { width: 1920, height: 1280, channels: 3, background: { r: 210, g: 40, b: 90 } } })
      .webp().toFile(join(downloadsDir, '1920.webp'))
    const curl = join(binDir, 'curl')
    await writeFile(curl, `#!/bin/sh
for argument in "$@"; do url="$argument"; done
printf '%s\\n' "$url" >> "$CURL_LOG"
if [ -n "$CURL_FAIL" ]; then exit 22; fi
case "$url" in
  *-720w.webp) cat "$CURL_FIXTURES/720.webp" ;;
  *-1920w.webp) cat "$CURL_FIXTURES/1920.webp" ;;
  *) exit 22 ;;
esac
`)
    await chmod(curl, 0o755)
    const sources = [{ folder: 'fixture-set', sampleWidth: 720, filenames: ['photo-one'] }]
    await writeFile(join(dataDir, 'image-sources.json'), JSON.stringify(sources))
    await writeFile(join(dataDir, 'feed-posts.json'), '[]')
    if (analysis !== undefined) await writeFile(join(dataDir, 'image-analysis.json'), JSON.stringify(analysis))
    if (analysisRaw !== undefined) await writeFile(join(dataDir, 'image-analysis.json'), analysisRaw)
    for (const [key, value] of Object.entries(cache)) {
      await writeFile(join(cacheDir, cacheName(key)), typeof value === 'string' ? value : JSON.stringify(value))
    }
    for (const key of cacheDirs) await mkdir(join(cacheDir, cacheName(key)))

    const fixture = {
      dir,
      async runGenerator({ args = [], fail = false } = {}) {
        const environment = {
          ...process.env,
          PATH: `${binDir}:${process.env.PATH ?? ''}`,
          CURL_LOG: logPath,
          CURL_FIXTURES: downloadsDir,
          CURL_FAIL: fail ? '1' : '',
        }
        const script = join(scriptsDir, 'generate-image-metadata.mjs')
        try {
          const { stdout, stderr } = await execute(process.execPath, [script, ...args], { cwd: dir, env: environment, maxBuffer: 10_000_000 })
          return { code: 0, stdout, stderr }
        } catch (error) {
          return { code: error.code ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' }
        }
      },
      async downloads() {
        try { return (await readFile(logPath, 'utf8')).trim().split('\n').filter(Boolean) }
        catch (error) { if (error.code === 'ENOENT') return []; throw error }
      },
      async readData(name) { return JSON.parse(await readFile(join(dataDir, name), 'utf8')) },
      async readRaw(name) { return readFile(join(dataDir, name), 'utf8') },
      async readCache(key) { return readFile(join(cacheDir, cacheName(key)), 'utf8') },
      async tempFiles() {
        const entries = await readdir(cacheDir)
        return entries.filter((entry) => entry.endsWith('.tmp'))
      },
      async dataTempFiles() {
        const entries = await readdir(dataDir)
        return entries.filter((entry) => entry.endsWith('.tmp'))
      },
      async cleanup() { await rm(dir, { recursive: true, force: true }) },
    }
    return fixture
  } catch (error) {
    // A half-built fixture must not leak its temp root when setup fails.
    await rm(dir, { recursive: true, force: true })
    throw error
  }
}

test('corrupt local cache is treated as a miss in normal mode', { skip: platformSkip }, async () => {
  const fixture = await createFixture({ cache: { 'fixture-set/photo-one': '{"algorithm":1,"sampleWidth":72' } })
  try {
    const result = await fixture.runGenerator()
    assert.equal(result.code, 0, result.stderr)
    assert.equal((await fixture.downloads()).length, 2)
    const analysis = await fixture.readData('image-analysis.json')
    assert.deepEqual(Object.keys(analysis), ['fixture-set/photo-one'])
    assert.equal(analysis['fixture-set/photo-one'].algorithm, 1)
    assert.deepEqual(JSON.parse(await fixture.readCache('fixture-set/photo-one')), analysis['fixture-set/photo-one'])
    assert.deepEqual(await fixture.tempFiles(), [])
    assert.equal((await fixture.readData('image-metadata.json'))['fixture-set/photo-one'].width, 1920)
  } finally {
    await fixture.cleanup()
  }
})

test('refresh ignores a corrupt local cache and stale previous analysis', { skip: platformSkip }, async () => {
  const fixture = await createFixture({
    analysis: { 'fixture-set/photo-one': cachedEntry() },
    cache: { 'fixture-set/photo-one': '{"algorithm":1,"sampleWidth":72' },
  })
  try {
    const result = await fixture.runGenerator({ args: ['--refresh'] })
    assert.equal(result.code, 0, result.stderr)
    assert.equal((await fixture.downloads()).length, 2)
    const analysis = await fixture.readData('image-analysis.json')
    assert.notEqual(analysis['fixture-set/photo-one'].color, '#010203')
    assert.ok(analysis['fixture-set/photo-one'].variants.every(({ revision }) => revision !== 'cached'))
  } finally {
    await fixture.cleanup()
  }
})

test('refresh recovers a new image that has only a truncated local cache', { skip: platformSkip }, async () => {
  // No image-analysis.json entry: this is the confirmed new-registration case.
  const fixture = await createFixture({ cache: { 'fixture-set/photo-one': '{"algorithm":1,"sampleWidth":72' } })
  try {
    const result = await fixture.runGenerator({ args: ['--refresh'] })
    assert.equal(result.code, 0, result.stderr)
    assert.equal((await fixture.downloads()).length, 2)
    assert.deepEqual(JSON.parse(await fixture.readCache('fixture-set/photo-one')), (await fixture.readData('image-analysis.json'))['fixture-set/photo-one'])
  } finally {
    await fixture.cleanup()
  }
})

test('refresh ignores a malformed previous analysis file', { skip: platformSkip }, async () => {
  const fixture = await createFixture({ analysisRaw: '{"algorithm":1,' })
  try {
    const result = await fixture.runGenerator({ args: ['--refresh'] })
    assert.equal(result.code, 0, result.stderr)
    assert.equal((await fixture.downloads()).length, 2)
    assert.equal((await fixture.readData('image-analysis.json'))['fixture-set/photo-one'].algorithm, 1)
  } finally {
    await fixture.cleanup()
  }
})

test('valid local cache is reused without downloading', { skip: platformSkip }, async () => {
  const fixture = await createFixture({ cache: { 'fixture-set/photo-one': cachedEntry() } })
  try {
    const result = await fixture.runGenerator()
    assert.equal(result.code, 0, result.stderr)
    assert.deepEqual(await fixture.downloads(), [])
    const analysis = await fixture.readData('image-analysis.json')
    assert.deepEqual(analysis['fixture-set/photo-one'], cachedEntry())
    assert.equal((await fixture.readData('image-metadata.json'))['fixture-set/photo-one'].color, '#010203')
  } finally {
    await fixture.cleanup()
  }
})

test('refresh fetches instead of reusing valid analysis and cache', { skip: platformSkip }, async () => {
  const fixture = await createFixture({
    analysis: { 'fixture-set/photo-one': cachedEntry() },
    cache: { 'fixture-set/photo-one': cachedEntry() },
  })
  try {
    const result = await fixture.runGenerator({ args: ['--refresh'] })
    assert.equal(result.code, 0, result.stderr)
    const downloads = await fixture.downloads()
    assert.equal(downloads.length, 2)
    assert.ok(downloads.some((url) => url.endsWith('/fixture-set/photo-one-720w.webp')))
    assert.ok(downloads.some((url) => url.endsWith('/fixture-set/photo-one-1920w.webp')))
    const analysis = await fixture.readData('image-analysis.json')
    assert.notEqual(analysis['fixture-set/photo-one'].color, '#010203')
    assert.ok(analysis['fixture-set/photo-one'].variants.every(({ revision }) => revision !== 'cached'))
  } finally {
    await fixture.cleanup()
  }
})

test('stale valid cache is replaced after a successful run with no temp leftovers', { skip: platformSkip }, async () => {
  const fixture = await createFixture({ cache: { 'fixture-set/photo-one': cachedEntry({ sampleWidth: 1920 }) } })
  try {
    const result = await fixture.runGenerator()
    assert.equal(result.code, 0, result.stderr)
    assert.equal((await fixture.downloads()).length, 2)
    const cached = JSON.parse(await fixture.readCache('fixture-set/photo-one'))
    assert.equal(cached.sampleWidth, 720)
    assert.deepEqual(cached, (await fixture.readData('image-analysis.json'))['fixture-set/photo-one'])
    assert.deepEqual(await fixture.tempFiles(), [])
    assert.deepEqual(await fixture.dataTempFiles(), [])
  } finally {
    await fixture.cleanup()
  }
})

test('download failure leaves published manifests byte-identical', { skip: platformSkip }, async () => {
  const fixture = await createFixture()
  const sentinels = {
    'image-analysis.json': '{"sentinel":"analysis"}\n',
    'image-metadata.json': '{"sentinel":"metadata"}\n',
    'post-palettes.json': '{"sentinel":"palettes"}\n',
  }
  try {
    for (const [name, contents] of Object.entries(sentinels)) {
      await writeFile(join(fixture.dir, 'src', 'data', name), contents)
    }
    const result = await fixture.runGenerator({ fail: true })
    assert.notEqual(result.code, 0)
    for (const [name, contents] of Object.entries(sentinels)) {
      assert.equal(await fixture.readRaw(name), contents)
    }
    assert.deepEqual(await fixture.dataTempFiles(), [])
  } finally {
    await fixture.cleanup()
  }
})

test('unexpected local cache filesystem errors still fail the run', { skip: platformSkip }, async () => {
  const fixture = await createFixture({ cacheDirs: ['fixture-set/photo-one'] })
  try {
    const result = await fixture.runGenerator()
    assert.notEqual(result.code, 0)
    await assert.rejects(fixture.readData('image-metadata.json'), { code: 'ENOENT' })
  } finally {
    await fixture.cleanup()
  }
})
