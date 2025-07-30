import { expect } from 'vitest'
import { Test } from '../../../tests/unit/helpers/test.js'
import {
  createGlobalDataScript,
  createGlobalDataScriptWithInit,
  injectGlobalDataIntoHTML,
} from './inject-global-data.js'

// dprint-ignore
Test.suite<{ globalName: string; data: any; shouldThrow?: boolean; expectedContains?: string[]; expectedNotContains?: string[] }>('createGlobalDataScript', [
  { name: 'creates a script tag with JSON data',         globalName: '__TEST__',    data: { foo: 'bar', num: 42 },                                          expectedContains: ['<script>globalThis.__TEST__ = {"foo":"bar","num":42};</script>'] },
  { name: 'handles nested data structures',              globalName: '__APP__',     data: { user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } }, expectedContains: ['globalThis.__APP__ =', JSON.stringify({ user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } })] },
  { name: 'escapes special characters in data',          globalName: '__SAFE__',    data: { html: '</script><script>alert("xss")</script>' },                expectedNotContains: ['</script><script>'], expectedContains: ['<\\/script>'] },
  { name: 'throws on invalid global name (starts with number)', globalName: '123invalid',  data: {},                                                                shouldThrow: true },
  { name: 'throws on invalid global name (with dash)',   globalName: 'invalid-name', data: {},                                                               shouldThrow: true },
  { name: 'throws on invalid global name (with dot)',    globalName: 'invalid.name', data: {},                                                               shouldThrow: true },
  { name: 'accepts valid global name (underscore)',      globalName: '_valid',      data: {},                                                                shouldThrow: false },
  { name: 'accepts valid global name (dollar)',          globalName: '$valid',      data: {},                                                                shouldThrow: false },
  { name: 'accepts valid global name (alphanumeric)',    globalName: 'VALID_123',   data: {},                                                                shouldThrow: false },
], ({ globalName, data, shouldThrow, expectedContains, expectedNotContains }) => {
  if (shouldThrow) {
    expect(() => createGlobalDataScript(globalName, data)).toThrow('Invalid global variable name')
  } else {
    const result = createGlobalDataScript(globalName, data)
    
    if (expectedContains) {
      expectedContains.forEach(expected => {
        if (expected === result) {
          expect(result).toBe(expected)
        } else {
          expect(result).toContain(expected)
        }
      })
    }
    
    if (expectedNotContains) {
      expectedNotContains.forEach(notExpected => {
        expect(result).not.toContain(notExpected)
      })
    }
    
    if (!shouldThrow && !expectedContains && !expectedNotContains) {
      // For valid name tests, just ensure it doesn't throw
      expect(result).toBeDefined()
    }
  }
})

// dprint-ignore
Test.suite<{ globalName: string; data: any; initCode?: string; expectedContains?: string[]; exactMatch?: string }>('createGlobalDataScriptWithInit', [
  { name: 'creates script with data and init code',       globalName: '__THEME__', data: { theme: 'dark' }, initCode: 'document.body.className = globalThis.__THEME__.theme;', expectedContains: ['globalThis.__THEME__ = {"theme":"dark"};', 'document.body.className = globalThis.__THEME__.theme;'] },
  { name: 'returns just data script when no init code',   globalName: '__TEST__',  data: { foo: 'bar' },                                                                                        exactMatch: '<script>globalThis.__TEST__ = {"foo":"bar"};</script>' },
], ({ globalName, data, initCode, expectedContains, exactMatch }) => {
  const result = createGlobalDataScriptWithInit(globalName, data, initCode)
  
  if (exactMatch) {
    expect(result).toBe(exactMatch)
  } else if (expectedContains) {
    expectedContains.forEach(expected => {
      expect(result).toContain(expected)
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
Test.suite<{ globalName: string; data: any; initCode?: string; expectedContains: string[] }>('injectGlobalDataIntoHTML', [
  { name: 'injects script into head',                     globalName: '__APP__',    data: { version: '1.0' },                                               expectedContains: ['<head>\n<script>globalThis.__APP__ = {"version":"1.0"};</script>'] },
  { name: 'injects script with init code',                globalName: '__CONFIG__', data: { apiUrl: '/api' }, initCode: 'console.log("Config loaded:", globalThis.__CONFIG__);', expectedContains: ['globalThis.__CONFIG__ = {"apiUrl":"/api"};', 'console.log("Config loaded:", globalThis.__CONFIG__);'] },
], ({ globalName, data, initCode, expectedContains }) => {
  const result = injectGlobalDataIntoHTML(sampleHTML, globalName, data, initCode)
  
  expectedContains.forEach(expected => {
    expect(result).toContain(expected)
  })
})
