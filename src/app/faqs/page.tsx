'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { FAQList } from '@/components/faqs/FAQList'

type FAQ = Database['public']['Tables']['faqs']['Row']

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFaqs(data || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFAQs()

    // Set up real-time subscription for FAQs
    const subscription = supabase
      .channel('faqs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faqs'
        },
        (payload) => {
          console.log('FAQ change:', payload)
          fetchFAQs()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const handleFAQUpdate = () => {
    fetchFAQs()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <FAQList
        faqs={faqs}
        onFAQUpdate={handleFAQUpdate}
      />
    </div>
  )
}