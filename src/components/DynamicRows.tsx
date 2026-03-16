'use client'

import React, { useEffect, useRef, useState } from 'react'

interface DynamicRowsProps {
  children: React.ReactNode
  rowWidth?: number
  rowGap?: number
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

// Helper to create measurement HTML for width calculation
function createMeasurementHTML(text: string, maxWidth: number): string {
  return `<p style="margin: 0; font-size: 8pt; line-height: 16pt; word-wrap: break-word; max-width: ${maxWidth}px; display: inline;">${text}</p>`
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

// Helper to build a single row with words that fit within width limit
function buildSingleRow(
  remainingWords: string[],
  measuringDiv: HTMLElement,
  maxRowWidth: number
): string[] {
  const rowWords: string[] = []
  
  for (const word of remainingWords) {
    const testWords = [...rowWords, word]
    const testText = testWords.join(' ')
    
    measuringDiv.innerHTML = createMeasurementHTML(testText, maxRowWidth)
    const currentWidth = measuringDiv.offsetWidth
    
    if (currentWidth > maxRowWidth && rowWords.length > 0) {
      break
    }
    
    rowWords.push(word)
  }

  // Safety check: ensure at least one word if possible
  if (rowWords.length === 0 && remainingWords.length > 0) {
    rowWords.push(remainingWords[0])
  }

  return rowWords
}

// Helper to create a row React element
function createRowElement(
  rowWords: string[],
  rowIndex: number,
  firstRowRef: React.RefObject<HTMLDivElement>
): React.ReactNode | null {
  if (rowWords.length === 0) {
    return null
  }

  const rowText = rowWords.join(' ')
  const paragraphs = createParagraphs(rowText, `row${rowIndex + 1}`)
  
  if (paragraphs.length === 0) {
    return null
  }

  const rowClassName = rowIndex === 0 ? "first row ie" : "row ie"
  return (
    <div 
      key={rowIndex} 
      className={rowClassName} 
      ref={rowIndex === 0 ? firstRowRef : undefined}
    >
      {paragraphs}
    </div>
  )
}

// Helper to distribute words across rows
function distributeWordsIntoRows(
  words: string[],
  measuringDiv: HTMLElement,
  maxRowWidth: number,
  firstRowRef: React.RefObject<HTMLDivElement>
): React.ReactNode[] {
  const newRows: React.ReactNode[] = []
  let remainingWords = [...words]
  let rowIndex = 0
  const MAX_ROWS = 50

  while (remainingWords.length > 0 && rowIndex < MAX_ROWS) {
    const rowWords = buildSingleRow(
      remainingWords,
      measuringDiv,
      maxRowWidth
    )

    const rowElement = createRowElement(
      rowWords,
      rowIndex,
      firstRowRef
    )

    if (rowElement) {
      newRows.push(rowElement)
    }

    remainingWords = remainingWords.slice(rowWords.length)
    rowIndex++
  }

  return newRows
}

export default function DynamicRows({ 
  children, 
  rowWidth,
  rowGap = 0,
  onRenderComplete
}: Readonly<DynamicRowsProps>) {
  const [rows, setRows] = useState<React.ReactNode[]>([])
  const [renderKey, setRenderKey] = useState(0)
  const [isRendering, setIsRendering] = useState(true)
  const firstRowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      rowizeContent()
    }

    const rowizeContent = () => {
      setIsRendering(true)
      
      const allText = extractText(children).trim()
      if (!allText) {
        setRows([<div key={0} className="first row ie">{children}</div>])
        return
      }

      // Calculate available width
      const viewportWidth = window.innerWidth
      const containerPadding = 320 // 280px left + 40px right
      const calculatedRowWidth = rowWidth || (viewportWidth - containerPadding)

      // Create measuring div
      const measuringDiv = document.createElement('div')
      measuringDiv.style.position = 'absolute'
      measuringDiv.style.left = '-9999px'
      measuringDiv.style.fontSize = '8pt'
      measuringDiv.style.lineHeight = '16pt'
      measuringDiv.style.fontFamily = 'helvetica, arial, sans-serif'
      measuringDiv.style.visibility = 'hidden'
      document.body.appendChild(measuringDiv)

      const words = allText.split(/\s+/)

      // Distribute words across rows using helper function
      const newRows = distributeWordsIntoRows(
        words,
        measuringDiv,
        calculatedRowWidth,
        firstRowRef
      )

      measuringDiv.remove()
      
      setRows(newRows)
      setRenderKey(prev => prev + 1)
      
      // Use setTimeout to ensure DOM has updated before calling completion
      setTimeout(() => {
        setIsRendering(false)
        onRenderComplete?.()
      }, 10)
    }

    // Initial rowization
    rowizeContent()

    // Re-rowize on window resize
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [children, rowWidth, rowGap, onRenderComplete])

  if (isRendering && rows.length === 0) {
    return <div className="rows-loading">Loading...</div>
  }

  return <div key={renderKey} style={{ display: 'flex', flexDirection: 'column', gap: `${rowGap}px` }}>{rows}</div>
}
