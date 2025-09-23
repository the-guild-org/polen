import { Ef } from '#dep/effect'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

// Create a processor without syntax highlighting
const createProcessor = () => {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
}

export const parse = (content: string): Ef.Effect<string, Error> =>
  Ef.gen(function*() {
    const result = yield* Ef.tryPromise({
      try: () => createProcessor().process(content),
      catch: (error) => new Error(`Failed to parse markdown: ${String(error)}`),
    })
    return String(result)
  })

export const parseSync = (content: string): string => {
  const result = createProcessor().processSync(content)
  return String(result)
}
