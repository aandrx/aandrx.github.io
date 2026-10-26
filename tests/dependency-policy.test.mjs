import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

function range(name) {
  const value = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
  assert.ok(value, `Missing dependency ${name}`)
  return value
}

function major(name) {
  const match = range(name).match(/\d+/)
  assert.ok(match, `Cannot read a major version from ${name}@${range(name)}`)
  return Number(match[0])
}

test('peer-coupled dependencies stay on the same major version', () => {
  const pairs = [
    ['react', 'react-dom'],
    ['react', '@types/react'],
    ['react-dom', '@types/react-dom'],
    ['next', 'eslint-config-next'],
    ['prisma', '@prisma/client'],
  ]

  for (const [left, right] of pairs) {
    assert.equal(
      major(left),
      major(right),
      `${left}@${range(left)} must share a major with ${right}@${range(right)}`,
    )
  }
})
