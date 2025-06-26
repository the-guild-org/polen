import { describe, expect, it } from 'vitest'
import {
  createGlobalDataScript,
  createGlobalDataScriptWithInit,
  injectGlobalDataIntoHTML,
} from './inject-global-data.js'

describe('createGlobalDataScript', () => {
  it('creates a script tag with JSON data', () => {
    const result = createGlobalDataScript('__TEST__', { foo: 'bar', num: 42 })
    expect(result).toBe('<script>globalThis.__TEST__ = {"foo":"bar","num":42};</script>')
  })

  it('handles nested data structures', () => {
    const data = {
      user: { id: 1, name: 'John' },
      settings: { theme: 'dark', notifications: true },
    }
    const result = createGlobalDataScript('__APP__', data)
    expect(result).toContain('globalThis.__APP__ =')
    expect(result).toContain(JSON.stringify(data))
  })

  it('escapes special characters in data', () => {
    const data = { html: '</script><script>alert("xss")</script>' }
    const result = createGlobalDataScript('__SAFE__', data)
    // JSON.stringify escapes the forward slashes
    expect(result).not.toContain('</script><script>')
    expect(result).toContain('<\\/script>')
  })

  it('throws on invalid global names', () => {
    expect(() => createGlobalDataScript('123invalid', {})).toThrow('Invalid global variable name')
    expect(() => createGlobalDataScript('invalid-name', {})).toThrow('Invalid global variable name')
    expect(() => createGlobalDataScript('invalid.name', {})).toThrow('Invalid global variable name')
  })

  it('accepts valid global names', () => {
    expect(() => createGlobalDataScript('_valid', {})).not.toThrow()
    expect(() => createGlobalDataScript('$valid', {})).not.toThrow()
    expect(() => createGlobalDataScript('VALID_123', {})).not.toThrow()
  })
})

describe('createGlobalDataScriptWithInit', () => {
  it('creates script with data and init code', () => {
    const result = createGlobalDataScriptWithInit(
      '__THEME__',
      { theme: 'dark' },
      'document.body.className = globalThis.__THEME__.theme;',
    )
    expect(result).toContain('globalThis.__THEME__ = {"theme":"dark"};')
    expect(result).toContain('document.body.className = globalThis.__THEME__.theme;')
    expect(result).toMatch(/<script>.*<\/script>/s)
  })

  it('returns just data script when no init code provided', () => {
    const result = createGlobalDataScriptWithInit('__TEST__', { foo: 'bar' })
    expect(result).toBe('<script>globalThis.__TEST__ = {"foo":"bar"};</script>')
  })
})

describe('injectGlobalDataIntoHTML', () => {
  const sampleHTML = `
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`

  it('injects script into head', () => {
    const result = injectGlobalDataIntoHTML(sampleHTML, '__APP__', { version: '1.0' })
    expect(result).toContain('<head>\n<script>globalThis.__APP__ = {"version":"1.0"};</script>')
  })

  it('injects script with init code', () => {
    const result = injectGlobalDataIntoHTML(
      sampleHTML,
      '__CONFIG__',
      { apiUrl: '/api' },
      'console.log("Config loaded:", globalThis.__CONFIG__);',
    )
    expect(result).toContain('globalThis.__CONFIG__ = {"apiUrl":"/api"};')
    expect(result).toContain('console.log("Config loaded:", globalThis.__CONFIG__);')
  })
})
