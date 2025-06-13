import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeShiki from '@shikijs/rehype'
import rehypeStringify from 'rehype-stringify'

// Create a processor with Shiki for syntax highlighting (async only)
const createProcessorWithShiki = () => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeShiki, {
      themes: {
        light: `github-light`,
        dark: `tokyo-night`,
      },
      defaultColor: false,
      cssVariablePrefix: `--shiki-`,
    })
    .use(rehypeStringify)
}

// Create a processor without syntax highlighting for sync processing
const createProcessorSync = () => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
}

export const parse = async (content: string): Promise<string> => {
  const result = await createProcessorWithShiki().process(content)
  return String(result)
}

export const parseSync = (content: string): string => {
  // Note: Syntax highlighting is not available in sync mode due to @shikijs/rehype being async-only
  const result = createProcessorSync().processSync(content)
  return String(result)
}
