import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import '@radix-ui/themes/styles.css'
import { Theme } from '@radix-ui/themes'

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
    meta: [
      {
        charSet: `utf-8`,
      },
      {
        name: `viewport`,
        content: `width=device-width, initial-scale=1`,
      },
      {
        title: `TanStack Start Starter`,
      },
    ],
  }),
  component,
})
