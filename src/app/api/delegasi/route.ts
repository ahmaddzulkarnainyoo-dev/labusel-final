// app/api/delegasi/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const BUPATI_MENU_FEATURES = [
  'broadcast',
  'laporan_masuk',
  'kelola_user',
  'laporan_absensi',
  'atur_penanda_kalender',
] as const;

export type DelegasiPermission = (typeof BUPATI_MENU_FEATURES)[number];

const FEATURE_LABELS: Record<DelegasiPermission, string> = {
  broadcast: 'Broadcast',
  laporan_masuk: 'Laporan Masuk',
  kelola_user: 'Kelola Pengguna',
  laporan_absensi: 'Laporan Absensi',
  atur_penanda_kalender: 'Atur Penanda Kalender',
};

function createSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
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
}

async function checkBupati(supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'gubernur') {
    return { authorized: false, response: NextResponse.json({ error: 'Hanya Bupati yang dapat mengelola delegasi' }, { status: 403 }) };
  }

  return { authorized: true, userId: user.id, supabase };
}

// GET: Ambil semua delegasi
export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const auth = await checkBupati(supabase);
    if (!auth.authorized) return auth.response;

    const { data, error } = await supabase
      .from('delegasi')
      .select(`
        id,
        target_user_id,
        permissions,
        created_at,
        profiles:target_user_id (
          full_name,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = data.map((item: any) => ({
      id: item.id,
      target_user_id: item.target_user_id,
      full_name: item.profiles?.full_name || 'Tidak Diketahui',
      role: item.profiles?.role || '',
      permissions: item.permissions || [],
      created_at: item.created_at,
    }));

    return NextResponse.json({ data: formatted }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Buat delegasi baru
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const auth = await checkBupati(supabase);
    if (!auth.authorized) return auth.response;

    const { target_user_id, permissions } = await request.json();

    if (!target_user_id) {
      return NextResponse.json({ error: 'target_user_id wajib diisi' }, { status: 400 });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: 'Pilih setidaknya satu fitur yang diizinkan' }, { status: 400 });
    }

    // Validasi: target_user_id bukan bupati
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', target_user_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (targetProfile.role === 'gubernur') {
      return NextResponse.json({ error: 'Tidak dapat mendelegasikan ke Bupati' }, { status: 400 });
    }

    // Validasi: belum menjadi delegasi
    const { data: existing } = await supabase
      .from('delegasi')
      .select('id')
      .eq('target_user_id', target_user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Pengguna ini sudah menjadi delegasi' }, { status: 409 });
    }

    // Validasi: permissions yang dikirim valid
    const validPermissions = permissions.filter((p: string) =>
      BUPATI_MENU_FEATURES.includes(p as DelegasiPermission)
    );

    if (validPermissions.length === 0) {
      return NextResponse.json({ error: 'Fitur yang dipilih tidak valid' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('delegasi')
      .insert({
        target_user_id,
        permissions: validPermissions,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Delegasi berhasil ditambahkan' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update permissions delegasi
export async function PUT(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const auth = await checkBupati(supabase);
    if (!auth.authorized) return auth.response;

    const { id, permissions } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json({ error: 'Pilih setidaknya satu fitur yang diizinkan' }, { status: 400 });
    }

    const validPermissions = permissions.filter((p: string) =>
      BUPATI_MENU_FEATURES.includes(p as DelegasiPermission)
    );

    if (validPermissions.length === 0) {
      return NextResponse.json({ error: 'Fitur yang dipilih tidak valid' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('delegasi')
      .update({ permissions: validPermissions })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Delegasi berhasil diperbarui' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Hapus delegasi
export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseClient();
    const auth = await checkBupati(supabase);
    if (!auth.authorized) return auth.response;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
    }

    const { error } = await supabase
      .from('delegasi')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Delegasi berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}