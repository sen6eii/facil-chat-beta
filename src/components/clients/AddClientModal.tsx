'use client'

import { useState } from 'react'
import { Database } from '@/types/database'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { twilioService } from '@/lib/twilio/twilio.service'

type Client = Database['public']['Tables']['clients']['Row']

interface AddClientModalProps {
  isOpen: boolean
  onClose: () => void
  onClientAdded: () => void
}

export function AddClientModal({ isOpen, onClose, onClientAdded }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else {
      try {
        // Validate and format phone number for Uruguay
        const formattedPhone = twilioService.formatPhoneNumberForUruguay(formData.phone)
        if (!twilioService.validatePhoneNumber(formattedPhone)) {
          newErrors.phone = 'El número de teléfono no es válido para Uruguay (+598)'
        }
      } catch (error) {
        newErrors.phone = 'Formato de teléfono inválido. Usa formato uruguayo (ej: 098123456)'
      }
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
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Format phone number to E.164
      const formattedPhone = twilioService.formatPhoneNumberForUruguay(formData.phone)

      // Check if client already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', formattedPhone)
        .eq('user_id', user.id)
        .single()

      if (existingClient) {
        setErrors({ phone: 'Ya existe un cliente con este número de teléfono' })
        return
      }

      // Create new client
      const { error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          phone: formattedPhone,
          status: 'active'
        })

      if (error) {
        throw error
      }

      // Reset form and close modal
      setFormData({ name: '', phone: '' })
      setErrors({})
      onClientAdded()
      onClose()

    } catch (error) {
      console.error('Error creating client:', error)
      setErrors({ general: 'Error al crear cliente. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        <Input
          label="Nombre del Cliente"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ej: Juan Pérez"
          error={errors.name}
          required
        />

        <Input
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="Ej: 098123456 o +59898123456"
          error={errors.phone}
          required
        />

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="text-sm">
            <strong>Formato válido:</strong> Números uruguayos (ej: 098123456, +59898123456)
          </p>
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
            {loading ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}