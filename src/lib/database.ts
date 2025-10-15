import { supabase } from './supabase'

export interface DashboardMetrics {
  total_clients: number
  active_clients: number
  clients_last_30_days: number
  total_messages: number
  incoming_messages: number
  outgoing_messages: number
  messages_replied_within_2h: number
  messages_today: number
  messages_last_24h: number
  new_clients_30_days: number
}

export interface RecentMessage {
  id: string
  client_id: string
  client_name: string
  client_phone: string
  content: string
  direction: 'in' | 'out'
  timestamp: string
  twilio_message_id: string | null
}

export async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_metrics')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching dashboard metrics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return null
  }
}

export async function getRecentMessages(limit: number = 5): Promise<RecentMessage[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .rpc('get_user_recent_messages', { 
        p_user_id: user.id, 
        p_limit: limit 
      })

    if (error) {
      console.error('Error fetching recent messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching recent messages:', error)
    return []
  }
}

export async function getClients() {
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
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error fetching clients:', error)
    return []
  }
}

export async function getLabels() {
  try {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching labels:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error fetching labels:', error)
    return []
  }
}

export async function getFaqs() {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching FAQs:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return []
  }
}

export async function getMessages(clientId?: string) {
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

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}