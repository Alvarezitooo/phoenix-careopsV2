'use client'

import { AuthProvider } from '@/context/SupabaseAuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}