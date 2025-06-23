/**
 * Layer 3: Simplified Positioning & Layout Engine
 *
 * Maps GraphQL AST positions to DOM coordinates for overlay placement.
 * This simplified version focuses on working with Polen's existing infrastructure.
 */

import type { Identifier } from './types.ts'

/**
 * DOM position for rendering overlays
 */
export interface DOMPosition {
  /** Distance from top of container in pixels */
  top: number
  /** Distance from left of container in pixels */
  left: number
  /** Width of the identifier in pixels */
  width: number
  /** Height of the identifier in pixels */
  height: number
}

/**
 * Position calculation result
 */
export interface PositionResult {
  /** The calculated DOM position */
  position: DOMPosition
  /** The identifier this position is for */
  identifier: Identifier
}

/**
 * Simplified position calculator for Shiki-rendered code
 *
 * This version uses a more straightforward approach:
 * 1. Find the line element by line number
 * 2. Search for the identifier text within that line
 * 3. Create a span around the identifier for positioning
 *
 * This approach modifies the DOM but is more reliable for testing
 * and works well with React's reconciliation.
 */
export class SimplePositionCalculator {
  /**
   * Prepare a code block for positioning by wrapping identifiers in spans
   */
  prepareCodeBlock(
    containerElement: Element,
    identifiers: Identifier[],
  ): void {
    // Sort all identifiers by position (right to left, bottom to top)
    const sortedIdentifiers = [...identifiers].sort((a, b) => {
      // Sort by line first (bottom to top)
      if (a.position.line !== b.position.line) {
        return b.position.line - a.position.line
      }
      // Then by column (right to left)
      return b.position.column - a.position.column
    })

    // Process all identifiers
    let wrappedCount = 0
    for (const identifier of sortedIdentifiers) {
      const wrapped = this.wrapIdentifier(containerElement, identifier)
      if (wrapped) wrappedCount++
    }
  }

  /**
   * Get positions of all wrapped identifiers
   */
  getIdentifierPositions(
    containerElement: Element,
    relativeToElement?: Element,
  ): Map<string, PositionResult> {
    const results = new Map<string, PositionResult>()

    // Find all wrapped identifiers
    const wrappedIdentifiers = containerElement.querySelectorAll('[data-graphql-id]')

    // Use the provided element for relative positioning, or the container itself
    const referenceElement = relativeToElement || containerElement

    for (const element of wrappedIdentifiers) {
      const id = element.getAttribute('data-graphql-id')
      if (!id) continue

      // Get position relative to the reference element
      const referenceRect = referenceElement.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()

      const position: DOMPosition = {
        top: elementRect.top - referenceRect.top,
        left: elementRect.left - referenceRect.left,
        width: elementRect.width,
        height: elementRect.height,
      }

      // Reconstruct identifier from data attributes
      const identifier: Identifier = {
        name: element.getAttribute('data-graphql-name') || '',
        kind: (element.getAttribute('data-graphql-kind') || 'Field') as Identifier['kind'],
        position: {
          start: parseInt(element.getAttribute('data-graphql-start') || '0'),
          end: parseInt(element.getAttribute('data-graphql-end') || '0'),
          line: parseInt(element.getAttribute('data-graphql-line') || '1'),
          column: parseInt(element.getAttribute('data-graphql-column') || '1'),
        },
        schemaPath: (element.getAttribute('data-graphql-path') || '').split(',').filter(Boolean),
        context: { selectionPath: [] },
      }

      results.set(id, { position, identifier })
    }

    return results
  }

  /**
   * Wrap an identifier in a span for positioning
   * Returns true if the identifier was successfully wrapped
   */
  private wrapIdentifier(containerElement: Element, identifier: Identifier): boolean {
    const walker = document.createTreeWalker(
      containerElement,
      NodeFilter.SHOW_TEXT,
      null,
    )

    let currentLine = 1
    let currentColumn = 1
    let node: Node | null

    while (node = walker.nextNode()) {
      const textNode = node as Text
      const text = textNode.textContent || ''

      // Check if already wrapped
      if (textNode.parentElement?.hasAttribute('data-graphql-id')) {
        // Update position tracking and continue
        for (const char of text) {
          if (char === '\n') {
            currentLine++
            currentColumn = 1
          } else {
            currentColumn++
          }
        }
        continue
      }

      // Track position in the text
      let textIndex = 0
      while (textIndex < text.length) {
        // Check if we're at the identifier's position
        if (
          currentLine === identifier.position.line
          && currentColumn === identifier.position.column
        ) {
          // Verify it's actually our identifier
          const remainingText = text.substring(textIndex)
          if (remainingText.startsWith(identifier.name)) {
            // Create a unique ID for this identifier
            const id = `${identifier.position.start}-${identifier.name}-${identifier.kind}`

            // Split the text node and wrap the identifier
            const before = text.substring(0, textIndex)
            const after = text.substring(textIndex + identifier.name.length)

            const span = document.createElement('span')
            span.setAttribute('data-graphql-id', id)
            span.setAttribute('data-graphql-name', identifier.name)
            span.setAttribute('data-graphql-kind', identifier.kind)
            span.setAttribute('data-graphql-start', String(identifier.position.start))
            span.setAttribute('data-graphql-end', String(identifier.position.end))
            span.setAttribute('data-graphql-line', String(identifier.position.line))
            span.setAttribute('data-graphql-column', String(identifier.position.column))
            span.setAttribute('data-graphql-path', identifier.schemaPath.join(','))
            span.textContent = identifier.name

            const parent = textNode.parentNode!

            if (before) {
              parent.insertBefore(document.createTextNode(before), textNode)
            }

            parent.insertBefore(span, textNode)

            if (after) {
              parent.insertBefore(document.createTextNode(after), textNode)
            }

            parent.removeChild(textNode)
            return true
          }
        }

        // Update position tracking
        const char = text[textIndex]
        if (char === '\n') {
          currentLine++
          currentColumn = 1
        } else {
          currentColumn++
        }
        textIndex++
      }
    }

    return false // Identifier not found
  }
}

/**
 * Create invisible overlay for a position
 */
export const createSimpleOverlay = (
  position: DOMPosition,
  identifier: Identifier,
  options?: {
    onClick?: (identifier: Identifier) => void
    onHover?: (identifier: Identifier, event: MouseEvent) => void
    className?: string
  },
): HTMLElement => {
  const overlay = document.createElement('div')

  // Base styles for positioning
  overlay.style.position = 'absolute'
  overlay.style.top = `${position.top}px`
  overlay.style.left = `${position.left}px`
  overlay.style.width = `${position.width}px`
  overlay.style.height = `${position.height}px`
  overlay.style.cursor = 'pointer'
  overlay.style.zIndex = '10'

  // Add custom class if provided
  if (options?.className) {
    overlay.className = options.className
  }

  // Data attributes
  overlay.setAttribute('data-graphql-overlay', 'true')
  overlay.setAttribute('data-graphql-name', identifier.name)
  overlay.setAttribute('data-graphql-kind', identifier.kind)

  // Event handlers
  if (options?.onClick) {
    overlay.addEventListener('click', (e) => {
      e.preventDefault()
      options.onClick!(identifier)
    })
  }

  if (options?.onHover) {
    overlay.addEventListener('mouseenter', (e) => {
      options.onHover!(identifier, e)
    })
  }

  return overlay
}

/**
 * Factory function for position calculator
 */
export const createSimplePositionCalculator = (): SimplePositionCalculator => {
  return new SimplePositionCalculator()
}
