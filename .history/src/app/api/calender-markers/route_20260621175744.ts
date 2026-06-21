// app/api/calendar-markers/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST: Buat penanda baru
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    // Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cek role (hanya gubernur atau kepala dinas yang bisa buat)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, dinas_id')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'gubernur' && profile.role !== 'kepala_dinas')) {
      return NextResponse.json({ error: 'Hanya Gubernur atau Kepala Dinas yang bisa membuat penanda' }, { status: 403 });
    }

    const { tanggal, judul, deskripsi, target_dinas_id } = await request.json();

    if (!tanggal || !judul) {
      return NextResponse.json({ error: 'Tanggal dan judul wajib diisi' }, { status: 400 });
    }

    // Jika Kepala Dinas, hanya boleh buat untuk dinasnya sendiri
    let finalTarget = target_dinas_id || [];
    if (profile.role === 'kepala_dinas') {
      // Pastikan hanya dinasnya yang di-target
      if (finalTarget.length > 0 && !finalTarget.includes(profile.dinas_id)) {
        finalTarget = [profile.dinas_id];
      } else if (finalTarget.length === 0) {
        // Jika tidak dipilih, default ke dinasnya sendiri
        finalTarget = [profile.dinas_id];
      }
    }

    // Simpan
    const { data, error } = await supabase
      .from('calendar_markers')
      .insert({
        tanggal,
        judul,
        deskripsi: deskripsi || '',
        target_dinas_id: finalTarget,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Ambil penanda (dengan filter)
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const tanggal = url.searchParams.get('tanggal');

    // Ambil profile user
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, dinas_id')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('calendar_markers')
      .select('*')
      .order('tanggal', { ascending: true });

    // Filter berdasarkan tanggal
    if (tanggal) {
      query = query.eq('tanggal', tanggal);
    }

    // Filter akses berdasarkan role
    if (profile?.role === 'staf') {
      // Staf hanya melihat penanda yang targetnya mencakup dinas mereka
      query = query.or(`target_dinas_id.eq.'{}',target_dinas_id.cs.{${profile.dinas_id}}`);
    } else if (profile?.role === 'kepala_dinas') {
      // Kepala Dinas melihat semua penanda yang targetnya mencakup dinasnya atau kosong (semua)
      query = query.or(`target_dinas_id.eq.'{}',target_dinas_id.cs.{${profile.dinas_id}}`);
    }
    // Gubernur melihat semua

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}