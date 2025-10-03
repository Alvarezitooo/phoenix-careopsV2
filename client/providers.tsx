'use client'

import { AuthProvider } from '@/context/SupabaseAuthContext'
import { QueryProvider } from '@/lib/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryProvider>
  )
}