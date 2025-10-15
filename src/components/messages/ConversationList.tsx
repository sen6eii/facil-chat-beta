'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

type Message = Database['public']['Tables']['messages']['Row'] & {
  clients: Database['public']['Tables']['clients']['Row']
}

interface ConversationListProps {
  onConversationSelect: (clientId: string) => void
  selectedClientId: string | null
}

export function ConversationList({ onConversationSelect, selectedClientId }: ConversationListProps) {
  const [conversations, setConversations] = useState<Array<{
    client_id: string
    client_name: string
    client_phone: string
    last_message: string
    last_message_time: string
    unread_count: number
  }>>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          client_id,
          clients!inner (
            name,
            phone
          ),
          content,
          timestamp,
          direction
        `)
        .order('timestamp', { ascending: false })

      if (error) throw error

      // Group messages by client and get the latest message for each
      const clientMap = new Map()
      
      data?.forEach(message => {
        const clientId = message.client_id
        const existing = clientMap.get(clientId)
        
        if (!existing || new Date(message.timestamp) > new Date(existing.last_message_time)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: message.clients.name,
            client_phone: message.clients.phone,
            last_message: message.content,
            last_message_time: message.timestamp,
            unread_count: 0 // TODO: Calculate actual unread count
          })
        }
      })

      const conversationsArray = Array.from(clientMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

      setConversations(conversationsArray)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()

    // Set up real-time subscription
    const subscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message change:', payload)
          fetchConversations()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-UY', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('es-UY', { 
        weekday: 'short' 
      })
    } else {
      return date.toLocaleDateString('es-UY', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <div
              key={conversation.client_id}
              onClick={() => onConversationSelect(conversation.client_id)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedClientId === conversation.client_id ? 'bg-verde bg-opacity-10 border-l-4 border-verde' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-verde rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {conversation.client_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.client_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(conversation.last_message_time)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {truncateMessage(conversation.last_message)}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm font-medium">No hay conversaciones</p>
          <p className="text-xs mt-1">Los mensajes aparecerán aquí cuando lleguen</p>
        </div>
      )}
    </div>
  )
}