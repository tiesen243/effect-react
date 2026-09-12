import '@/globals.css'

import { Providers } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Link, type RouterErrorData } from '@/core/react'

export default function Root({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </head>

      <body className='flex min-h-dvh flex-col font-sans antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export function ErrorBoundary({
  error,
  retry,
}: {
  readonly error: RouterErrorData
  readonly retry?: () => void
}) {
  const status = error.status ?? 500
  const message =
    error.message ?? 'An unexpected error occurred. Please try again later.'
  const details = error.stack && error.status !== 404 ? error.stack : undefined

  return (
    <main className='flex min-h-dvh flex-col items-center justify-center gap-4 p-4'>
      <h1 className='sr-only'>
        {status === 404
          ? 'The requested page could not be found.'
          : 'An unexpected error occurred. Please try again later.'}
      </h1>

      <section className='flex items-center divide-x-2 divide-neutral-500 *:px-2'>
        <Typography variant='h2'>{status}</Typography>
        <Typography className='text-muted-foreground'>{message}</Typography>
      </section>

      {details ? (
        <pre className='max-w-2xl overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm text-muted-foreground'>
          <code>{details}</code>
        </pre>
      ) : null}

      {status === 404 ? (
        <Button render={<Link href='/' />}>Take me home</Button>
      ) : retry ? (
        <Button onClick={retry}>Retry</Button>
      ) : null}
    </main>
  )
}
