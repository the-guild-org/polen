import { compile } from '@mdx-js/mdx'
import matter from 'gray-matter'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

export interface CompileMDXResult {
  code: string
  frontmatter: Record<string, any>
}

/**
 * Compile MDX content to JavaScript at runtime
 *
 * @param content - The MDX content to compile
 * @returns The compiled JavaScript code and extracted frontmatter
 */
export async function compileMDX(content: string): Promise<CompileMDXResult> {
  // Extract frontmatter first
  const { content: mdxContent, data: frontmatter } = matter(content)

  // Compile MDX to JavaScript
  const compiled = await compile(mdxContent, {
    jsxImportSource: 'react',
    remarkPlugins: [
      remarkFrontmatter,
      remarkGfm,
    ],
    development: false,
    outputFormat: 'function-body',
  })

  return {
    code: String(compiled.value),
    frontmatter,
  }
}
