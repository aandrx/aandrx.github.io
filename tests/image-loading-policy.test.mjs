import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const root = fileURLToPath(new URL('..', import.meta.url))
const routePath = 'src/app/works/project-three/page.tsx'
const eslint = new ESLint({ cwd: root })

async function restrictedMessages(code, filePath = routePath) {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((message) => message.ruleId === 'no-restricted-syntax')
}

test('route-scoped rule rejects direct and computed Image constructors', async (t) => {
  const snippets = [
    'new Image()',
    'new globalThis.Image()',
    'new window.Image()',
    "new globalThis['Image']()",
    'new window["Image"]()',
    'new globalThis[`Image`]()',
    'new window[`Image`]()',
  ]

  for (const snippet of snippets) {
    await t.test(snippet, async () => {
      const messages = await restrictedMessages(snippet)
      assert.equal(messages.length, 1, `${snippet} should be rejected`)
      assert.match(messages[0].message, /ProjectGallery/)
      assert.match(messages[0].message, /PortfolioImage/)
      assert.match(messages[0].message, /src\/data\/image-sources\.json/)
    })
  }
})

test('supported gallery and image JSX is allowed in a route', async () => {
  const code = `
    import Image from 'next/image'
    import ProjectGallery from '@/components/ProjectGallery'
    import PortfolioImage from '@/components/PortfolioImage'

    export default function Page() {
      return (
        <ProjectGallery title="Example" layoutClass="example-layout" images={[]}>
          <Image src="/example.webp" alt="Example" width={100} height={100} />
          <PortfolioImage src="folder/example" alt="Example" />
        </ProjectGallery>
      )
    }
  `

  assert.deepEqual(await restrictedMessages(code), [])
})

test('the rule does not catch non-route code', async () => {
  const code = `
    export function measure() {
      const img = new globalThis.Image()
      const other = new window['Image']()
      return [img, other]
    }
  `

  assert.deepEqual(await restrictedMessages(code, 'src/lib/image-loader.ts'), [])
  assert.deepEqual(await restrictedMessages(code, 'src/app/works/project-three/helper.ts'), [])
})

test('Project Three uses ProjectGallery and no longer probes images before rendering', async () => {
  const source = await readFile(new URL(`../${routePath}`, import.meta.url), 'utf8')

  assert.doesNotMatch(source, /\bnew\s+Image\s*\(/)
  assert.doesNotMatch(source, /\bnew\s+globalThis\s*\.\s*Image\s*\(/)
  assert.doesNotMatch(source, /\bnew\s+window\s*\.\s*Image\s*\(/)
  assert.doesNotMatch(source, /\bnew\s+(?:globalThis|window)\s*\[\s*['"`]Image['"`]\s*\]\s*\(/)
  assert.doesNotMatch(source, /\bPromise\.all\s*\(/)
  assert.doesNotMatch(source, /\bloadSingleImageDimension\b/)
  assert.doesNotMatch(source, /\bimageDimensions\b/)
  assert.doesNotMatch(source, /^['"]use client['"]/m)

  assert.match(source, /import '\.\/project-three\.css'/)
  assert.match(source, /import ProjectGallery from '@\/components\/ProjectGallery'/)
  assert.match(source, /<ProjectGallery title="Project Three" layoutClass="project-three-layout"/)
  assert.match(source, /<p>Add your project description here\.<\/p>/)
  assert.match(source, /<p>You can add multiple paragraphs to describe your project\.<\/p>/)
  assert.match(source, /<p>Update the content and the image filenames array above\.<\/p>/)
})
