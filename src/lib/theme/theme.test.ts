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
  Test.describe('readCookie')
    .i<{ cookieString: string; cookieName?: string }>()
    .o<'dark' | 'light' | null>()
    .cases(
      ['reads dark theme from cookie',                [{ cookieString: 'theme=dark' }],                                              'dark'],
      ['reads light theme from cookie',               [{ cookieString: 'theme=light' }],                                             'light'],
      ['reads theme from middle of cookie string',    [{ cookieString: 'other=value; theme=dark; more=stuff' }],                     'dark'],
      ['returns null for invalid theme value',        [{ cookieString: 'theme=invalid' }],                                           null],
      ['returns null for empty theme value',          [{ cookieString: 'theme=' }],                                                  null],
      ['returns null when theme not in cookie',       [{ cookieString: 'other=value' }],                                             null],
      ['returns null for empty cookie string',        [{ cookieString: '' }],                                                        null],
      ['handles custom cookie name (found)',          [{ cookieString: 'my-theme=dark', cookieName: 'my-theme' }],                   'dark'],
      ['handles custom cookie name (not found)',      [{ cookieString: 'theme=dark', cookieName: 'my-theme' }],                      null],
    )
    .test((i, o) => {
      const manager = i.cookieName ? createThemeManager({ cookieName: i.cookieName }) : createThemeManager()
      expect(manager.readCookie(i.cookieString)).toBe(o)
    })

  // dprint-ignore
  Test.describe('writeCookie')
    .i<{ theme: 'dark' | 'light'; options?: { cookieName?: string; maxAge?: number; path?: string } }>()
    .o<string>()
    .cases(
      ['returns properly formatted cookie string',     [{ theme: 'dark' }],                                                            'theme=dark; Max-Age=31536000; Path=/; SameSite=Strict'],
      ['uses custom options in cookie string',        [{ theme: 'light', options: { cookieName: 'app-theme', maxAge: 3600, path: '/app' } }], 'app-theme=light; Max-Age=3600; Path=/app; SameSite=Strict'],
    )
    .test((i, o) => {
      const manager = i.options ? createThemeManager(i.options) : createThemeManager()
      expect(manager.writeCookie(i.theme)).toBe(o)
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
  Test.describe('getCurrentFromDOM')
    .i<{ mockClass?: string; classPrefix?: string }>()
    .o<'dark' | 'light' | null>()
    .cases(
      ['returns dark theme based on DOM class',       [{ mockClass: 'dark' }],                                        'dark'],
      ['returns light theme based on DOM class',      [{ mockClass: 'light' }],                                       'light'],
      ['returns null when no theme class present',    [{}],                                                           null],
      ['handles custom class prefix',                 [{ mockClass: 'theme-dark', classPrefix: 'theme-' }],           'dark'],
    )
    .test((i, o) => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = i.classPrefix ? createThemeManager({ classPrefix: i.classPrefix }) : createThemeManager()

      if (i.mockClass) {
        mockDocument.documentElement.classList.contains.mockImplementation((className) => className === i.mockClass)
      } else {
        mockDocument.documentElement.classList.contains.mockReturnValue(false)
      }

      expect(manager.getCurrentFromDOM()).toBe(o)
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
