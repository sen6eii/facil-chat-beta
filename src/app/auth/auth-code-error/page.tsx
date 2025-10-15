'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    if (countdown === 0) {
      router.push('/login')
    }

    return () => clearInterval(timer)
  }, [countdown, router])

  return (
    <main className="min-h-screen bg-facil-gris flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Error de Autenticación
          </h1>
          <p className="text-gray-600 mb-6">
            No pudimos completar el proceso de inicio de sesión. Por favor, intenta nuevamente.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-facil-verde text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Volver a intentar
          </button>
          
          <p className="text-sm text-gray-500">
            Serás redirigido automáticamente en {countdown} segundos...
          </p>
        </div>
      </div>
    </main>
  )
}