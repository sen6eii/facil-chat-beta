'use client'

import { useState, useEffect } from 'react'
import { getDashboardMetrics, getRecentMessages, DashboardMetrics, RecentMessage } from '@/lib/database'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsData, messagesData] = await Promise.all([
          getDashboardMetrics(),
          getRecentMessages(5)
        ])
        
        setMetrics(metricsData)
        setRecentMessages(messagesData)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gris-oscuro">Dashboard</h1>
        <p className="text-gris-medio">Resumen de tu actividad</p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gris-medio">Total Clientes</p>
                <p className="text-2xl font-bold text-gris-oscuro">{metrics.total_clients}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gris-medio">Chats Activos</p>
                <p className="text-2xl font-bold text-gris-oscuro">{metrics.active_clients}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gris-medio">Tasa de Respuesta</p>
                <p className="text-2xl font-bold text-gris-oscuro">
                  {metrics.total_messages > 0 
                    ? Math.round((metrics.messages_replied_within_2h / metrics.incoming_messages) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gris-medio">Mensajes Hoy</p>
                <p className="text-2xl font-bold text-gris-oscuro">{metrics.messages_today}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Messages */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gris-oscuro mb-4">Actividad Reciente</h2>
        {recentMessages.length > 0 ? (
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <div key={message.id} className="flex items-center justify-between p-3 bg-gris-claro rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${message.direction === 'in' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <div>
                    <p className="font-medium text-gris-oscuro">{message.client_name}</p>
                    <p className="text-sm text-gris-medio truncate max-w-md">{message.content}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gris-medio">
                    {new Date(message.timestamp).toLocaleTimeString('es-UY', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-xs text-gris-medio">
                    {new Date(message.timestamp).toLocaleDateString('es-UY')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gris-medio text-center py-8">No hay mensajes recientes</p>
        )}
      </div>
    </div>
  )
}