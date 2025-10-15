import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Message = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

export class MessageService {
  static async getMessages(clientId?: string) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          clients (
            id,
            name,
            phone
          )
        `)
        .order('timestamp', { ascending: false })

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  static async getMessageById(id: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          clients (
            id,
            name,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching message:', error)
      throw error
    }
  }

  static async createMessage(messageData: MessageInsert) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  static async updateMessageStatus(id: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating message status:', error)
      throw error
    }
  }

  static async deleteMessage(id: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  static async getConversations() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          client_id,
          clients!inner (
            id,
            name,
            phone,
            status
          ),
          content,
          timestamp,
          direction
        `)
        .order('timestamp', { ascending: false })

      if (error) throw error

      // Group by client and get latest message for each
      const clientMap = new Map()
      
      data?.forEach(message => {
        const clientId = message.client_id
        const existing = clientMap.get(clientId)
        
        if (!existing || new Date(message.timestamp) > new Date(existing.last_message_time)) {
          clientMap.set(clientId, {
            client_id: clientId,
            client_name: message.clients.name,
            client_phone: message.clients.phone,
            client_status: message.clients.status,
            last_message: message.content,
            last_message_time: message.timestamp,
            last_message_direction: message.direction
          })
        }
      })

      return Array.from(clientMap.values())
        .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  static async getUnreadCount() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('direction', 'in')
        .eq('status', 'delivered') // Assuming 'delivered' means unread

      if (error) throw error
      return data?.length || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      throw error
    }
  }

  static async markAsRead(messageIds: string[]) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error marking messages as read:', error)
      throw error
    }
  }

  static async searchMessages(query: string, clientId?: string) {
    try {
      let dbQuery = supabase
        .from('messages')
        .select(`
          *,
          clients (
            id,
            name,
            phone
          )
        `)
        .ilike('content', `%${query}%`)
        .order('timestamp', { ascending: false })

      if (clientId) {
        dbQuery = dbQuery.eq('client_id', clientId)
      }

      const { data, error } = await dbQuery

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching messages:', error)
      throw error
    }
  }

  static async getMessageStats(userId?: string) {
    try {
      let query = supabase
        .from('messages')
        .select('direction, timestamp, status')

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const monthAgo = new Date(now)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      const stats = {
        total: data?.length || 0,
        incoming: data?.filter(m => m.direction === 'in').length || 0,
        outgoing: data?.filter(m => m.direction === 'out').length || 0,
        today: data?.filter(m => new Date(m.timestamp) >= today).length || 0,
        yesterday: data?.filter(m => {
          const date = new Date(m.timestamp)
          return date >= yesterday && date < today
        }).length || 0,
        thisWeek: data?.filter(m => new Date(m.timestamp) >= weekAgo).length || 0,
        thisMonth: data?.filter(m => new Date(m.timestamp) >= monthAgo).length || 0,
        read: data?.filter(m => m.status === 'read').length || 0,
        delivered: data?.filter(m => m.status === 'delivered').length || 0,
        failed: data?.filter(m => m.status === 'failed').length || 0
      }

      return stats
    } catch (error) {
      console.error('Error fetching message stats:', error)
      throw error
    }
  }
}