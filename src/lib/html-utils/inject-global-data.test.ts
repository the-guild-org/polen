import { Test } from '@wollybeard/kit/test'
import { expect } from 'vitest'
import {
  createGlobalDataScript,
  createGlobalDataScriptWithInit,
  injectGlobalDataIntoHTML,
} from './inject-global-data.js'

// dprint-ignore
Test.describe('createGlobalDataScript')
  .i<{ globalName: string; data: any }>()
  .o<{ shouldThrow?: boolean; contains?: string[]; notContains?: string[] }>()
  .cases(
    ['creates a script tag with JSON data',         [{ globalName: '__TEST__', data: { foo: 'bar', num: 42 } }],                                                         { contains: ['<script>globalThis.__TEST__ = {"foo":"bar","num":42};</script>'] }],
    ['handles nested data structures',              [{ globalName: '__APP__', data: { user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } } }], { contains: ['globalThis.__APP__ =', JSON.stringify({ user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } })] }],
    ['escapes special characters in data',          [{ globalName: '__SAFE__', data: { html: '</script><script>alert("xss")</script>' } }],                               { notContains: ['</script><script>'], contains: ['<\\/script>'] }],
    ['throws on invalid global name (starts with number)', [{ globalName: '123invalid', data: {} }],                                                                               { shouldThrow: true }],
    ['throws on invalid global name (with dash)',   [{ globalName: 'invalid-name', data: {} }],                                                                              { shouldThrow: true }],
    ['throws on invalid global name (with dot)',    [{ globalName: 'invalid.name', data: {} }],                                                                              { shouldThrow: true }],
    ['accepts valid global name (underscore)',      [{ globalName: '_valid', data: {} }],                                                                                    { shouldThrow: false }],
    ['accepts valid global name (dollar)',          [{ globalName: '$valid', data: {} }],                                                                                    { shouldThrow: false }],
    ['accepts valid global name (alphanumeric)',    [{ globalName: 'VALID_123', data: {} }],                                                                                 { shouldThrow: false }],
  )
  .test((i, o) => {
  if (o.shouldThrow) {
    expect(() => createGlobalDataScript(i.globalName, i.data)).toThrow('Invalid global variable name')
  } else {
    const result = createGlobalDataScript(i.globalName, i.data)

    if (o.contains) {
      o.contains.forEach((exp: string) => {
        if (exp === result) {
          expect(result).toBe(exp)
        } else {
          expect(result).toContain(exp)
        }
      })
    }

    if (o.notContains) {
      o.notContains.forEach((notExp: string) => {
        expect(result).not.toContain(notExp)
      })
    }

    if (o.shouldThrow === false && !o.contains && !o.notContains) {
      // For valid name tests, just ensure it doesn't throw
      expect(result).toBeDefined()
    }
  }
  })

// dprint-ignore
Test.describe('createGlobalDataScriptWithInit')
  .i<{ globalName: string; data: any; initCode?: string }>()
  .o<{ contains?: string[]; exactMatch?: string }>()
  .cases(
    ['creates script with data and init code',       [{ globalName: '__THEME__', data: { theme: 'dark' }, initCode: 'document.body.className = globalThis.__THEME__.theme;' }], { contains: ['globalThis.__THEME__ = {"theme":"dark"};', 'document.body.className = globalThis.__THEME__.theme;'] }],
    ['returns just data script when no init code',   [{ globalName: '__TEST__', data: { foo: 'bar' } }],                                                                                        { exactMatch: '<script>globalThis.__TEST__ = {"foo":"bar"};</script>' }],
  )
  .test((i, o) => {
  const result = createGlobalDataScriptWithInit(i.globalName, i.data, i.initCode)

  if (o.exactMatch) {
    expect(result).toBe(o.exactMatch)
  } else if (o.contains) {
    o.contains.forEach((exp: string) => {
      expect(result).toContain(exp)
    })
    expect(result).toMatch(/<script>.*<\/script>/s)
  }
  })

const sampleHTML = `
<html>
  <head>
    <title>Test</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`

// dprint-ignore
Test.describe('injectGlobalDataIntoHTML')
  .i<{ globalName: string; data: any; initCode?: string }>()
  .o<{ contains: string[] }>()
  .cases(
    ['injects script into head',                     [{ globalName: '__APP__', data: { version: '1.0' } }],                                                              { contains: ['<head>\n<script>globalThis.__APP__ = {"version":"1.0"};</script>'] }],
    ['injects script with init code',                [{ globalName: '__CONFIG__', data: { apiUrl: '/api' }, initCode: 'console.log("Config loaded:", globalThis.__CONFIG__);' }], { contains: ['globalThis.__CONFIG__ = {"apiUrl":"/api"};', 'console.log("Config loaded:", globalThis.__CONFIG__);'] }],
  )
  .test((i, o) => {
  const result = injectGlobalDataIntoHTML(sampleHTML, i.globalName, i.data, i.initCode)

  o.contains.forEach((exp: string) => {
    expect(result).toContain(exp)
  })
  })
