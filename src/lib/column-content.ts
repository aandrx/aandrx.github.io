import React from 'react'

// Run before crossing a server/client boundary when paragraphs originate in a
// server-rendered page. Introspecting streamed/lazy React nodes on the client
// can omit paragraphs that React itself would otherwise render correctly.
export function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return node.toString()
  if (React.isValidElement(node)) return extractText((node.props as { children?: React.ReactNode }).children)
  if (Array.isArray(node)) return node.map(extractText).join('')
  return ''
}

export function extractParagraphs(node: React.ReactNode): string[] {
  if (React.isValidElement(node)) {
    if (node.type === 'p') return [extractText((node.props as { children?: React.ReactNode }).children).trim()]
    if (node.type === 'br') return ['']
    return extractParagraphs((node.props as { children?: React.ReactNode }).children)
  }
  if (Array.isArray(node)) return node.flatMap(extractParagraphs)
  return []
}
