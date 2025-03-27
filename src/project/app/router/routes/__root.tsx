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
      </body>
      <script src="/entry-client.tsx" type="module"></script>
      <Scripts />
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
        title: `My Pollen App`,
      },
    ],
  }),
  // scripts() {
  //   console.log(1)
  //   return [
  //     <script src="/entry-client.tsx" type="module"></script>,
  //     <script>console.log('Hello world')</script>,
  //   ]
  // },
  component,
})
