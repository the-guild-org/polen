/**
 * Creates an HTML script tag that injects data into a global variable
 *
 * @param globalName - The name of the global variable (e.g., '__POLEN__')
 * @param data - The data to inject (will be JSON stringified)
 * @returns HTML script tag string ready to inject into HTML
 *
 * @example
 * ```ts
 * const script = createGlobalDataScript('__MY_APP__', { user: { id: 1, name: 'John' } })
 * // Returns: <script>globalThis.__MY_APP__ = {"user":{"id":1,"name":"John"}};</script>
 * ```
 */
export function createGlobalDataScript(globalName: string, data: unknown): string {
  // Validate global name to prevent injection attacks
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(globalName)) {
    throw new Error(`Invalid global variable name: ${globalName}`)
  }

  // JSON.stringify and then escape </script> tags to prevent XSS
  const jsonData = JSON.stringify(data)
    // Escape </script> to prevent breaking out of script tag
    .replace(/<\/script>/gi, '<\\/script>')

  return `<script>globalThis.${globalName} = ${jsonData};</script>`
}

/**
 * Creates a script tag that initializes global data and runs initialization code
 *
 * @param globalName - The name of the global variable
 * @param data - The data to inject
 * @param initCode - Optional initialization code to run after setting the global
 * @returns HTML script tag string
 *
 * @example
 * ```ts
 * const script = createGlobalDataScriptWithInit('__THEME__', { theme: 'dark' }, `
 *   document.documentElement.className = globalThis.__THEME__.theme;
 * `)
 * ```
 */
export function createGlobalDataScriptWithInit(
  globalName: string,
  data: unknown,
  initCode?: string,
): string {
  const dataScript = createGlobalDataScript(globalName, data)

  if (!initCode) {
    return dataScript
  }

  // Remove the closing </script> tag from data script and append init code
  const scriptContent = dataScript.replace('</script>', `\n${initCode}\n</script>`)
  return scriptContent
}

/**
 * Injects a global data script into the head of an HTML document
 *
 * @param html - The HTML document string
 * @param globalName - The name of the global variable
 * @param data - The data to inject
 * @param initCode - Optional initialization code
 * @returns Modified HTML with script injected
 */
export function injectGlobalDataIntoHTML(
  html: string,
  globalName: string,
  data: unknown,
  initCode?: string,
): string {
  const script = initCode
    ? createGlobalDataScriptWithInit(globalName, data, initCode)
    : createGlobalDataScript(globalName, data)

  // Inject at the beginning of head to ensure it runs first
  return html.replace('<head>', `<head>\n${script}`)
}
