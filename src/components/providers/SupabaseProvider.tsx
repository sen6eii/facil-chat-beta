'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'

export function SupabaseProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}