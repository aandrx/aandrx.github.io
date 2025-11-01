'use client'

import React, { useEffect, useRef, useState } from 'react'

interface DynamicColumnsProps {
  children: React.ReactNode
  columnWidth?: number
  columnGap?: number
  onRenderComplete?: () => void
}

// Helper function to extract text from React nodes
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return node.toString()
  if (React.isValidElement(node)) {
    return extractText(node.props.children)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join(' ')
  }
  return ''
}

// Helper to create measurement HTML for height calculation
function createMeasurementHTML(text: string, columnWidth: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
  const paragraphsHtml: string[] = []
  let currentParagraph = ''
  
  for (const [index, sentence] of sentences.entries()) {
    currentParagraph += (currentParagraph ? ' ' : '') + sentence
    
    if ((index + 1) % 3 === 0 || currentParagraph.length > 300 || index === sentences.length - 1) {
      if (currentParagraph.trim()) {
        paragraphsHtml.push(`<p style="margin: 0 0 16pt 0; font-size: 8pt; line-height: 16pt; word-wrap: break-word; max-width: ${columnWidth}px;">${currentParagraph.trim()}</p>`)
      }
      currentParagraph = ''
    }
  }
  
  return paragraphsHtml.join('')
}

// Helper to create React paragraph elements
function createParagraphs(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text.trim()) return []
  
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
  const paragraphs: React.ReactNode[] = []
  let currentParagraph = ''
  
  for (const [index, sentence] of sentences.entries()) {
    currentParagraph += (currentParagraph ? ' ' : '') + sentence
    
    const shouldBreak = 
      (index + 1) % 3 === 0 || 
      currentParagraph.length > 300 || 
      index === sentences.length - 1
    
    if (shouldBreak && currentParagraph.trim()) {
      paragraphs.push(
        <p key={`${keyPrefix}-p${paragraphs.length}`}>
          {currentParagraph.trim()}
        </p>
      )
      currentParagraph = ''
    }
  }
  
  return paragraphs.filter(p => p !== null)
}

// Helper to build a single column with words that fit within height limit
function buildSingleColumn(
  remainingWords: string[],
  measuringDiv: HTMLElement,
  columnWidth: number,
  maxColumnHeight: number
): string[] {
  const columnWords: string[] = []
  
  for (const word of remainingWords) {
    const testWords = [...columnWords, word]
    const testText = testWords.join(' ')
    
    measuringDiv.innerHTML = createMeasurementHTML(testText, columnWidth)
    const currentHeight = measuringDiv.offsetHeight
    
    if (currentHeight > maxColumnHeight && columnWords.length > 0) {
      break
    }
    
    columnWords.push(word)
  }

  // Safety check: ensure at least one word if possible
  if (columnWords.length === 0 && remainingWords.length > 0) {
    columnWords.push(remainingWords[0])
  }

  return columnWords
}

// Helper to create a column React element
function createColumnElement(
  columnWords: string[],
  columnIndex: number,
  firstColumnRef: React.RefObject<HTMLDivElement>
): React.ReactNode | null {
  if (columnWords.length === 0) {
    return null
  }

  const columnText = columnWords.join(' ')
  const paragraphs = createParagraphs(columnText, `col${columnIndex + 1}`)
  
  if (paragraphs.length === 0) {
    return null
  }

  const columnClassName = columnIndex === 0 ? "first column ie" : "column ie"
  return (
    <div 
      key={columnIndex} 
      className={columnClassName} 
      ref={columnIndex === 0 ? firstColumnRef : undefined}
    >
      {paragraphs}
    </div>
  )
}

// Helper to distribute words across columns
function distributeWordsIntoColumns(
  words: string[],
  measuringDiv: HTMLElement,
  columnWidth: number,
  maxColumnHeight: number,
  firstColumnRef: React.RefObject<HTMLDivElement>
): React.ReactNode[] {
  const newColumns: React.ReactNode[] = []
  let remainingWords = [...words]
  let columnIndex = 0
  const MAX_COLUMNS = 10

  while (remainingWords.length > 0 && columnIndex < MAX_COLUMNS) {
    const columnWords = buildSingleColumn(
      remainingWords,
      measuringDiv,
      columnWidth,
      maxColumnHeight
    )

    const columnElement = createColumnElement(
      columnWords,
      columnIndex,
      firstColumnRef
    )

    if (columnElement) {
      newColumns.push(columnElement)
    }

    remainingWords = remainingWords.slice(columnWords.length)
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
  const imageSpace = (estimatedImages * imageWidth) + (estimatedImages * imageMargin)
  
  return containerPadding + columnsSpace + imageSpace
}

export default function DynamicColumns({ 
  children, 
  columnWidth = 200, 
  columnGap = 40,
  onRenderComplete
}: Readonly<DynamicColumnsProps>) {
  const [columns, setColumns] = useState<React.ReactNode[]>([])
  const [renderKey, setRenderKey] = useState(0)
  const [isRendering, setIsRendering] = useState(true)
  const firstColumnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      columnizeContent()
    }

    const columnizeContent = () => {
      setIsRendering(true)
      
      const allText = extractText(children).trim()
      if (!allText) {
        setColumns([<div key={0} className="first column ie">{children}</div>])
        return
      }

      // Calculate container height based on viewport
      const viewportHeight = window.innerHeight
      const containerPadding = 80
      const infoSectionHeight = 60
      const maxColumnHeight = viewportHeight - containerPadding - infoSectionHeight - 100

      // Create measuring div
      const measuringDiv = document.createElement('div')
      measuringDiv.style.position = 'absolute'
      measuringDiv.style.left = '-9999px'
      measuringDiv.style.width = `${columnWidth}px`
      measuringDiv.style.fontSize = '8pt'
      measuringDiv.style.lineHeight = '16pt'
      measuringDiv.style.fontFamily = 'helvetica, arial, sans-serif'
      measuringDiv.style.visibility = 'hidden'
      document.body.appendChild(measuringDiv)

      const words = allText.split(/\s+/)

      // Distribute words across columns using helper function
      const newColumns = distributeWordsIntoColumns(
        words,
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
      setRenderKey(prev => prev + 1)
      
      // Use setTimeout to ensure DOM has updated before calling completion
      setTimeout(() => {
        setIsRendering(false)
        onRenderComplete?.()
      }, 10)
    }

    // Initial columnization
    columnizeContent()

    // Re-columnize on window resize
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [children, columnWidth, columnGap, onRenderComplete])

  if (isRendering && columns.length === 0) {
    return <div className="columns-loading">Loading...</div>
  }

  return <div key={renderKey}>{columns}</div>
}
