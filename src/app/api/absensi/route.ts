// app/api/absensi/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    // 1. Cek autentikasi
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Ambil data dari request
    const { photo_base64, latitude, longitude, status } = await request.json();

    if (!photo_base64) {
      return NextResponse.json({ error: 'Foto wajib diisi' }, { status: 400 });
    }

    // 3. Upload foto ke Supabase Storage
    const base64Data = photo_base64.split(',')[1] || photo_base64;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Tentukan ekstensi file dari header base64 (jika ada)
    const mimeType = photo_base64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    const fileName = `absensi/${user.id}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('absensi') // bucket harus dibuat dulu di Supabase
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Gagal upload foto: ' + uploadError.message }, { status: 500 });
    }

    // 4. Dapatkan public URL foto
    const { data: urlData } = supabase.storage
      .from('absensi')
      .getPublicUrl(fileName);

    const photo_url = urlData.publicUrl;

    // 5. Ambil profile user (untuk dinas_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('dinas_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile tidak ditemukan' }, { status: 404 });
    }

    // 6. Simpan data absen
    const { data: absen, error: insertError } = await supabase
      .from('absensi')
      .insert({
        user_id: user.id,
        dinas_id: profile.dinas_id,
        tanggal: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        check_in_time: new Date().toISOString(),
        photo_url,
        latitude: latitude || null,
        longitude: longitude || null,
        status: status || 'hadir',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Gagal simpan absen: ' + insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Absen berhasil!',
      data: absen,
    }, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}