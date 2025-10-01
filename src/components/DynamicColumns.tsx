'use client'

import React, { useEffect, useRef, useState } from 'react'

interface DynamicColumnsProps {
  children: React.ReactNode
  columnWidth?: number
  columnGap?: number
  onRenderComplete?: () => void
}

export default function DynamicColumns({ 
  children, 
  columnWidth = 200, 
  columnGap = 40,
  onRenderComplete
}: DynamicColumnsProps) {
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
      
      // Extract all text as one continuous string
      const extractText = (node: React.ReactNode): string => {
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

      // Helper to create paragraphs for measurement
      const createMeasurementHTML = (text: string) => {
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
        const paragraphsHtml: string[] = []
        let currentParagraph = ''
        
        sentences.forEach((sentence, index) => {
          currentParagraph += (currentParagraph ? ' ' : '') + sentence
          
          if ((index + 1) % 3 === 0 || currentParagraph.length > 300 || index === sentences.length - 1) {
            if (currentParagraph.trim()) {
              paragraphsHtml.push(`<p style="margin: 0 0 16pt 0; font-size: 8pt; line-height: 16pt; word-wrap: break-word; max-width: ${columnWidth}px;">${currentParagraph.trim()}</p>`)
            }
            currentParagraph = ''
          }
        })
        
        return paragraphsHtml.join('')
      }

      // Helper to create React paragraphs
      const createParagraphs = (text: string, keyPrefix: string) => {
        if (!text.trim()) return []
        
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim())
        const paragraphs: React.ReactNode[] = []
        let currentParagraph = ''
        
        sentences.forEach((sentence, index) => {
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
        })
        
        return paragraphs.filter(p => p !== null)
      }

      // Distribute words across columns
      const newColumns: React.ReactNode[] = []
      let remainingWords = [...words]
      let columnIndex = 0

      while (remainingWords.length > 0 && columnIndex < 10) { // Safety limit
        let columnWords: string[] = []
        
        // Build this column word by word until height limit
        for (let i = 0; i < remainingWords.length; i++) {
          const testWords = [...columnWords, remainingWords[i]]
          const testText = testWords.join(' ')
          
          measuringDiv.innerHTML = createMeasurementHTML(testText)
          const currentHeight = measuringDiv.offsetHeight
          
          if (currentHeight > maxColumnHeight && columnWords.length > 0) {
            break
          }
          
          columnWords.push(remainingWords[i])
        }

        // If no words fit (shouldn't happen but safety check)
        if (columnWords.length === 0 && remainingWords.length > 0) {
          columnWords.push(remainingWords[0])
        }

        // Create the column
        const columnText = columnWords.join(' ')
        const paragraphs = createParagraphs(columnText, `col${columnIndex + 1}`)
        
        // Only add column if it has content
        if (paragraphs.length > 0) {
          const columnClassName = columnIndex === 0 ? "first column ie" : "column ie"
          newColumns.push(
            <div key={columnIndex} className={columnClassName} ref={columnIndex === 0 ? firstColumnRef : undefined}>
              {paragraphs}
            </div>
          )
        }

        // Update remaining words
        remainingWords = remainingWords.slice(columnWords.length)
        columnIndex++
      }

      document.body.removeChild(measuringDiv)
      
      // Calculate container width based on number of columns
      const calculateContainerWidth = (columnCount: number) => {
        // Base width accounts for container padding (40px left + 40px right in CSS padding)
        const containerPadding = 80 // Total left + right padding from #container CSS
        
        // Column space calculation
        const totalColumnsWidth = columnCount * columnWidth
        const totalGaps = (columnCount - 1) * columnGap // Gaps between columns
        const columnsSpace = totalColumnsWidth + totalGaps
        
        // Image space - images flow horizontally after content
        // Ensure plenty of space for horizontal image flow
        const imageWidth = 573.244 // Fixed image width from CSS
        const imageMargin = 40 // margin-right between images
        const estimatedImages = 10 // Very generous estimate to force horizontal flow
        const imageSpace = (estimatedImages * imageWidth) + (estimatedImages * imageMargin)
        
        // Total container width: padding + columns + images
        const totalWidth = containerPadding + columnsSpace + imageSpace
        return totalWidth
      }
      
      // Update CSS custom property to adjust container width based on column count
      const containerWidth = calculateContainerWidth(newColumns.length)
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
  }, [children, columnWidth])

  if (isRendering && columns.length === 0) {
    return <div className="columns-loading">Loading...</div>
  }

  return <div key={renderKey}>{columns}</div>
}
