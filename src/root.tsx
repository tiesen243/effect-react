import * as Effect from 'effect/Effect'

import { Layout } from '@/framework'

export const RootLayout = Layout.make({
  meta: () =>
    Effect.succeed([
      { title: 'My App' },
      { name: 'description', content: 'My App Description' },
    ]),

  component: ({ children }) =>
    Effect.succeed(
      <html lang='en'>
        <head>
          <meta charSet='UTF-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1' />
        </head>
        <body>{children}</body>
      </html>
    ),

  errorBoundary: ({ error }) =>
    Effect.succeed(<main>{JSON.stringify(error, null, 2)}</main>),
})
