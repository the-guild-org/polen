/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { createSimpleOverlay, createSimplePositionCalculator } from './positioning-simple.ts'
import type { Identifier } from './types.ts'

// Helper to create test identifier
const createTestIdentifier = (
  name: string,
  line: number,
  column: number,
  kind: Identifier['kind'] = 'Field',
): Identifier => ({
  name,
  kind,
  position: {
    start: column - 1,
    end: column - 1 + name.length,
    line,
    column,
  },
  schemaPath: [name],
  context: { selectionPath: [] },
})

describe('Simple Positioning Engine', () => {
  describe('SimplePositionCalculator', () => {
    const calculator = createSimplePositionCalculator()

    it('should wrap identifiers in spans', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <pre class="shiki">
          <code>query GetUser {
  user {
    name
  }
}</code>
        </pre>
      `

      const identifiers = [
        createTestIdentifier('query', 1, 1),
        createTestIdentifier('user', 2, 3, 'Field'),
        createTestIdentifier('name', 3, 5, 'Field'),
      ]

      const codeElement = container.querySelector('code')!
      calculator.prepareCodeBlock(codeElement, identifiers)

      // Check that identifiers were wrapped
      const wrappedElements = container.querySelectorAll('[data-graphql-id]')
      expect(wrappedElements.length).toBe(3)

      // Check first wrapped element
      const firstWrapped = wrappedElements[0] as HTMLElement
      expect(firstWrapped.textContent).toBe('query')
      expect(firstWrapped.getAttribute('data-graphql-name')).toBe('query')
      expect(firstWrapped.getAttribute('data-graphql-kind')).toBe('Field')
    })

    it('should handle multiple identifiers in same line', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <pre class="shiki">
          <code>query GetUserById($id: ID!) {</code>
        </pre>
      `

      const identifiers = [
        createTestIdentifier('query', 1, 1),
        createTestIdentifier('GetUserById', 1, 7),
        createTestIdentifier('$id', 1, 19, 'Variable'),
        createTestIdentifier('ID', 1, 24, 'Type'),
      ]

      const codeElement = container.querySelector('code')!
      calculator.prepareCodeBlock(codeElement, identifiers)

      const wrappedElements = container.querySelectorAll('[data-graphql-id]')
      expect(wrappedElements.length).toBe(4)
    })

    it('should get positions of wrapped identifiers', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <pre class="shiki">
          <code>
            <span class="line"><span data-graphql-id="0-user-Field" data-graphql-name="user" data-graphql-kind="Field" data-graphql-start="0" data-graphql-end="4" data-graphql-line="1" data-graphql-column="1" data-graphql-path="user">user</span> {</span>
          </code>
        </pre>
      `

      // Mock getBoundingClientRect
      container.getBoundingClientRect = () => ({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      const userSpan = container.querySelector('[data-graphql-id]') as HTMLElement
      userSpan.getBoundingClientRect = () => ({
        top: 10,
        left: 20,
        right: 60,
        bottom: 30,
        width: 40,
        height: 20,
        x: 20,
        y: 10,
        toJSON: () => ({}),
      })

      const positions = calculator.getIdentifierPositions(container)

      expect(positions.size).toBe(1)
      const result = positions.get('0-user-Field')
      expect(result).toBeDefined()
      expect(result!.position).toEqual({
        top: 10,
        left: 20,
        width: 40,
        height: 20,
      })
      expect(result!.identifier.name).toBe('user')
      expect(result!.identifier.kind).toBe('Field')
    })

    it('should skip already wrapped identifiers', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <pre class="shiki">
          <code><span data-graphql-id="existing">user</span> {</code>
        </pre>
      `

      const identifiers = [
        createTestIdentifier('user', 1, 1),
      ]

      const codeElement = container.querySelector('code')!
      calculator.prepareCodeBlock(codeElement, identifiers)

      // Should still only have one wrapped element
      const wrappedElements = container.querySelectorAll('[data-graphql-id]')
      expect(wrappedElements.length).toBe(1)
      expect(wrappedElements[0]!.getAttribute('data-graphql-id')).toBe('existing')
    })

    it('should handle empty lines gracefully', () => {
      const container = document.createElement('div')
      container.innerHTML = `
        <pre class="shiki">
          <code>query {

  user</code>
        </pre>
      `

      const identifiers = [
        createTestIdentifier('query', 1, 1),
        createTestIdentifier('user', 3, 3),
      ]

      const codeElement = container.querySelector('code')!
      expect(() => {
        calculator.prepareCodeBlock(codeElement, identifiers)
      }).not.toThrow()

      const wrappedElements = container.querySelectorAll('[data-graphql-id]')
      expect(wrappedElements.length).toBe(2)
    })
  })

  describe('createSimpleOverlay', () => {
    it('should create positioned overlay element', () => {
      const position = { top: 10, left: 20, width: 40, height: 20 }
      const identifier = createTestIdentifier('user', 1, 1)

      const overlay = createSimpleOverlay(position, identifier)

      expect(overlay.style.position).toBe('absolute')
      expect(overlay.style.top).toBe('10px')
      expect(overlay.style.left).toBe('20px')
      expect(overlay.style.width).toBe('40px')
      expect(overlay.style.height).toBe('20px')
      expect(overlay.style.cursor).toBe('pointer')
      expect(overlay.getAttribute('data-graphql-overlay')).toBe('true')
      expect(overlay.getAttribute('data-graphql-name')).toBe('user')
      expect(overlay.getAttribute('data-graphql-kind')).toBe('Field')
    })

    it('should handle click events', () => {
      const position = { top: 10, left: 20, width: 40, height: 20 }
      const identifier = createTestIdentifier('user', 1, 1)
      let clickedIdentifier: Identifier | null = null

      const overlay = createSimpleOverlay(position, identifier, {
        onClick: (id) => {
          clickedIdentifier = id
        },
      })

      // Simulate click
      const event = new MouseEvent('click')
      overlay.dispatchEvent(event)

      expect(clickedIdentifier).toBe(identifier)
    })

    it('should handle hover events', () => {
      const position = { top: 10, left: 20, width: 40, height: 20 }
      const identifier = createTestIdentifier('user', 1, 1)
      let hoveredIdentifier: Identifier | null = null

      const overlay = createSimpleOverlay(position, identifier, {
        onHover: (id) => {
          hoveredIdentifier = id
        },
      })

      // Simulate hover
      const event = new MouseEvent('mouseenter')
      overlay.dispatchEvent(event)

      expect(hoveredIdentifier).toBe(identifier)
    })

    it('should apply custom className', () => {
      const position = { top: 10, left: 20, width: 40, height: 20 }
      const identifier = createTestIdentifier('user', 1, 1)

      const overlay = createSimpleOverlay(position, identifier, {
        className: 'custom-overlay-class',
      })

      expect(overlay.className).toBe('custom-overlay-class')
    })
  })
})
