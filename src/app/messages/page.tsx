'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/messages/ConversationList'
import { ChatView } from '@/components/messages/ChatView'

export default function MessagesPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  return (
    <div className="h-full flex">
      {/* Conversation List - Hidden on mobile when chat is selected */}
      <div className={`${selectedClientId ? 'hidden lg:flex' : 'flex'} w-full lg:w-96 border-r border-gray-200 bg-white`}>
        <ConversationList
          onConversationSelect={setSelectedClientId}
          selectedClientId={selectedClientId}
        />
      </div>

      {/* Chat View */}
      <ChatView
        clientId={selectedClientId}
        onBack={() => setSelectedClientId(null)}
      />
    </div>
  )
}