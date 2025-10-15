import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settingsData = await request.json()

    // Check if settings exist for this user
    const { data: existingSettings, error: fetchError } = await supabase
      .from('auto_reply_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result

    if (fetchError && fetchError.code === 'PGRST116') {
      // Create new settings
      const { data, error } = await supabase
        .from('auto_reply_settings')
        .insert({
          user_id: user.id,
          auto_reply_enabled: settingsData.auto_reply_enabled ?? true,
          welcome_message: settingsData.welcome_message?.trim() || null,
          fallback_message: settingsData.fallback_message?.trim() || null
        })
        .select()
        .single()

      if (error) throw error
      result = data
    } else if (fetchError) {
      throw fetchError
    } else {
      // Update existing settings
      const { data, error } = await supabase
        .from('auto_reply_settings')
        .update({
          auto_reply_enabled: settingsData.auto_reply_enabled,
          welcome_message: settingsData.welcome_message?.trim() || null,
          fallback_message: settingsData.fallback_message?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('auto_reply_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return default settings if none exist
    const defaultSettings = {
      auto_reply_enabled: true,
      welcome_message: '¡Hola! Gracias por contactarnos. Te responderemos pronto.',
      fallback_message: 'Gracias por tu mensaje. Nuestro equipo te responderá a la brevedad.'
    }

    return NextResponse.json(data || defaultSettings)
  } catch (error) {
    console.error('Error in GET /api/settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}