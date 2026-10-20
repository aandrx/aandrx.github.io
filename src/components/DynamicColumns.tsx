'use client'

import React, { useEffect, useRef, useState } from 'react'
import { extractParagraphs } from '@/lib/column-content'
import './dynamic-columns.css'

interface DynamicColumnsProps {
  children?: React.ReactNode
  paragraphs?: readonly string[]
  columnWidth?: number
  columnGap?: number
  onRenderComplete?: () => void
}

// Create measurement HTML from an ordered list of paragraph strings
function createMeasurementHTMLFromParagraphs(paragraphs: string[], columnWidth: number): string {
  return paragraphs
    .map((p) =>
      p.trim()
        ? `<p style="margin: 0 0 16pt 0; font-size: 8pt; line-height: 16pt; word-wrap: break-word; max-width: ${columnWidth}px;">${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
        : `<p style="margin: 0 0 16pt 0; font-size: 8pt; line-height: 16pt;">&nbsp;</p>`
    )
    .join('')
}

// Fill a single column with as many whole paragraphs as fit within maxColumnHeight
function buildSingleColumnFromParagraphs(
  remainingParagraphs: string[],
  measuringDiv: HTMLElement,
  columnWidth: number,
  maxColumnHeight: number
): string[] {
  const columnParagraphs: string[] = []

  for (const paragraph of remainingParagraphs) {
    const testParagraphs = [...columnParagraphs, paragraph]
    measuringDiv.innerHTML = createMeasurementHTMLFromParagraphs(testParagraphs, columnWidth)
    const currentHeight = measuringDiv.offsetHeight

    if (currentHeight > maxColumnHeight && columnParagraphs.length > 0) {
      break
    }

    columnParagraphs.push(paragraph)
  }

  // Safety: always place at least one paragraph so we make progress
  if (columnParagraphs.length === 0 && remainingParagraphs.length > 0) {
    columnParagraphs.push(remainingParagraphs[0])
  }

  return columnParagraphs
}

// Create a column React element from an array of paragraph strings
function createColumnElement(
  paragraphs: string[],
  columnIndex: number,
  firstColumnRef: React.RefObject<HTMLDivElement>
): React.ReactNode | null {
  if (paragraphs.length === 0) return null

  const columnClassName = columnIndex === 0 ? 'first column ie' : 'column ie'
  return (
    <div
      key={columnIndex}
      className={columnClassName}
      ref={columnIndex === 0 ? firstColumnRef : undefined}
    >
      {paragraphs.map((p, i) =>
        p.trim() ? <p key={i}>{p}</p> : <p key={i}>&nbsp;</p>
      )}
    </div>
  )
}

// Distribute paragraphs across columns
function distributeParagraphsIntoColumns(
  paragraphs: string[],
  measuringDiv: HTMLElement,
  columnWidth: number,
  maxColumnHeight: number,
  firstColumnRef: React.RefObject<HTMLDivElement>
): React.ReactNode[] {
  const newColumns: React.ReactNode[] = []
  let remainingParagraphs = [...paragraphs]
  let columnIndex = 0

  while (remainingParagraphs.length > 0) {
    const columnParagraphs = buildSingleColumnFromParagraphs(
      remainingParagraphs,
      measuringDiv,
      columnWidth,
      maxColumnHeight
    )

    const columnElement = createColumnElement(columnParagraphs, columnIndex, firstColumnRef)
    if (columnElement) newColumns.push(columnElement)

    remainingParagraphs = remainingParagraphs.slice(columnParagraphs.length)
    columnIndex++
  }

  return newColumns
}

// Calculate container width based on number of columns
function calculateContainerWidth(columnCount: number, columnWidth: number, columnGap: number): number {
  const containerPadding = 80
  const totalColumnsWidth = columnCount * columnWidth
  const totalGaps = (columnCount - 1) * columnGap
  const columnsSpace = totalColumnsWidth + totalGaps

  const imageWidth = 573.244
  const imageMargin = 40
  const estimatedImages = 10
  const imageSpace = estimatedImages * imageWidth + estimatedImages * imageMargin

  return containerPadding + columnsSpace + imageSpace
}

export default function DynamicColumns({
  children,
  paragraphs: providedParagraphs,
  columnWidth = 200,
  columnGap = 40,
  onRenderComplete,
}: Readonly<DynamicColumnsProps>) {
  const [layout, setLayout] = useState<{ signature: string; columns: React.ReactNode[] }>({ signature: '', columns: [] })
  const firstColumnRef = useRef<HTMLDivElement>(null)
  const completionRef = useRef(onRenderComplete)
  // JSX identity and callback identity are not layout inputs.
  const paragraphSignature = JSON.stringify(providedParagraphs ?? extractParagraphs(children))
  const ready = layout.signature === paragraphSignature || paragraphSignature === '[]'

  useEffect(() => { completionRef.current = onRenderComplete }, [onRenderComplete])

  useEffect(() => {
    const paragraphs: string[] = JSON.parse(paragraphSignature)
    let resizeFrame = 0
    const columnizeContent = () => {
      if (!paragraphs.length) { setLayout({ signature: paragraphSignature, columns: [] }); return }
      const maxColumnHeight = Math.max(1, window.innerHeight - 240)
      const measuringDiv = document.createElement('div')
      Object.assign(measuringDiv.style, {
        position: 'absolute', left: '-9999px', width: `${columnWidth}px`,
        fontSize: '8pt', lineHeight: '16pt', fontFamily: 'helvetica, arial, sans-serif', visibility: 'hidden',
      })
      document.body.appendChild(measuringDiv)
      try {
        const next = distributeParagraphsIntoColumns(paragraphs, measuringDiv, columnWidth, maxColumnHeight, firstColumnRef)
        document.documentElement.style.setProperty('--dynamic-container-width', `${calculateContainerWidth(next.length, columnWidth, columnGap)}px`)
        setLayout({ signature: paragraphSignature, columns: next })
      } finally { measuringDiv.remove() }
    }
    const onResize = () => {
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(columnizeContent)
    }
    columnizeContent()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(resizeFrame); window.removeEventListener('resize', onResize) }
  }, [paragraphSignature, columnWidth, columnGap])

  useEffect(() => {
    if (!ready) return
    const frame = requestAnimationFrame(() => completionRef.current?.())
    return () => cancelAnimationFrame(frame)
  }, [layout, ready])

  // Keep the server-rendered fallback constrained until its paragraphs have
  // been distributed. Only text waits for measurement, never for image loads.
  return (
    <div className="dynamic-columns" data-columns-ready={ready} aria-busy={!ready}>
      {ready && layout.columns.length ? layout.columns : (
        <div className="first column ie">
          {providedParagraphs ? providedParagraphs.map((text, index) => <p key={index}>{text || '\u00a0'}</p>) : children}
        </div>
      )}
    </div>
  )
}
