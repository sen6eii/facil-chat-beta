'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

type FAQ = Database['public']['Tables']['faqs']['Row']

interface FAQFormProps {
  faq?: FAQ | null
  isOpen: boolean
  onClose: () => void
  onSave: (faqData: Omit<FAQ, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
}

export function FAQForm({ faq, isOpen, onClose, onSave }: FAQFormProps) {
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    keywords: faq?.keywords?.join(', ') || '',
    active: faq?.active ?? true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.question.trim()) {
      newErrors.question = 'La pregunta es requerida'
    }

    if (!formData.answer.trim()) {
      newErrors.answer = 'La respuesta es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)

      await onSave({
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        keywords: keywordsArray,
        active: formData.active
      })

      setFormData({
        question: '',
        answer: '',
        keywords: '',
        active: true
      })
      setErrors({})
      onClose()

    } catch (error) {
      console.error('Error saving FAQ:', error)
      setErrors({ general: 'Error al guardar FAQ. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={faq ? 'Editar FAQ' : 'Nueva FAQ'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        <div>
          <Input
            label="Pregunta"
            value={formData.question}
            onChange={(e) => handleInputChange('question', e.target.value)}
            placeholder="Ej: ¿Cuáles son los horarios de atención?"
            error={errors.question}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta es la pregunta que el sistema buscará coincidir
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respuesta
          </label>
          <textarea
            value={formData.answer}
            onChange={(e) => handleInputChange('answer', e.target.value)}
            placeholder="Ej: Nuestro horario de atención es de lunes a viernes de 9:00 a 18:00 hs."
            rows={4}
            className={`input-field ${errors.answer ? 'border-red-500 focus:ring-red-500' : ''}`}
            required
          />
          {errors.answer && (
            <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
          )}
        </div>

        <div>
          <Input
            label="Palabras clave (opcional)"
            value={formData.keywords}
            onChange={(e) => handleInputChange('keywords', e.target.value)}
            placeholder="Ej: horario, atención, lunes, viernes"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separa las palabras clave con comas. Ayudan a encontrar coincidencias más fácilmente.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => handleInputChange('active', e.target.checked)}
            className="h-4 w-4 text-verde focus:ring-verde border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
            FAQ activa
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Guardando...' : (faq ? 'Actualizar' : 'Crear') + ' FAQ'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}