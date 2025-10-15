import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching FAQs:', error)
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/faqs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const faqData = await request.json()

    // Validate required fields
    if (!faqData.question || !faqData.answer) {
      return NextResponse.json({ 
        error: 'Question and answer are required' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert({
        user_id: user.id,
        question: faqData.question.trim(),
        answer: faqData.answer.trim(),
        keywords: faqData.keywords || [],
        active: faqData.active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating FAQ:', error)
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/faqs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const faqData = await request.json()

    if (!faqData.id) {
      return NextResponse.json({ 
        error: 'FAQ ID is required' 
      }, { status: 400 })
    }

    // Validate that the FAQ belongs to the user
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', faqData.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingFAQ) {
      return NextResponse.json({ 
        error: 'FAQ not found or unauthorized' 
      }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .update({
        question: faqData.question.trim(),
        answer: faqData.answer.trim(),
        keywords: faqData.keywords || [],
        active: faqData.active,
        updated_at: new Date().toISOString()
      })
      .eq('id', faqData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating FAQ:', error)
      return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/faqs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const faqId = searchParams.get('id')

    if (!faqId) {
      return NextResponse.json({ 
        error: 'FAQ ID is required' 
      }, { status: 400 })
    }

    // Validate that the FAQ belongs to the user
    const { data: existingFAQ, error: fetchError } = await supabase
      .from('faqs')
      .select('id')
      .eq('id', faqId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingFAQ) {
      return NextResponse.json({ 
        error: 'FAQ not found or unauthorized' 
      }, { status: 404 })
    }

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', faqId)

    if (error) {
      console.error('Error deleting FAQ:', error)
      return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/faqs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}