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
    // Group identifiers by line for efficiency
    const identifiersByLine = new Map<number, Identifier[]>()

    for (const identifier of identifiers) {
      const line = identifier.position.line
      if (!identifiersByLine.has(line)) {
        identifiersByLine.set(line, [])
      }
      identifiersByLine.get(line)!.push(identifier)
    }

    // Process each line
    const lines = containerElement.querySelectorAll('.line')

    for (const [lineNumber, lineIdentifiers] of identifiersByLine) {
      const lineElement = lines[lineNumber - 1]
      if (!lineElement) continue

      // Sort identifiers by column position (right to left to avoid offset issues)
      const sortedIdentifiers = [...lineIdentifiers].sort(
        (a, b) => b.position.column - a.position.column,
      )

      for (const identifier of sortedIdentifiers) {
        this.wrapIdentifier(lineElement, identifier)
      }
    }
  }

  /**
   * Get positions of all wrapped identifiers
   */
  getIdentifierPositions(
    containerElement: Element,
  ): Map<string, PositionResult> {
    const results = new Map<string, PositionResult>()
    const containerRect = containerElement.getBoundingClientRect()

    // Find all wrapped identifiers
    const wrappedIdentifiers = containerElement.querySelectorAll('[data-graphql-id]')

    for (const element of wrappedIdentifiers) {
      const id = element.getAttribute('data-graphql-id')
      if (!id) continue

      const rect = element.getBoundingClientRect()
      const position: DOMPosition = {
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        width: rect.width,
        height: rect.height,
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
   */
  private wrapIdentifier(lineElement: Element, identifier: Identifier): void {
    const walker = document.createTreeWalker(
      lineElement,
      NodeFilter.SHOW_TEXT,
      null,
    )

    let currentPos = 0
    let node: Node | null

    while (node = walker.nextNode()) {
      const textNode = node as Text
      const text = textNode.textContent || ''

      // Check if this text node contains our identifier
      const identifierIndex = text.indexOf(identifier.name)
      if (identifierIndex !== -1) {
        // Create a unique ID for this identifier
        const id = `${identifier.position.start}-${identifier.name}-${identifier.kind}`

        // Check if already wrapped
        if (textNode.parentElement?.hasAttribute('data-graphql-id')) {
          return
        }

        // Split the text node and wrap the identifier
        const before = text.substring(0, identifierIndex)
        const after = text.substring(identifierIndex + identifier.name.length)

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
        return
      }

      currentPos += text.length
    }
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
