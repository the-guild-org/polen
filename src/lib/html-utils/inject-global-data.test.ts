import { Test } from '@wollybeard/kit/test'
import { expect } from 'vitest'
import {
  createGlobalDataScript,
  createGlobalDataScriptWithInit,
  injectGlobalDataIntoHTML,
} from './inject-global-data.js'

type CreateGlobalDataScriptInput = { globalName: string; data: any }
type CreateGlobalDataScriptOutput = { shouldThrow?: boolean; contains?: string[]; notContains?: string[] }

// dprint-ignore
Test.Table.suite<CreateGlobalDataScriptInput, CreateGlobalDataScriptOutput>('createGlobalDataScript', [
  { n: 'creates a script tag with JSON data',         i: { globalName: '__TEST__', data: { foo: 'bar', num: 42 } },                                                         o: { contains: ['<script>globalThis.__TEST__ = {"foo":"bar","num":42};</script>'] } },
  { n: 'handles nested data structures',              i: { globalName: '__APP__', data: { user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } } }, o: { contains: ['globalThis.__APP__ =', JSON.stringify({ user: { id: 1, name: 'John' }, settings: { theme: 'dark', notifications: true } })] } },
  { n: 'escapes special characters in data',          i: { globalName: '__SAFE__', data: { html: '</script><script>alert("xss")</script>' } },                               o: { notContains: ['</script><script>'], contains: ['<\\/script>'] } },
  { n: 'throws on invalid global name (starts with number)', i: { globalName: '123invalid', data: {} },                                                                               o: { shouldThrow: true } },
  { n: 'throws on invalid global name (with dash)',   i: { globalName: 'invalid-name', data: {} },                                                                              o: { shouldThrow: true } },
  { n: 'throws on invalid global name (with dot)',    i: { globalName: 'invalid.name', data: {} },                                                                              o: { shouldThrow: true } },
  { n: 'accepts valid global name (underscore)',      i: { globalName: '_valid', data: {} },                                                                                    o: { shouldThrow: false } },
  { n: 'accepts valid global name (dollar)',          i: { globalName: '$valid', data: {} },                                                                                    o: { shouldThrow: false } },
  { n: 'accepts valid global name (alphanumeric)',    i: { globalName: 'VALID_123', data: {} },                                                                                 o: { shouldThrow: false } },
], ({ i, o }) => {
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

type CreateGlobalDataScriptWithInitInput = { globalName: string; data: any; initCode?: string }
type CreateGlobalDataScriptWithInitOutput = { contains?: string[]; exactMatch?: string }

// dprint-ignore
Test.Table.suite<CreateGlobalDataScriptWithInitInput, CreateGlobalDataScriptWithInitOutput>('createGlobalDataScriptWithInit', [
  { n: 'creates script with data and init code',       i: { globalName: '__THEME__', data: { theme: 'dark' }, initCode: 'document.body.className = globalThis.__THEME__.theme;' }, o: { contains: ['globalThis.__THEME__ = {"theme":"dark"};', 'document.body.className = globalThis.__THEME__.theme;'] } },
  { n: 'returns just data script when no init code',   i: { globalName: '__TEST__', data: { foo: 'bar' } },                                                                                        o: { exactMatch: '<script>globalThis.__TEST__ = {"foo":"bar"};</script>' } },
], ({ i, o }) => {
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

type InjectGlobalDataIntoHTMLInput = { globalName: string; data: any; initCode?: string }
type InjectGlobalDataIntoHTMLOutput = { contains: string[] }

// dprint-ignore
Test.Table.suite<InjectGlobalDataIntoHTMLInput, InjectGlobalDataIntoHTMLOutput>('injectGlobalDataIntoHTML', [
  { n: 'injects script into head',                     i: { globalName: '__APP__', data: { version: '1.0' } },                                                              o: { contains: ['<head>\n<script>globalThis.__APP__ = {"version":"1.0"};</script>'] } },
  { n: 'injects script with init code',                i: { globalName: '__CONFIG__', data: { apiUrl: '/api' }, initCode: 'console.log("Config loaded:", globalThis.__CONFIG__);' }, o: { contains: ['globalThis.__CONFIG__ = {"apiUrl":"/api"};', 'console.log("Config loaded:", globalThis.__CONFIG__);'] } },
], ({ i, o }) => {
  const result = injectGlobalDataIntoHTML(sampleHTML, i.globalName, i.data, i.initCode)

  o.contains.forEach((exp: string) => {
    expect(result).toContain(exp)
  })
})
