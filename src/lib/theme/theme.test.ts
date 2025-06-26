import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createThemeManager } from './theme.ts'

// Mock document and window
const mockDocument = {
  cookie: '',
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
    },
    setAttribute: vi.fn(), // Keep this for the applyToDOM test
  },
}

const mockWindow = {
  matchMedia: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  mockDocument.cookie = ''
  mockDocument.documentElement.classList.contains.mockReturnValue(false)
  mockWindow.matchMedia.mockReturnValue({ matches: false })
})

describe('Theme', () => {
  describe('createThemeManager', () => {
    test('creates manager with default options', () => {
      const manager = createThemeManager()
      expect(manager).toHaveProperty('readCookie')
      expect(manager).toHaveProperty('writeCookie')
      expect(manager).toHaveProperty('toggle')
    })

    test('creates manager with custom options', () => {
      const manager = createThemeManager({
        cookieName: 'custom-theme',
        classPrefix: 'app-',
        maxAge: 3600,
        path: '/app',
      })
      expect(manager).toBeDefined()
    })
  })

  describe('readCookie', () => {
    test('reads theme from cookie string', () => {
      const manager = createThemeManager()

      expect(manager.readCookie('theme=dark')).toBe('dark')
      expect(manager.readCookie('theme=light')).toBe('light')
      expect(manager.readCookie('other=value; theme=dark; more=stuff')).toBe('dark')
    })

    test('returns null for invalid theme values', () => {
      const manager = createThemeManager()

      expect(manager.readCookie('theme=invalid')).toBe(null)
      expect(manager.readCookie('theme=')).toBe(null)
      expect(manager.readCookie('other=value')).toBe(null)
      expect(manager.readCookie('')).toBe(null)
    })

    test('handles custom cookie name', () => {
      const manager = createThemeManager({ cookieName: 'my-theme' })

      expect(manager.readCookie('my-theme=dark')).toBe('dark')
      expect(manager.readCookie('theme=dark')).toBe(null) // wrong name
    })
  })

  describe('writeCookie', () => {
    test('returns properly formatted cookie string', () => {
      const manager = createThemeManager()

      const cookie = manager.writeCookie('dark')
      expect(cookie).toBe('theme=dark; Max-Age=31536000; Path=/; SameSite=Strict')
    })

    test('uses custom options in cookie string', () => {
      const manager = createThemeManager({
        cookieName: 'app-theme',
        maxAge: 3600,
        path: '/app',
      })

      const cookie = manager.writeCookie('light')
      expect(cookie).toBe('app-theme=light; Max-Age=3600; Path=/app; SameSite=Strict')
    })
  })

  describe('applyToDOM', () => {
    test('adds theme class and removes other theme class', () => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = createThemeManager()

      manager.applyToDOM('dark')

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('dark')
      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith('light')
    })

    test('handles custom class prefix', () => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = createThemeManager({ classPrefix: 'app-' })

      manager.applyToDOM('light')

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('app-light')
      expect(mockDocument.documentElement.classList.remove).toHaveBeenCalledWith('app-dark')
    })

    test('does nothing when document is undefined', () => {
      // @ts-expect-error - mocking undefined document
      global.document = undefined

      const manager = createThemeManager()

      // Should not throw
      expect(() => {
        manager.applyToDOM('dark')
      }).not.toThrow()
    })
  })

  describe('getCurrentFromDOM', () => {
    test('returns theme based on DOM classes', () => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = createThemeManager()

      mockDocument.documentElement.classList.contains.mockImplementation((className) => className === 'dark')
      expect(manager.getCurrentFromDOM()).toBe('dark')

      mockDocument.documentElement.classList.contains.mockImplementation((className) => className === 'light')
      expect(manager.getCurrentFromDOM()).toBe('light')
    })

    test('returns null when no theme class present', () => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = createThemeManager()

      mockDocument.documentElement.classList.contains.mockReturnValue(false)
      expect(manager.getCurrentFromDOM()).toBe(null)
    })

    test('handles custom class prefix', () => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = createThemeManager({ classPrefix: 'theme-' })

      mockDocument.documentElement.classList.contains.mockImplementation((className) => className === 'theme-dark')
      expect(manager.getCurrentFromDOM()).toBe('dark')
    })
  })

  // Toggle behavior is tested via integration tests with Playwright
  // as requested by the user to avoid complex DOM unit testing

  describe('getCSS', () => {
    test('returns CSS with default classes', () => {
      const manager = createThemeManager()
      const css = manager.getCSS()

      expect(css).toContain('html.light')
      expect(css).toContain('html.dark')
      expect(css).toContain('@media (prefers-color-scheme: dark)')
      expect(css).toContain('color-scheme: light')
      expect(css).toContain('color-scheme: dark')
    })

    test('returns CSS with custom class prefix', () => {
      const manager = createThemeManager({ classPrefix: 'app-' })
      const css = manager.getCSS()

      expect(css).toContain('html.app-light')
      expect(css).toContain('html.app-dark')
    })
  })
})
