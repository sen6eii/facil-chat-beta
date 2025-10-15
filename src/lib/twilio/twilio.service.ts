import { Twilio } from 'twilio'

export class TwilioService {
  private client: Twilio

  constructor() {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('Twilio credentials are required')
    }

    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )
  }

  async sendMessage(to: string, body: string, from?: string): Promise<string> {
    try {
      const fromNumber = from || process.env.TWILIO_PHONE_NUMBER
      
      if (!fromNumber) {
        throw new Error('Twilio phone number is required')
      }

      const message = await this.client.messages.create({
        body,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${to}`
      })

      return message.sid
    } catch (error) {
      console.error('Error sending Twilio message:', error)
      throw error
    }
  }

  async validateWebhookSignature(
    body: string, 
    signature: string, 
    webhookUrl: string
  ): Promise<boolean> {
    try {
      if (!process.env.TWILIO_AUTH_TOKEN) {
        throw new Error('Twilio auth token is required for signature validation')
      }

      const crypto = require('crypto')
      const computedSignature = crypto
        .createHmac('sha1', process.env.TWILIO_AUTH_TOKEN)
        .update(webhookUrl + body, 'utf8')
        .digest('base64')

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      )
    } catch (error) {
      console.error('Signature validation error:', error)
      return false
    }
  }

  generateWebhookUrl(baseUrl: string): string {
    return `${baseUrl}/api/twilio/webhook`
  }

  validatePhoneNumber(phone: string): boolean {
    // Basic E.164 format validation
    const e164Pattern = /^\+[1-9]\d{1,14}$/
    return e164Pattern.test(phone)
  }

  formatPhoneNumberForUruguay(phone: string): string {
    // Format Uruguay phone numbers to E.164
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length === 8) {
      // Local number (8 digits) - add Uruguay country code
      return `+598${cleaned}`
    } else if (cleaned.length === 9 && cleaned.startsWith('0')) {
      // Number with leading zero - replace with country code
      return `+598${cleaned.slice(1)}`
    } else if (cleaned.startsWith('598') && cleaned.length === 11) {
      // Already in international format without +
      return `+${cleaned}`
    } else if (phone.startsWith('+')) {
      // Already in E.164 format
      return phone
    }
    
    throw new Error('Invalid phone number format for Uruguay')
  }
}

export const twilioService = new TwilioService()