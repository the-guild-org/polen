import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'
import { Theme } from '@radix-ui/themes'
import RadixThemesCssUrl from '@radix-ui/themes/styles.css?url'
import entryClientUrl from '../../entry.client.jsx?worker&url'
import { Scripts } from '@tanstack/react-router'

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
    scripts: [
      {
        src: entryClientUrl,
        type: `module`,
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
