'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

type Label = Database['public']['Tables']['labels']['Row']

export default function LabelsPage() {
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLabels(data || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLabels()

    // Set up real-time subscription for labels
    const subscription = supabase
      .channel('labels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'labels'
        },
        (payload) => {
          console.log('Label change:', payload)
          fetchLabels()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const activeLabels = labels.filter(label => label.active)
  const autoLabels = activeLabels.filter(label => label.type === 'auto')
  const manualLabels = activeLabels.filter(label => label.type === 'manual')

  const LabelSection = ({ title, labels, type }: { 
    title: string; 
    labels: Label[]; 
    type: 'auto' | 'manual' 
  }) => (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {title} ({labels.length})
      </h3>
      
      {labels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labels.map((label) => (
            <div key={label.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: label.color }}
                ></div>
                <h4 className="font-medium text-gray-900">{label.name}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  label.type === 'auto' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {label.type === 'auto' ? 'Automática' : 'Manual'}
                </span>
              </div>
              
              <p className="text-xs text-gray-500">
                Creada: {formatDate(label.created_at)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-500">No hay etiquetas {type === 'auto' ? 'automáticas' : 'manuales'}</p>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Etiquetas</h1>
        <p className="text-gray-600">Gestiona las etiquetas para organizar tus clientes</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Etiquetas Automáticas:</strong> Se asignan automáticamente según el comportamiento de los clientes (Nuevo, Última hora, Frecuente, etc.).
        </p>
        <p className="text-sm mt-1">
          <strong>Etiquetas Manuales:</strong> Puedes crear y asignar manualmente para categorizar a tus clientes.
        </p>
      </div>

      {autoLabels.length > 0 && (
        <LabelSection title="Etiquetas Automáticas" labels={autoLabels} type="auto" />
      )}

      {manualLabels.length > 0 && (
        <LabelSection title="Etiquetas Manuales" labels={manualLabels} type="manual" />
      )}

      {labels.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay etiquetas</h3>
          <p className="text-gray-500">Las etiquetas automáticas se crearán cuando lleguen nuevos mensajes</p>
        </div>
      )}
    </div>
  )
}