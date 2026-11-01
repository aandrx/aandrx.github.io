import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/components/museum/museum-wall.tsx', import.meta.url), 'utf8')

test('museum wall renders photograph planes without frame constructs', () => {
  for (const construct of ['FrameStyle', 'FrameProfile', 'FRAME_PROFILES', 'frameGeometry', 'goldOrnamentTexture', 'ExtrudeGeometry']) {
    assert.ok(!source.includes(construct), `museum wall no longer contains ${construct}`)
  }

  assert.match(source, /fitPhotoWithinBounds\(item\.width, item\.height, item\.aspect\)/, 'photograph planes fit the intrinsic aspect inside the item bounds')
  assert.match(source, /new THREE\.PlaneGeometry\(fit\.width, fit\.height\)/, 'photograph planes use the fitted photo dimensions')
  assert.doesNotMatch(source, /new THREE\.PlaneGeometry\(item\.width, item\.height\)/, 'photograph planes no longer use the raw item bounds')
})

test('museum wall displays the full texture without cover-cropping', () => {
  assert.doesNotMatch(source, /texture\.repeat/, 'texture repeat cropping is removed')
  assert.doesNotMatch(source, /texture\.offset/, 'texture offset cropping is removed')
})

test('fitPhotoWithinBounds preserves aspect and touches one bound', () => {
  const match = source.match(/export function fitPhotoWithinBounds[\s\S]*?\n}/)
  assert.ok(match, 'fitPhotoWithinBounds is exported from the museum wall')
  const helperSource = match[0].replace('export ', '').replace(/: number/g, '')
  const fitPhotoWithinBounds = new Function(`${helperSource}; return fitPhotoWithinBounds`)()
  const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} is close to ${expected}`)

  // Tall photo inside a near-matching box: height touches, width shrinks.
  const tall = fitPhotoWithinBounds(1.417, 1.88, 1920 / 2688)
  close(tall.height, 1.88)
  close(tall.width / tall.height, 1920 / 2688)
  assert.ok(tall.width <= 1.417)

  // Wide photo inside a narrower box: width touches, height shrinks.
  const wide = fitPhotoWithinBounds(2.121, 1.54, 1920 / 1371)
  close(wide.width, 2.121)
  close(wide.width / wide.height, 1920 / 1371)
  assert.ok(wide.height <= 1.54)

  // Degenerate aspects fall back to the bounds ratio instead of producing NaN.
  const fallback = fitPhotoWithinBounds(2, 1, 0)
  close(fallback.width, 2)
  close(fallback.height, 1)
})
