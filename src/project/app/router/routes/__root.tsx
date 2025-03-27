import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { Theme } from '@radix-ui/themes'
import RadixThemesCssUrl from '@radix-ui/themes/styles.css?url'

const component = () => {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Theme>
          <Outlet />
        </Theme>
        <script src="/entry-client.tsx" type="module"></script>
        <Scripts />
      </body>
    </html>
  )
}

export const root = createRootRoute({
  head: () => ({
    links: [
      {
        rel: `stylesheet`,
        href: RadixThemesCssUrl,
      },
    ],
    meta: [
      {
        charSet: `utf-8`,
      },
      {
        name: `viewport`,
        content: `width=device-width, initial-scale=1`,
      },
      {
        title: `My Pollen App`,
      },
    ],
  }),
  component,
})
