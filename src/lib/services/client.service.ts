import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export class ClientService {
  static async getClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_labels (
            labels (
              id,
              name,
              type,
              color
            )
          )
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw error
    }
  }

  static async getClientById(id: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_labels (
            labels (
              id,
              name,
              type,
              color
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching client:', error)
      throw error
    }
  }

  static async createClient(clientData: ClientInsert) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }

  static async updateClient(id: string, clientData: ClientUpdate) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  static async archiveClient(id: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error archiving client:', error)
      throw error
    }
  }

  static async activateClient(id: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ status: 'active' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error activating client:', error)
      throw error
    }
  }

  static async deleteClient(id: string) {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  static async searchClients(query: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_labels (
            labels (
              id,
              name,
              type,
              color
            )
          )
        `)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error searching clients:', error)
      throw error
    }
  }

  static async getClientsByLabel(labelId: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_labels (
            labels (
              id,
              name,
              type,
              color
            )
          )
        `)
        .eq('client_labels.label_id', labelId)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching clients by label:', error)
      throw error
    }
  }

  static async getClientStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('clients')
        .select('status, created_at, last_message_at')
        .eq('user_id', user.id)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        active: data?.filter(c => c.status === 'active').length || 0,
        archived: data?.filter(c => c.status === 'archived').length || 0,
        newThisMonth: data?.filter(c => {
          const createdAt = new Date(c.created_at)
          const now = new Date()
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear()
        }).length || 0,
        withRecentMessages: data?.filter(c => {
          if (!c.last_message_at) return false
          const lastMessage = new Date(c.last_message_at)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return lastMessage > weekAgo
        }).length || 0
      }

      return stats
    } catch (error) {
      console.error('Error fetching client stats:', error)
      throw error
    }
  }
}