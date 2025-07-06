/**
 * Layer 3: Simplified Positioning & Layout Engine
 *
 * Maps GraphQL AST positions to DOM coordinates for overlay placement.
 * This simplified version focuses on working with Polen's existing infrastructure.
 */

import type { Identifier } from './types.js'

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
    // Get the full text content of the container
    const fullText = containerElement.textContent || ``
    const lines = fullText.split(`\n`)

    // Build a map of line start positions in the full text
    const lineStartPositions: number[] = [0]
    for (let i = 0; i < lines.length - 1; i++) {
      const lineLength = lines[i]?.length ?? 0
      lineStartPositions.push(lineStartPositions[i]! + lineLength + 1) // +1 for newline
    }

    // Process identifiers by line
    for (const identifier of identifiers) {
      const lineIndex = identifier.position.line - 1
      if (lineIndex >= lines.length || lineIndex < 0) continue

      const lineText = lines[lineIndex]
      if (!lineText) continue

      const columnIndex = identifier.position.column - 1

      // Check if the identifier exists at the expected position
      if (lineText.substring(columnIndex).startsWith(identifier.name)) {
        // Calculate the absolute position in the full text
        const lineStartPosition = lineStartPositions[lineIndex] ?? 0
        const absolutePosition = lineStartPosition + columnIndex

        // Check if already wrapped at this specific position
        const existingWrapped = containerElement.querySelectorAll(`[data-graphql-id]`)
        let alreadyWrapped = false
        for (const wrapped of existingWrapped) {
          if (wrapped.textContent === identifier.name) {
            const startPos = parseInt(wrapped.getAttribute(`data-graphql-start`) || `0`)
            if (startPos === identifier.position.start) {
              alreadyWrapped = true
              break
            }
          }
        }
        if (alreadyWrapped) continue

        // Create wrapper span
        const wrapper = document.createElement(`span`)
        const id = `${identifier.position.start}-${identifier.name}-${identifier.kind}`
        wrapper.setAttribute(`data-graphql-id`, id)
        wrapper.setAttribute(`data-graphql-name`, identifier.name)
        wrapper.setAttribute(`data-graphql-kind`, identifier.kind)
        wrapper.setAttribute(`data-graphql-start`, String(identifier.position.start))
        wrapper.setAttribute(`data-graphql-end`, String(identifier.position.end))
        wrapper.setAttribute(`data-graphql-line`, String(identifier.position.line))
        wrapper.setAttribute(`data-graphql-column`, String(identifier.position.column))
        wrapper.setAttribute(`data-graphql-path`, identifier.schemaPath.join(`,`))

        // Find the position in the container and wrap the text
        const walker = document.createTreeWalker(
          containerElement,
          NodeFilter.SHOW_TEXT,
          null,
        )

        let currentPos = 0
        let node: Node | null

        while (node = walker.nextNode()) {
          const textNode = node as Text
          const text = textNode.textContent || ``

          // Check if this text node contains our identifier
          if (currentPos <= absolutePosition && absolutePosition < currentPos + text.length) {
            const relativePos = absolutePosition - currentPos

            if (text.substring(relativePos).startsWith(identifier.name)) {
              // Split the text node
              const before = text.substring(0, relativePos)
              const identifierText = identifier.name
              const after = text.substring(relativePos + identifierText.length)

              const parent = textNode.parentNode!

              if (before) {
                parent.insertBefore(document.createTextNode(before), textNode)
              }

              wrapper.textContent = identifierText
              parent.insertBefore(wrapper, textNode)

              if (after) {
                parent.insertBefore(document.createTextNode(after), textNode)
              }

              parent.removeChild(textNode)
              break
            }
          }

          currentPos += text.length
        }
      }
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
    const wrappedIdentifiers = containerElement.querySelectorAll(`[data-graphql-id]`)

    // Use the provided element for relative positioning, or the container itself
    const referenceElement = relativeToElement || containerElement

    for (const element of wrappedIdentifiers) {
      const id = element.getAttribute(`data-graphql-id`)
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
        name: element.getAttribute(`data-graphql-name`) || ``,
        kind: (element.getAttribute(`data-graphql-kind`) || `Field`) as Identifier[`kind`],
        position: {
          start: parseInt(element.getAttribute(`data-graphql-start`) || `0`),
          end: parseInt(element.getAttribute(`data-graphql-end`) || `0`),
          line: parseInt(element.getAttribute(`data-graphql-line`) || `1`),
          column: parseInt(element.getAttribute(`data-graphql-column`) || `1`),
        },
        schemaPath: (element.getAttribute(`data-graphql-path`) || ``).split(`,`).filter(Boolean),
        context: { selectionPath: [] },
      }

      results.set(id, { position, identifier })
    }

    return results
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
  const overlay = document.createElement(`div`)

  // Base styles for positioning
  overlay.style.position = `absolute`
  overlay.style.top = `${position.top}px`
  overlay.style.left = `${position.left}px`
  overlay.style.width = `${position.width}px`
  overlay.style.height = `${position.height}px`
  overlay.style.cursor = `pointer`
  overlay.style.zIndex = `10`

  // Add custom class if provided
  if (options?.className) {
    overlay.className = options.className
  }

  // Data attributes
  overlay.setAttribute(`data-graphql-overlay`, `true`)
  overlay.setAttribute(`data-graphql-name`, identifier.name)
  overlay.setAttribute(`data-graphql-kind`, identifier.kind)

  // Event handlers
  if (options?.onClick) {
    overlay.addEventListener(`click`, (e) => {
      e.preventDefault()
      options.onClick!(identifier)
    })
  }

  if (options?.onHover) {
    overlay.addEventListener(`mouseenter`, (e) => {
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
