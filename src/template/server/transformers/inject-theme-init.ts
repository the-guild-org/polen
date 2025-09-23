import { Ef } from '#dep/effect'
import { createHtmlTransformer } from '#lib/html-utils/html-transformer'

/**
 * HTML transformer that injects theme initialization script
 * This must run AFTER inject-polen-data transformer since it depends on window.__POLEN__
 */
export const createThemeInitInjector = () => {
  return createHtmlTransformer((html, ___ctx) => {
    // Theme initialization script that runs immediately to prevent FOUC
    const themeInitScript = `
<script>
  // Apply theme immediately to prevent FOUC
  (function() {
    let theme = globalThis.__POLEN__.serverContext.theme;

    // If system preference, detect actual theme
    if (theme === 'system') {
      theme = globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = 'radix-themes ' + theme;
  })();
</script>`

    // Inject the script right after the Polen data script
    // This ensures __POLEN__ is available when this script runs
    return Ef.succeed(html.replace('</head>', `${themeInitScript}\n</head>`))
  })
}
