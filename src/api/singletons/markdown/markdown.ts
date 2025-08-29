import { Effect } from 'effect'
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

export const parse = (content: string): Effect.Effect<string, Error> =>
  Effect.gen(function*() {
    const result = yield* Effect.promise(() => createProcessor().process(content))
    return String(result)
  })

export const parseSync = (content: string): string => {
  const result = createProcessor().processSync(content)
  return String(result)
}
