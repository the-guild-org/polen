/**
 * Check if a file path represents a page file (markdown or MDX)
 */
export const isPageFile = (filePath: string, pagesDirectory: string): boolean => {
  return (filePath.endsWith(`.md`) || filePath.endsWith(`.mdx`))
    && filePath.includes(pagesDirectory)
}
