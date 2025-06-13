import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerRenderWhitespace,
} from '@shikijs/transformers'
import { type BundledLanguage, type BundledTheme, createHighlighter, type Highlighter } from 'shiki'

export interface ShikiOptions {
  themes?: {
    light: BundledTheme
    dark: BundledTheme
  }
  langs?: BundledLanguage[]
  defaultTheme?: 'light' | 'dark'
}

const DEFAULT_THEMES = {
  light: `github-light` as BundledTheme,
  dark: `tokyo-night` as BundledTheme,
}

const DEFAULT_LANGS: BundledLanguage[] = [
  `typescript`,
  `javascript`,
  `jsx`,
  `tsx`,
  `graphql`,
  `json`,
  `yaml`,
  `markdown`,
  `bash`,
  `shell`,
  `css`,
  `html`,
  `sql`,
  `python`,
  `rust`,
  `go`,
  `java`,
  `csharp`,
  `php`,
  `ruby`,
  `swift`,
  `kotlin`,
  `scala`,
  `r`,
  `matlab`,
  `latex`,
  `dockerfile`,
  `makefile`,
  `nginx`,
  `apache`,
  `xml`,
  `toml`,
  `ini`,
  `diff`,
]

// Singleton highlighter instance
let highlighterInstance: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null

export async function getHighlighter(options: ShikiOptions = {}): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  if (!highlighterPromise) {
    const themes = options.themes || DEFAULT_THEMES
    const langs = options.langs || DEFAULT_LANGS

    highlighterPromise = createHighlighter({
      themes: [themes.light, themes.dark],
      langs,
    }).then(highlighter => {
      highlighterInstance = highlighter
      return highlighter
    })
  }

  return highlighterPromise
}

export interface CodeHighlightOptions {
  code: string
  lang?: string
  theme?: 'light' | 'dark'
  showLineNumbers?: boolean
  highlightLines?: number[]
  diffLines?: { add: number[]; remove: number[] }
  focusLines?: number[]
  showInvisibles?: boolean
}

export async function highlightCode({
  code,
  lang = `text`,
  theme = `light`,
  showLineNumbers = false,
  highlightLines = [],
  diffLines,
  focusLines = [],
  showInvisibles = false,
}: CodeHighlightOptions): Promise<string> {
  const highlighter = await getHighlighter()

  const themes = {
    light: DEFAULT_THEMES.light,
    dark: DEFAULT_THEMES.dark,
  }

  const transformers = []

  // Add line numbers transformer if needed
  if (showLineNumbers) {
    // Custom line numbers will be handled in CSS
    transformers.push({
      name: `line-numbers`,
      pre(node: any) {
        node.properties[`data-line-numbers`] = `true`
      },
    })
  }

  // Add highlight transformer
  if (highlightLines.length > 0) {
    transformers.push({
      name: `highlight-lines`,
      line(node: any, line: number) {
        if (highlightLines.includes(line)) {
          node.properties[`data-highlighted`] = `true`
        }
      },
    })
  }

  // Add standard transformers
  transformers.push(
    transformerNotationHighlight(),
    transformerNotationDiff(),
    transformerNotationFocus(),
  )

  if (showInvisibles) {
    transformers.push(transformerRenderWhitespace())
  }

  // Generate HTML with CSS variables for theme switching
  const html = highlighter.codeToHtml(code, {
    lang,
    themes,
    defaultColor: false,
    transformers,
  })

  return html
}

// Re-export types
export type { BundledLanguage, BundledTheme, Highlighter } from 'shiki'
