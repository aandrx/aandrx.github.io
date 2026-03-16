'use client'

import React, { useEffect, useRef, useState } from 'react'

interface DynamicColumnsProps {
  children: React.ReactNode
  columnWidth?: number
  columnGap?: number
  onRenderComplete?: () => void
}

// Helper to extract plain text from React nodes (used for <p> content)
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return node.toString()
  if (React.isValidElement(node)) {
    return extractText((node.props as { children?: React.ReactNode }).children)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }
  return ''
}

// Extract each <p> as its own paragraph string, preserving original boundaries
function extractParagraphs(node: React.ReactNode): string[] {
  if (React.isValidElement(node)) {
    const type = node.type as string
    if (type === 'p') {
      const text = extractText((node.props as { children?: React.ReactNode }).children)
      return [text.trim()]
    }
    if (type === 'br') {
      return ['']
    }
    // Recurse into wrapper elements
    return extractParagraphs((node.props as { children?: React.ReactNode }).children)
  }
  if (Array.isArray(node)) {
    return node.flatMap((child) => extractParagraphs(child))
  }
  return []
}

// Create measurement HTML from an ordered list of paragraph strings
function createMeasurementHTMLFromParagraphs(paragraphs: string[], columnWidth: number): string {
  return paragraphs
    .map((p) =>
      p.trim()
        ? `<p style="margin: 0 0 16pt 0; font-size: 8pt; line-height: 16pt; word-wrap: break-word; max-width: ${columnWidth}px;">${p}</p>`
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
  const MAX_COLUMNS = 10

  while (remainingParagraphs.length > 0 && columnIndex < MAX_COLUMNS) {
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
  columnWidth = 200,
  columnGap = 40,
  onRenderComplete,
}: Readonly<DynamicColumnsProps>) {
  const [columns, setColumns] = useState<React.ReactNode[]>([])
  const [renderKey, setRenderKey] = useState(0)
  const [isRendering, setIsRendering] = useState(true)
  const firstColumnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const columnizeContent = () => {
      setIsRendering(true)

      const paragraphs = extractParagraphs(children)

      if (paragraphs.length === 0) {
        setColumns([<div key={0} className="first column ie">{children}</div>])
        return
      }

      // Calculate max column height based on viewport
      const viewportHeight = window.innerHeight
      const containerPadding = 80
      const infoSectionHeight = 60
      const maxColumnHeight = viewportHeight - containerPadding - infoSectionHeight - 100

      // Create off-screen measuring div
      const measuringDiv = document.createElement('div')
      measuringDiv.style.position = 'absolute'
      measuringDiv.style.left = '-9999px'
      measuringDiv.style.width = `${columnWidth}px`
      measuringDiv.style.fontSize = '8pt'
      measuringDiv.style.lineHeight = '16pt'
      measuringDiv.style.fontFamily = 'helvetica, arial, sans-serif'
      measuringDiv.style.visibility = 'hidden'
      document.body.appendChild(measuringDiv)

      const newColumns = distributeParagraphsIntoColumns(
        paragraphs,
        measuringDiv,
        columnWidth,
        maxColumnHeight,
        firstColumnRef
      )

      measuringDiv.remove()

      // Update CSS custom property to adjust container width based on column count
      const containerWidth = calculateContainerWidth(newColumns.length, columnWidth, columnGap)
      document.documentElement.style.setProperty('--dynamic-container-width', `${containerWidth}px`)

      setColumns(newColumns)
      setRenderKey((prev) => prev + 1)

      // Ensure DOM has updated before signalling completion
      setTimeout(() => {
        setIsRendering(false)
        onRenderComplete?.()
      }, 10)
    }

    columnizeContent()
    window.addEventListener('resize', columnizeContent)
    return () => {
      window.removeEventListener('resize', columnizeContent)
    }
  }, [children, columnWidth, columnGap, onRenderComplete])

  if (isRendering && columns.length === 0) {
    return <div className="columns-loading">Loading...</div>
  }

  return <div key={renderKey}>{columns}</div>
}
