import '@/globals.css'

export function Root(props: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>Vite + Effect RSC</title>
      </head>
      <body>
        <div id='root'>{props.children}</div>
      </body>
    </html>
  )
}
