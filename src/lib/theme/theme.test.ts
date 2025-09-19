import { Test } from '@wollybeard/kit/test'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createThemeManager } from './theme.js'

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

  // dprint-ignore
  Test.Table.suite<{ cookieString: string; cookieName?: string; expected: 'dark' | 'light' | null }>('readCookie', [
    { name: 'reads dark theme from cookie',                cookieString: 'theme=dark',                         expected: 'dark' },
    { name: 'reads light theme from cookie',               cookieString: 'theme=light',                        expected: 'light' },
    { name: 'reads theme from middle of cookie string',    cookieString: 'other=value; theme=dark; more=stuff', expected: 'dark' },
    { name: 'returns null for invalid theme value',        cookieString: 'theme=invalid',                      expected: null },
    { name: 'returns null for empty theme value',          cookieString: 'theme=',                             expected: null },
    { name: 'returns null when theme not in cookie',       cookieString: 'other=value',                        expected: null },
    { name: 'returns null for empty cookie string',        cookieString: '',                                   expected: null },
    { name: 'handles custom cookie name (found)',          cookieString: 'my-theme=dark',  cookieName: 'my-theme', expected: 'dark' },
    { name: 'handles custom cookie name (not found)',      cookieString: 'theme=dark',     cookieName: 'my-theme', expected: null },
  ], ({ cookieString, cookieName, expected }) => {
    const manager = cookieName ? createThemeManager({ cookieName }) : createThemeManager()
    expect(manager.readCookie(cookieString)).toBe(expected)
  })

  // dprint-ignore
  Test.Table.suite<{ theme: 'dark' | 'light'; options?: { cookieName?: string; maxAge?: number; path?: string }; expected: string }>('writeCookie', [
    { name: 'returns properly formatted cookie string',     theme: 'dark',  expected: 'theme=dark; Max-Age=31536000; Path=/; SameSite=Strict' },
    { name: 'uses custom options in cookie string',        theme: 'light', options: { cookieName: 'app-theme', maxAge: 3600, path: '/app' }, expected: 'app-theme=light; Max-Age=3600; Path=/app; SameSite=Strict' },
  ], ({ theme, options, expected }) => {
    const manager = options ? createThemeManager(options) : createThemeManager()
    expect(manager.writeCookie(theme)).toBe(expected)
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

  // dprint-ignore
  Test.Table.suite<{ mockClass?: string; classPrefix?: string; expected: 'dark' | 'light' | null }>('getCurrentFromDOM', [
    { name: 'returns dark theme based on DOM class',       mockClass: 'dark',                          expected: 'dark' },
    { name: 'returns light theme based on DOM class',      mockClass: 'light',                         expected: 'light' },
    { name: 'returns null when no theme class present',                                                expected: null },
    { name: 'handles custom class prefix',                 mockClass: 'theme-dark', classPrefix: 'theme-', expected: 'dark' },
  ], ({ mockClass, classPrefix, expected }) => {
    // @ts-expect-error - mocking document
    global.document = mockDocument

    const manager = classPrefix ? createThemeManager({ classPrefix }) : createThemeManager()

    if (mockClass) {
      mockDocument.documentElement.classList.contains.mockImplementation((className) => className === mockClass)
    } else {
      mockDocument.documentElement.classList.contains.mockReturnValue(false)
    }

    expect(manager.getCurrentFromDOM()).toBe(expected)
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
