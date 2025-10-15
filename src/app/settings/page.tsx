'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type AutoReplySettings = Database['public']['Tables']['auto_reply_settings']['Row']

export default function SettingsPage() {
  const [settings, setSettings] = useState<AutoReplySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<any>(null)
  const [formData, setFormData] = useState({
    auto_reply_enabled: true,
    welcome_message: '',
    fallback_message: ''
  })

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_reply_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setSettings(data)
      if (data) {
        setFormData({
          auto_reply_enabled: data.auto_reply_enabled,
          welcome_message: data.welcome_message || '',
          fallback_message: data.fallback_message || ''
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWebhookStatus = async () => {
    try {
      const response = await fetch('/api/twilio/status')
      const data = await response.json()
      setWebhookStatus(data)
    } catch (error) {
      console.error('Error fetching webhook status:', error)
    }
  }

  useEffect(() => {
    fetchSettings()
    fetchWebhookStatus()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      await fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error al guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('URL copiada al portapapeles')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-600">Configura tu aplicación</p>
      </div>

      {/* Twilio Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración de Twilio</h2>
        
        {webhookStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Estado de configuración</p>
                <p className="text-sm text-gray-500">
                  {webhookStatus.twilioConfigured ? 'Configurado' : 'No configurado'}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                webhookStatus.twilioConfigured ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del Webhook
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={webhookStatus.webhookUrl}
                  readOnly
                  className="flex-1 input-field bg-gray-50"
                />
                <Button
                  onClick={() => copyToClipboard(webhookStatus.webhookUrl)}
                  size="sm"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Copia esta URL y configúrala en tu cuenta de Twilio
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account SID
                </label>
                <div className="input-field bg-gray-50 font-mono text-xs">
                  {webhookStatus.accountSid}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Twilio
                </label>
                <div className="input-field bg-gray-50">
                  {webhookStatus.phoneNumber}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auto-reply Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Respuestas Automáticas</h2>
        
        <div className="space-y-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_reply_enabled"
              checked={formData.auto_reply_enabled}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                auto_reply_enabled: e.target.checked
              }))}
              className="h-4 w-4 text-verde focus:ring-verde border-gray-300 rounded"
            />
            <label htmlFor="auto_reply_enabled" className="ml-2 block text-sm text-gray-900">
              Habilitar respuestas automáticas
            </label>
          </div>

          <div>
            <Input
              label="Mensaje de bienvenida"
              value={formData.welcome_message}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                welcome_message: e.target.value
              }))}
              placeholder="Mensaje enviado cuando un cliente contacta por primera vez"
              rows={3}
            />
          </div>

          <div>
            <Input
              label="Mensaje por defecto"
              value={formData.fallback_message}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                fallback_message: e.target.value
              }))}
              placeholder="Mensaje enviado cuando no hay coincidencia con las FAQs"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Instrucciones de Configuración</h3>
        
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="font-semibold">1.</span>
            <p>Configura tus credenciales de Twilio en las variables de entorno del proyecto</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-semibold">2.</span>
            <p>Copia la URL del webhook y pégala en la configuración de WhatsApp en tu cuenta de Twilio</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-semibold">3.</span>
            <p>Crea tus preguntas frecuentes en la sección de FAQs para habilitar respuestas automáticas</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-semibold">4.</span>
            <p>Personaliza los mensajes de bienvenida y por defecto</p>
          </div>
        </div>
      </div>
    </div>
  )
}