import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Twilio } from 'twilio'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function POST(request: NextRequest) {
  try {
    // Get the raw body and signature
    const body = await request.text()
    const signature = request.headers.get('x-twilio-signature') || ''
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/twilio/webhook`

    // Verify Twilio signature
    if (!verifyTwilioSignature(body, signature, webhookUrl, process.env.TWILIO_AUTH_TOKEN!)) {
      console.error('Invalid Twilio signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Parse form data
    const formData = new URLSearchParams(body)
    const messageData = {
      from: formData.get('From') || '',
      to: formData.get('To') || '',
      body: formData.get('Body') || '',
      messageSid: formData.get('MessageSid') || '',
      numMedia: formData.get('NumMedia') || '0'
    }

    console.log('Received WhatsApp message:', messageData)

    // Get the user by Twilio phone number (for MVP, we'll use the first user)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('twilio_phone_number', messageData.to)
      .single()

    if (userError || !userData) {
      console.error('User not found for phone number:', messageData.to)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find or create client
    let clientData
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('phone', messageData.from)
      .eq('user_id', userData.id)
      .single()

    if (clientError && clientError.code === 'PGRST116') {
      // Client doesn't exist, create new one
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          user_id: userData.id,
          name: messageData.from.split(':')[1] || 'Cliente', // Extract name from WhatsApp if available
          phone: messageData.from,
          status: 'active'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating client:', createError)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
      }

      clientData = newClient
    } else if (clientError) {
      console.error('Error finding client:', clientError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    } else {
      clientData = existingClient
    }

    // Store the incoming message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: userData.id,
        client_id: clientData.id,
        content: messageData.body,
        direction: 'in',
        timestamp: new Date().toISOString(),
        twilio_message_id: messageData.messageSid
      })

    if (messageError) {
      console.error('Error storing message:', messageError)
      return NextResponse.json({ error: 'Failed to store message' }, { status: 500 })
    }

    // Update auto labels for this client
    try {
      const { AutoLabelService } = await import('@/lib/services/auto-label.service')
      await AutoLabelService.updateClientLabels(clientData.id)
    } catch (error) {
      console.error('Error updating auto labels:', error)
      // Don't fail the webhook if auto labeling fails
    }

    // Process auto-reply logic
    await processAutoReply(userData.id, clientData.id, messageData.from, messageData.body, messageData.to)

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Gracias por tu mensaje. Te responderemos a la brevedad.</Message>
</Response>`

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml'
      }
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function verifyTwilioSignature(body: string, signature: string, webhookUrl: string, authToken: string): boolean {
  try {
    const computedSignature = crypto
      .createHmac('sha1', authToken)
      .update(webhookUrl + body, 'utf8')
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

async function processAutoReply(userId: string, clientId: string, fromPhone: string, messageBody: string, toPhone: string) {
  try {
    // Get auto-reply settings
    const { data: settings, error: settingsError } = await supabase
      .from('auto_reply_settings')
      .select('auto_reply_enabled, welcome_message, fallback_message')
      .eq('user_id', userId)
      .single()

    if (settingsError || !settings?.auto_reply_enabled) {
      console.log('Auto-reply disabled or settings not found')
      return
    }

    // Get active FAQs
    const { data: faqs, error: faqError } = await supabase
      .from('faqs')
      .select('question, answer, keywords')
      .eq('user_id', userId)
      .eq('active', true)

    if (faqError) {
      console.error('Error fetching FAQs:', faqError)
      return
    }

    // Enhanced message matching
    const normalizedMessage = messageBody.toLowerCase().trim()
    let matchedAnswer = null
    let bestScore = 0

    if (faqs && faqs.length > 0) {
      for (const faq of faqs) {
        let score = 0

        // Exact match gets highest score
        if (faq.question.toLowerCase().trim() === normalizedMessage) {
          score = 100
        } 
        // Contains question gets high score
        else if (normalizedMessage.includes(faq.question.toLowerCase()) || 
                 faq.question.toLowerCase().includes(normalizedMessage)) {
          score = 80
        }
        // Keyword matching
        else if (faq.keywords && faq.keywords.length > 0) {
          const matchedKeywords = faq.keywords.filter(keyword =>
            normalizedMessage.includes(keyword.toLowerCase())
          )
          score = matchedKeywords.length * 20 // 20 points per matching keyword
        }

        // Update best match
        if (score > bestScore) {
          bestScore = score
          matchedAnswer = faq.answer
        }
      }
    }

    const replyMessage = matchedAnswer || settings.fallback_message || 'Gracias por tu mensaje. Te responderemos pronto.'

    // Send auto-reply via Twilio
    const message = await twilioClient.messages.create({
      body: replyMessage,
      from: `whatsapp:${toPhone}`,
      to: `whatsapp:${fromPhone}`
    })

    console.log('Auto-reply sent:', message.sid)

    // Store the outgoing message
    await supabase
      .from('messages')
      .insert({
        user_id: userId,
        client_id: clientId,
        content: replyMessage,
        direction: 'out',
        timestamp: new Date().toISOString(),
        twilio_message_id: message.sid
      })

  } catch (error) {
    console.error('Auto-reply processing error:', error)
  }
}