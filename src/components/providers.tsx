'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      disableTransitionOnChange
      enableSystem
    >
      {children}
    </ThemeProvider>
  )
}
