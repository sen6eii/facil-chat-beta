import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']
type Label = Database['public']['Tables']['labels']['Row']

export class AutoLabelService {
  static async updateClientLabels(clientId: string) {
    try {
      // Get client information
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, user_id, created_at, last_message_at, status')
        .eq('id', clientId)
        .single()

      if (clientError || !client) {
        throw new Error('Client not found')
      }

      // Get user's auto labels
      const { data: autoLabels, error: labelsError } = await supabase
        .from('labels')
        .select('*')
        .eq('user_id', client.user_id)
        .eq('type', 'auto')
        .eq('active', true)

      if (labelsError) {
        throw labelsError
      }

      if (!autoLabels || autoLabels.length === 0) {
        return { message: 'No auto labels configured' }
      }

      // Get current client labels
      const { data: currentLabels, error: currentError } = await supabase
        .from('client_labels')
        .select('label_id')
        .eq('client_id', clientId)

      if (currentError) {
        throw currentError
      }

      const currentLabelIds = currentLabels?.map(cl => cl.label_id) || []
      const labelsToAdd: string[] = []
      const labelsToRemove: string[] = []

      const now = new Date()
      const createdAt = new Date(client.created_at)
      const lastMessageAt = client.last_message_at ? new Date(client.last_message_at) : null

      // Check each auto label rule
      for (const label of autoLabels) {
        let shouldHaveLabel = false

        switch (label.name) {
          case 'Nuevo':
            // New clients (created within last 24 hours)
            const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
            shouldHaveLabel = hoursSinceCreation <= 24
            break

          case 'Última hora':
            // Clients with messages in the last hour
            if (lastMessageAt) {
              const hoursSinceLastMessage = (now.getTime() - lastMessageAt.getTime()) / (1000 * 60 * 60)
              shouldHaveLabel = hoursSinceLastMessage <= 1
            }
            break

          case 'Frecuente':
            // Clients with more than 5 messages in the last 30 days
            const { data: messageCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('client_id', clientId)
              .gte('timestamp', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())

            shouldHaveLabel = (messageCount?.length || 0) >= 5
            break

          case 'Respuesta atrasada':
            // Clients with incoming messages not replied within 2 hours
            const { data: unrepliedMessages } = await supabase
              .from('messages')
              .select('id, timestamp')
              .eq('client_id', clientId)
              .eq('direction', 'in')
              .order('timestamp', { ascending: false })

            if (unrepliedMessages && unrepliedMessages.length > 0) {
              const lastIncomingMessage = unrepliedMessages[0]
              const messageTime = new Date(lastIncomingMessage.timestamp)
              const hoursSinceMessage = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60)

              // Check if there's a reply after this message
              const { data: hasReply } = await supabase
                .from('messages')
                .select('id')
                .eq('client_id', clientId)
                .eq('direction', 'out')
                .gt('timestamp', lastIncomingMessage.timestamp)
                .limit(1)

              shouldHaveLabel = hoursSinceMessage >= 2 && (!hasReply || hasReply.length === 0)
            }
            break

          default:
            // Skip unknown auto labels
            continue
        }

        // Add or remove label based on rule
        if (shouldHaveLabel && !currentLabelIds.includes(label.id)) {
          labelsToAdd.push(label.id)
        } else if (!shouldHaveLabel && currentLabelIds.includes(label.id)) {
          labelsToRemove.push(label.id)
        }
      }

      // Add new labels
      for (const labelId of labelsToAdd) {
        await supabase
          .from('client_labels')
          .insert({
            client_id: clientId,
            label_id: labelId
          })
      }

      // Remove labels that no longer apply
      for (const labelId of labelsToRemove) {
        await supabase
          .from('client_labels')
          .delete()
          .eq('client_id', clientId)
          .eq('label_id', labelId)
      }

      return {
        added: labelsToAdd.length,
        removed: labelsToRemove.length,
        message: `Updated ${labelsToAdd.length + labelsToRemove.length} auto labels`
      }

    } catch (error) {
      console.error('Error updating client labels:', error)
      throw error
    }
  }

  static async createDefaultAutoLabels(userId: string) {
    try {
      const defaultLabels = [
        { name: 'Nuevo', color: '#25D366' },
        { name: 'Última hora', color: '#FF6B6B' },
        { name: 'Frecuente', color: '#4ECDC4' },
        { name: 'Respuesta atrasada', color: '#FFA500' }
      ]

      const createdLabels = []

      for (const labelData of defaultLabels) {
        // Check if label already exists
        const { data: existing } = await supabase
          .from('labels')
          .select('id')
          .eq('user_id', userId)
          .eq('name', labelData.name)
          .eq('type', 'auto')
          .single()

        if (!existing) {
          const { data, error } = await supabase
            .from('labels')
            .insert({
              user_id: userId,
              name: labelData.name,
              type: 'auto',
              color: labelData.color,
              active: true
            })
            .select()
            .single()

          if (error) {
            console.error(`Error creating label ${labelData.name}:`, error)
          } else {
            createdLabels.push(data)
          }
        }
      }

      return createdLabels
    } catch (error) {
      console.error('Error creating default auto labels:', error)
      throw error
    }
  }

  static async updateAllClientsLabels(userId: string) {
    try {
      // Get all active clients for the user
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')

      if (error) {
        throw error
      }

      if (!clients || clients.length === 0) {
        return { message: 'No clients found', updated: 0 }
      }

      let updatedCount = 0

      // Update labels for each client
      for (const client of clients) {
        try {
          await this.updateClientLabels(client.id)
          updatedCount++
        } catch (error) {
          console.error(`Error updating labels for client ${client.id}:`, error)
        }
      }

      return {
        message: `Updated labels for ${updatedCount} clients`,
        updated: updatedCount
      }

    } catch (error) {
      console.error('Error updating all clients labels:', error)
      throw error
    }
  }
}