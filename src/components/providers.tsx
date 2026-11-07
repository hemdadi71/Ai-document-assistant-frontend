'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/auth-provider'
import { useLocale } from 'next-intl'

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: { retry: 0 },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme="dark"
        dir={locale === 'fa' ? 'rtl' : 'ltr'}
      />
    </QueryClientProvider>
  )
}
