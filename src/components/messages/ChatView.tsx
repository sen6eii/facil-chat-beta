'use client'

import { useState, useEffect, useRef } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { twilioService } from '@/lib/twilio/twilio.service'

type Message = Database['public']['Tables']['messages']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row']
}

type Client = Database['public']['Tables']['clients']['Row']

interface ChatViewProps {
  clientId: string | null
  onBack?: () => void
}

export function ChatView({ clientId, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!clientId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          clients!inner (
            id,
            name,
            phone
          )
        `)
        .eq('client_id', clientId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClient = async () => {
    if (!clientId) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      setClient(data)
    } catch (error) {
      console.error('Error fetching client:', error)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchMessages()
      fetchClient()

      // Set up real-time subscription for this client's messages
      const subscription = supabase
        .channel(`messages-${clientId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            console.log('New message for this client:', payload)
            fetchMessages()
          }
        )
        .subscribe()

      return () => subscription.unsubscribe()
    }
  }, [clientId])

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-UY', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    }
  }

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}`
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !client) return

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientId,
          message: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      // Open WhatsApp as fallback
      const whatsappUrl = getWhatsAppLink(client.phone)
      window.open(whatsappUrl, '_blank')
    } finally {
      setSendingMessage(false)
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  if (!clientId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Selecciona una conversación</p>
          <p className="text-sm mt-1">Para ver los mensajes</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-verde"></div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="w-10 h-10 bg-verde rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {client?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{client?.name}</h3>
              <p className="text-sm text-gray-500">{client?.phone}</p>
            </div>
          </div>
          <Button
            onClick={() => client && window.open(getWhatsAppLink(client.phone), '_blank')}
            size="sm"
          >
            Responder en WhatsApp
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(dateMessages[0].timestamp)}
              </span>
            </div>
            <div className="space-y-3">
              {dateMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.direction === 'out'
                      ? 'bg-verde text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.direction === 'out' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-verde focus:border-transparent"
            disabled={sendingMessage}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            size="sm"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}