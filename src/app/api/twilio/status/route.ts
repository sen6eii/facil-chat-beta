import { NextResponse } from 'next/server'

export async function GET() {
  const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/twilio/webhook`
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID

  const status = {
    webhookUrl,
    twilioConfigured: !!(twilioPhoneNumber && twilioAccountSid),
    phoneNumber: twilioPhoneNumber || 'Not configured',
    accountSid: twilioAccountSid ? `${twilioAccountSid.substring(0, 8)}...` : 'Not configured',
    environment: process.env.NODE_ENV || 'development'
  }

  return NextResponse.json(status)
}