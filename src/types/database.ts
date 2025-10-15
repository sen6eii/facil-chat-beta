export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          business_name: string | null
          business_logo_url: string | null
          onboarding_complete: boolean
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          business_name?: string | null
          business_logo_url?: string | null
          onboarding_complete?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          business_name?: string | null
          business_logo_url?: string | null
          onboarding_complete?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          status: 'active' | 'archived'
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          status?: 'active' | 'archived'
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          status?: 'active' | 'archived'
          last_message_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      labels: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'auto' | 'manual'
          color: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'auto' | 'manual'
          color?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'auto' | 'manual'
          color?: string
          active?: boolean
          created_at?: string
        }
      }
      client_labels: {
        Row: {
          client_id: string
          label_id: string
          assigned_at: string
        }
        Insert: {
          client_id: string
          label_id: string
          assigned_at?: string
        }
        Update: {
          client_id?: string
          label_id?: string
          assigned_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          client_id: string
          content: string
          direction: 'in' | 'out'
          timestamp: string
          twilio_message_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          content: string
          direction: 'in' | 'out'
          timestamp: string
          twilio_message_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          content?: string
          direction?: 'in' | 'out'
          timestamp?: string
          twilio_message_id?: string | null
          status?: string
          created_at?: string
        }
      }
      faqs: {
        Row: {
          id: string
          user_id: string
          question: string
          answer: string
          keywords: string[]
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          answer: string
          keywords?: string[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          answer?: string
          keywords?: string[]
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auto_reply_settings: {
        Row: {
          id: string
          user_id: string
          welcome_message: string | null
          fallback_message: string | null
          auto_reply_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          welcome_message?: string | null
          fallback_message?: string | null
          auto_reply_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          welcome_message?: string | null
          fallback_message?: string | null
          auto_reply_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      user_dashboard_metrics: {
        Row: {
          user_id: string
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
      }
    }
    Functions: {
      get_user_recent_messages: {
        Args: {
          p_user_id: string
          p_limit?: number
        }
        Returns: {
          id: string
          client_id: string
          client_name: string
          client_phone: string
          content: string
          direction: string
          timestamp: string
          twilio_message_id: string | null
        }[]
      }
    }
  }
}