import { describe, expect, test } from 'vitest'
import { assetUrl, faviconUrl, joinPaths, pageUrl } from './asset-url.js'

describe('asset-url helpers', () => {
  describe('joinPaths', () => {
    test('joins base path with asset path', () => {
      expect(joinPaths('/', 'assets/style.css')).toBe('/assets/style.css')
      expect(joinPaths('/my-app/', 'assets/style.css')).toBe('/my-app/assets/style.css')
      expect(joinPaths('/my-app/', '/assets/style.css')).toBe('/my-app/assets/style.css')
    })

    test('handles trailing slash in base', () => {
      expect(joinPaths('/base/', 'path')).toBe('/base/path')
    })

    test('handles leading slash in path', () => {
      expect(joinPaths('/base/', '/path')).toBe('/base/path')
    })
  })

  describe('assetUrl', () => {
    test('creates asset URLs with base path', () => {
      expect(assetUrl('assets/app.js', '/')).toBe('/assets/app.js')
      expect(assetUrl('assets/app.js', '/my-app/')).toBe('/my-app/assets/app.js')
      expect(assetUrl('/assets/app.js', '/my-app/')).toBe('/my-app/assets/app.js')
    })
  })

  describe('faviconUrl', () => {
    test('creates favicon URLs with base path', () => {
      expect(faviconUrl('logo.ico', '/')).toBe('/logo.ico')
      expect(faviconUrl('logo.ico', '/my-app/')).toBe('/my-app/logo.ico')
      expect(faviconUrl('/logo.ico', '/my-app/')).toBe('/my-app/logo.ico')
    })
  })

  describe('pageUrl', () => {
    test('creates page URLs with base path', () => {
      expect(pageUrl('/', '/')).toBe('/')
      expect(pageUrl('', '/')).toBe('/')
      expect(pageUrl('/', '/my-app/')).toBe('/my-app/')
      expect(pageUrl('', '/my-app/')).toBe('/my-app/')
      expect(pageUrl('about', '/my-app/')).toBe('/my-app/about')
      expect(pageUrl('/about', '/my-app/')).toBe('/my-app/about')
    })
  })
})
