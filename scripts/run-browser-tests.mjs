import puppeteer from 'puppeteer-core'
import { install, computeExecutablePath, Browser, detectBrowserPlatform } from '@puppeteer/browsers'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { access, cp, mkdtemp, rm, symlink } from 'node:fs/promises'
import { constants } from 'node:fs'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const root = fileURLToPath(new URL('../', import.meta.url))
const dummyDatabaseUrl = 'postgresql://dummy:dummy@127.0.0.1:5432/dummy'
const buildEnv = {
  ...process.env,
  DATABASE_URL: dummyDatabaseUrl,
  DATABASE_URL_POOLING: dummyDatabaseUrl,
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
}
const tempDirs = []
const children = new Set()
let firefox
let cleaningUp = false

function start(command, args, options) {
  const child = spawn(command, args, { stdio: 'inherit', ...options })
  children.add(child)
  child.once('exit', () => children.delete(child))
  return child
}

async function waitForExit(child) {
  if (child.exitCode !== null || child.signalCode !== null) return { code: child.exitCode, signal: child.signalCode }
  const [code, signal] = await once(child, 'exit')
  return { code, signal }
}

async function stopChild(child, name) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  child.kill('SIGTERM')
  const stopped = await Promise.race([waitForExit(child).then(() => true), delay(5000).then(() => false)])
  if (!stopped) {
    console.error(`Cleanup: ${name} did not stop after SIGTERM, sending SIGKILL`)
    child.kill('SIGKILL')
    await waitForExit(child)
  }
}

async function cleanup() {
  if (cleaningUp) return
  cleaningUp = true
  await Promise.all([...children].map((child) => stopChild(child, 'child process')))
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true }).catch((error) => console.error(`Cleanup: could not remove ${dir}:`, error.message))))
}

async function shutdown(signal) {
  console.error(`Received ${signal}; cleaning up isolated browser test resources`)
  await cleanup()
  process.exit(signal === 'SIGINT' ? 130 : 143)
}

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void shutdown(signal) })

async function availablePort() {
  const server = createServer()
  server.unref()
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  return port
}

function copyFilter(source) {
  const relative = path.relative(root, source)
  if (!relative) return true
  const segments = relative.split(path.sep)
  const top = segments[0]
  if (['.git', '.next', 'node_modules', 'out', 'coverage', '.vercel'].includes(top)) return false
  if (top.startsWith('.env')) return false
  if (top.endsWith('.tsbuildinfo')) return false
  if (top === 'scripts' && segments[1] === '.image-cache') return false
  return true
}

async function buildSourceCopy() {
  const sourceDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-browser-source-'))
  tempDirs.push(sourceDir)
  await cp(root, sourceDir, { recursive: true, filter: copyFilter })
  // Reuse installed dependencies without sharing build output with the developer session.
  await symlink(path.join(root, 'node_modules'), path.join(sourceDir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir')
  console.log(`Building isolated source copy: ${sourceDir}`)
  const build = start(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { cwd: sourceDir, env: buildEnv })
  const result = await waitForExit(build)
  if (result.code !== 0) throw new Error(`Isolated production build failed (code ${result.code}, signal ${result.signal ?? 'none'})`)
  return sourceDir
}

async function startServer(sourceDir) {
  const port = await availablePort()
  const nextBin = path.join(sourceDir, 'node_modules', 'next', 'dist', 'bin', 'next')
  const server = start(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: sourceDir, env: buildEnv, stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  const collect = (chunk) => { output = `${output}${chunk}`.slice(-8192) }
  server.stdout?.on('data', collect)
  server.stderr?.on('data', collect)
  const baseUrl = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Isolated server exited before becoming ready (code ${server.exitCode})\n${output}`)
    try {
      const response = await fetch(`${baseUrl}/works/starry-night-2025/`)
      if (response.ok) {
        console.log(`Serving isolated production build at ${baseUrl}`)
        return { server, baseUrl }
      }
    } catch {
      // The server has not bound the loopback port yet.
    }
    await delay(250)
  }
  await stopChild(server, 'server')
  throw new Error(`Isolated server did not become ready within 60s\n${output}`)
}

async function firefoxExecutable() {
  if (process.env.FIREFOX_BIN) return process.env.FIREFOX_BIN
  const platform = detectBrowserPlatform()
  if (!platform) throw new Error(`Cannot resolve Puppeteer Firefox for ${os.platform()} (${os.arch()})`)
  const buildId = puppeteer.PUPPETEER_REVISIONS.firefox
  const cacheDir = process.env.PUPPETEER_CACHE_DIR ?? path.join(os.homedir(), '.cache', 'puppeteer')
  const executablePath = computeExecutablePath({ browser: Browser.FIREFOX, buildId, cacheDir, platform })
  try {
    await access(executablePath, constants.X_OK)
    return executablePath
  } catch {
    console.log(`Installing Puppeteer Firefox ${buildId} into ${cacheDir}`)
    const installed = await install({ browser: Browser.FIREFOX, buildId, cacheDir, platform })
    return installed.executablePath
  }
}

async function runSuite(baseUrl) {
  const executablePath = await firefoxExecutable()
  const port = await availablePort()
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'portfolio-firefox-profile-'))
  tempDirs.push(profileDir)
  console.log(`Launching disposable Firefox: ${executablePath}`)
  // Firefox allows one active WebDriver BiDi session. Spawn it directly and let
  // the suite own that session; launching through puppeteer would consume it
  // here and make the suite fail with "Maximum number of active sessions".
  firefox = start(executablePath, [
    '--remote-debugging-port', String(port),
    '--remote-allow-origins', '*',
    '-profile', profileDir,
    '-new-instance', '-no-remote', '--headless',
  ], { stdio: 'ignore' })
  const endpoint = `ws://127.0.0.1:${port}/session`
  const deadline = Date.now() + 40000
  let ready = false
  while (Date.now() < deadline) {
    if (firefox.exitCode !== null) throw new Error(`Firefox exited before accepting BiDi connections (code ${firefox.exitCode})`)
    try {
      const probe = await puppeteer.connect({ browserWSEndpoint: endpoint, protocol: 'webDriverBiDi' })
      await probe.disconnect()
      ready = true
      break
    } catch {
      await delay(250)
    }
  }
  if (!ready) throw new Error(`Firefox did not accept BiDi connections at ${endpoint} within 40s`)
  const suite = start(process.execPath, [path.join(root, 'tests', 'image-loading.browser.mjs')], {
    cwd: root,
    env: { ...process.env, SITE_URL: baseUrl, BROWSER_WS_ENDPOINT: endpoint },
  })
  const result = await waitForExit(suite)
  if (result.code !== 0) throw new Error(`Browser suite failed (code ${result.code}, signal ${result.signal ?? 'none'})`)
}

let failure
try {
  const sourceDir = await buildSourceCopy()
  const { baseUrl } = await startServer(sourceDir)
  await runSuite(baseUrl)
  console.log('PASS: isolated production browser gate')
} catch (error) {
  failure = error
  console.error(error.stack ?? error.message)
} finally {
  await cleanup()
}

if (failure) process.exitCode = 1
