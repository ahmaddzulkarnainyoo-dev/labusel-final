import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cek role user
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, dinas_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'kepala_dinas' && profile.role !== 'staf')) {
      return NextResponse.json({ error: 'Only kepala dinas or staf can submit reports' }, { status: 403 })
    }

    const { title, content, category, mode, dinas_id, file_url } = await request.json()

    if (!title || !content || !dinas_id) {
      return NextResponse.json({ error: 'Title, content, and dinas are required' }, { status: 400 })
    }

    // Simpan ke tabel reports
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title,
        content,
        category: category || null,
        mode,
        dinas_id,
        file_url: file_url || null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}