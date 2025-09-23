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

  type ReadCookieInput = { cookieString: string; cookieName?: string }
  type ReadCookieOutput = { value: 'dark' | 'light' | null }
  // dprint-ignore
  Test.Table.suite<ReadCookieInput, ReadCookieOutput>('readCookie', [
      { n: 'reads dark theme from cookie',                i: { cookieString: 'theme=dark' },                                              o: { value: 'dark' } },
      { n: 'reads light theme from cookie',               i: { cookieString: 'theme=light' },                                             o: { value: 'light' } },
      { n: 'reads theme from middle of cookie string',    i: { cookieString: 'other=value; theme=dark; more=stuff' },                     o: { value: 'dark' } },
      { n: 'returns null for invalid theme value',        i: { cookieString: 'theme=invalid' },                                           o: { value: null } },
      { n: 'returns null for empty theme value',          i: { cookieString: 'theme=' },                                                  o: { value: null } },
      { n: 'returns null when theme not in cookie',       i: { cookieString: 'other=value' },                                             o: { value: null } },
      { n: 'returns null for empty cookie string',        i: { cookieString: '' },                                                        o: { value: null } },
      { n: 'handles custom cookie name (found)',          i: { cookieString: 'my-theme=dark', cookieName: 'my-theme' },                   o: { value: 'dark' } },
      { n: 'handles custom cookie name (not found)',      i: { cookieString: 'theme=dark', cookieName: 'my-theme' },                      o: { value: null } },
    ], ({ i, o }) => {
    const manager = i.cookieName ? createThemeManager({ cookieName: i.cookieName }) : createThemeManager()
    expect(manager.readCookie(i.cookieString)).toBe(o.value)
  })

  type WriteCookieInput = {
    theme: 'dark' | 'light'
    options?: { cookieName?: string; maxAge?: number; path?: string }
  }
  type WriteCookieOutput = { value: string }
  // dprint-ignore
  Test.Table.suite<WriteCookieInput, WriteCookieOutput>('writeCookie', [
      { n: 'returns properly formatted cookie string',     i: { theme: 'dark' },                                                            o: { value: 'theme=dark; Max-Age=31536000; Path=/; SameSite=Strict' } },
      { n: 'uses custom options in cookie string',        i: { theme: 'light', options: { cookieName: 'app-theme', maxAge: 3600, path: '/app' } }, o: { value: 'app-theme=light; Max-Age=3600; Path=/app; SameSite=Strict' } },
    ], ({ i, o }) => {
    const manager = i.options ? createThemeManager(i.options) : createThemeManager()
    expect(manager.writeCookie(i.theme)).toBe(o.value)
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

  type GetCurrentFromDOMInput = {
    mockClass?: string
    classPrefix?: string
  }
  type GetCurrentFromDOMOutput = { value: 'dark' | 'light' | null }
  // dprint-ignore
  Test.Table.suite<GetCurrentFromDOMInput, GetCurrentFromDOMOutput>(
    'getCurrentFromDOM',
    [
        { n: 'returns dark theme based on DOM class',       i: { mockClass: 'dark' },                                        o: { value: 'dark' } },
        { n: 'returns light theme based on DOM class',      i: { mockClass: 'light' },                                       o: { value: 'light' } },
        { n: 'returns null when no theme class present',    i: {},                                                           o: { value: null } },
        { n: 'handles custom class prefix',                 i: { mockClass: 'theme-dark', classPrefix: 'theme-' },           o: { value: 'dark' } },
      ],
    ({ i, o }) => {
      // @ts-expect-error - mocking document
      global.document = mockDocument

      const manager = i.classPrefix ? createThemeManager({ classPrefix: i.classPrefix }) : createThemeManager()

      if (i.mockClass) {
        mockDocument.documentElement.classList.contains.mockImplementation((className) => className === i.mockClass)
      } else {
        mockDocument.documentElement.classList.contains.mockReturnValue(false)
      }

      expect(manager.getCurrentFromDOM()).toBe(o.value)
    },
  )

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
