import type { Plugin } from 'vite'

export const OutputLogger: Plugin = {
  name: `output-logger`,
  outputOptions(...args) {
    console.log(`outputOptions`, args)
  },
  renderStart(...args) {
    console.log(`renderStart`, args)
  },
  renderDynamicImport(...args) {
    console.log(`renderDynamicImport`, args)
  },
}
