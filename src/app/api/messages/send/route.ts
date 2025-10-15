import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { twilioService } from '@/lib/twilio/twilio.service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { clientId, message } = await request.json()

    if (!clientId || !message) {
      return NextResponse.json({ 
        error: 'Client ID and message are required' 
      }, { status: 400 })
    }

    // Get client information
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('phone, user_id')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ 
        error: 'Client not found' 
      }, { status: 404 })
    }

    // Get user's Twilio phone number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('twilio_phone_number')
      .eq('id', client.user_id)
      .single()

    if (userError || !user?.twilio_phone_number) {
      return NextResponse.json({ 
        error: 'Twilio phone number not configured' 
      }, { status: 400 })
    }

    // Send message via Twilio
    const messageSid = await twilioService.sendMessage(
      client.phone,
      message,
      user.twilio_phone_number
    )

    // Store message in database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: client.user_id,
        client_id: clientId,
        content: message,
        direction: 'out',
        timestamp: new Date().toISOString(),
        twilio_message_id: messageSid
      })

    if (messageError) {
      console.error('Error storing message:', messageError)
      // Message was sent but not stored - log the error
    }

    return NextResponse.json({ 
      success: true, 
      messageSid,
      message: 'Message sent successfully' 
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ 
      error: 'Failed to send message' 
    }, { status: 500 })
  }
}