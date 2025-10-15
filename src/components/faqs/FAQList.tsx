'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { FAQForm } from './FAQForm'

type FAQ = Database['public']['Tables']['faqs']['Row']

interface FAQListProps {
  faqs: FAQ[]
  onFAQUpdate: () => void
}

export function FAQList({ faqs, onFAQUpdate }: FAQListProps) {
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleSaveFAQ = async (faqData: Omit<FAQ, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/faqs', {
        method: editingFAQ ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingFAQ?.id,
          ...faqData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save FAQ')
      }

      onFAQUpdate()
    } catch (error) {
      console.error('Error saving FAQ:', error)
      throw error
    }
  }

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const response = await fetch('/api/faqs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: faq.id,
          ...faq,
          active: !faq.active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update FAQ')
      }

      onFAQUpdate()
    } catch (error) {
      console.error('Error updating FAQ:', error)
    }
  }

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta FAQ?')) {
      return
    }

    try {
      const response = await fetch(`/api/faqs?id=${faqId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete FAQ')
      }

      onFAQUpdate()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const activeFAQs = faqs.filter(faq => faq.active)
  const inactiveFAQs = faqs.filter(faq => !faq.active)

  const FAQSection = ({ title, faqs, isActive }: { title: string; faqs: FAQ[]; isActive: boolean }) => (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {title} ({faqs.length})
      </h3>
      
      {faqs.length > 0 ? (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{faq.question}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      faq.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {faq.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{faq.answer}</p>
                  
                  {faq.keywords && faq.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {faq.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Creada: {formatDate(faq.created_at)}
                    {faq.updated_at !== faq.created_at && (
                      <span> • Actualizada: {formatDate(faq.updated_at)}</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(faq)}
                    className={`p-2 rounded-lg transition-colors ${
                      faq.active 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={faq.active ? 'Desactivar' : 'Activar'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {faq.active ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      )}
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setEditingFAQ(faq)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No hay FAQs {isActive ? 'activas' : 'inactivas'}</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preguntas Frecuentes</h2>
          <p className="text-gray-600">Gestiona las respuestas automáticas</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          Nueva FAQ
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          <strong>Consejo:</strong> Usa preguntas específicas y palabras clave para mejorar la precisión de las respuestas automáticas.
        </p>
      </div>

      {activeFAQs.length > 0 && (
        <FAQSection title="FAQs Activas" faqs={activeFAQs} isActive={true} />
      )}

      {inactiveFAQs.length > 0 && (
        <FAQSection title="FAQs Inactivas" faqs={inactiveFAQs} isActive={false} />
      )}

      {faqs.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay preguntas frecuentes</h3>
          <p className="text-gray-500 mb-4">Crea tu primera respuesta automática</p>
          <Button onClick={() => setShowAddModal(true)}>
            Crear Primera FAQ
          </Button>
        </div>
      )}

      <FAQForm
        faq={editingFAQ}
        isOpen={!!editingFAQ || showAddModal}
        onClose={() => {
          setEditingFAQ(null)
          setShowAddModal(false)
        }}
        onSave={handleSaveFAQ}
      />
    </div>
  )
}