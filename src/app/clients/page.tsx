'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { ClientList } from '@/components/clients/ClientList'
import { AddClientModal } from '@/components/clients/AddClientModal'
import { Button } from '@/components/ui/Button'

type Client = Database['public']['Tables']['clients']['Row'] & {
  client_labels: Array<{
    labels: Database['public']['Tables']['labels']['Row']
  }>
}

type Label = Database['public']['Tables']['labels']['Row']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchClients = async () => {
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
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLabels(data || [])
    } catch (error) {
      console.error('Error fetching labels:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchClients(), fetchLabels()])
      setLoading(false)
    }

    loadData()

    // Set up real-time subscription for clients
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        (payload) => {
          console.log('Client change:', payload)
          fetchClients()
        }
      )
      .subscribe()

    // Set up real-time subscription for client_labels
    const clientLabelsSubscription = supabase
      .channel('client-labels-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_labels'
        },
        (payload) => {
          console.log('Client label change:', payload)
          fetchClients()
        }
      )
      .subscribe()

    return () => {
      clientsSubscription.unsubscribe()
      clientLabelsSubscription.unsubscribe()
    }
  }, [])

  const handleClientAdded = () => {
    fetchClients()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu lista de clientes</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          Agregar Cliente
        </Button>
      </div>

      <ClientList
        clients={clients}
        labels={labels}
        onClientUpdate={handleClientAdded}
      />

      <AddClientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  )
}