// app/api/aduan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServerComponentClient();

  try {
    const formData = await request.formData();

    const nama = formData.get('nama') as string;
    const email = formData.get('email') as string;
    const kategori = formData.get('kategori') as string;
    const pesan = formData.get('pesan') as string;
    const captchaAnswer = formData.get('captcha_answer') as string;
    const captchaExpected = formData.get('captcha_expected') as string;
    const foto = formData.get('foto') as File | null;

    // Validasi required fields
    if (!nama || !email || !kategori || !pesan) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi kecuali foto' },
        { status: 400 }
      );
    }

    // Validasi CAPTCHA
    if (!captchaAnswer || !captchaExpected) {
      return NextResponse.json(
        { error: 'CAPTCHA wajib diisi' },
        { status: 400 }
      );
    }

    if (parseInt(captchaAnswer) !== parseInt(captchaExpected)) {
      return NextResponse.json(
        { error: 'Jawaban CAPTCHA salah' },
        { status: 400 }
      );
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    // Validasi kategori
    const validKategori = ['Infrastruktur', 'Pelayanan Publik', 'Kesehatan', 'Pendidikan', 'Lingkungan', 'Lainnya'];
    if (!validKategori.includes(kategori)) {
      return NextResponse.json(
        { error: 'Kategori tidak valid' },
        { status: 400 }
      );
    }

    // Generate kode tiket: LBS-{tahun}-{4 digit urutan}
    const tahun = new Date().getFullYear();
    
    // Cari urutan terakhir dari database
    const { data: lastAduan } = await supabase
      .from('aduan')
      .select('kode_tiket')
      .ilike('kode_tiket', `LBS-${tahun}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let urutan = 1;
    if (lastAduan?.kode_tiket) {
      const lastUrutan = parseInt(lastAduan.kode_tiket.split('-')[2]);
      if (!isNaN(lastUrutan)) {
        urutan = lastUrutan + 1;
      }
    }

    const kodeTiket = `LBS-${tahun}-${String(urutan).padStart(4, '0')}`;

    // Upload foto ke Supabase Storage jika ada
    let fotoUrl: string | null = null;
    if (foto && foto.size > 0) {
      const fileExt = foto.name.split('.').pop();
      const fileName = `aduan/${kodeTiket}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('aduan')
        .upload(fileName, foto, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: 'Gagal mengupload foto: ' + uploadError.message },
          { status: 500 }
        );
      }

      const { data: urlData } = supabase.storage
        .from('aduan')
        .getPublicUrl(fileName);

      fotoUrl = urlData?.publicUrl || null;
    }

    // Simpan ke tabel aduan
    const { data: aduan, error } = await supabase
      .from('aduan')
      .insert({
        kode_tiket: kodeTiket,
        nama_pengadu: nama,
        email_pengadu: email,
        kategori: kategori,
        pesan: pesan,
        foto_url: fotoUrl,
        status: 'Baru',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Gagal menyimpan aduan: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      kode_tiket: kodeTiket,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createServerComponentClient();

  // Cek autentikasi
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ambil profile untuk cek role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile tidak ditemukan' }, { status: 401 });
  }

  const role = profile.role;
  if (role !== 'gubernur' && role !== 'kepala_dinas') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filterStatus = searchParams.get('status') || '';
  const filterKategori = searchParams.get('kategori') || '';
  const filterDinas = searchParams.get('dinas_terkait') || '';
  const filterTanggalMulai = searchParams.get('tanggal_mulai') || '';
  const filterTanggalSelesai = searchParams.get('tanggal_selesai') || '';

  let query = supabase
    .from('aduan')
    .select('*')
    .order('created_at', { ascending: false });

  // Bupati: lihat semua
  // Kepala Dinas: lihat aduan dengan dinas_terkait = dinasnya
  if (role === 'kepala_dinas') {
    query = query.eq('dinas_terkait', profile.dinas_id);
  }

  // Filter by status
  if (filterStatus) {
    query = query.eq('status', filterStatus);
  }

  // Filter by kategori
  if (filterKategori) {
    query = query.eq('kategori', filterKategori);
  }

  // Filter by dinas_terkait (hanya Bupati)
  if (filterDinas && role === 'gubernur') {
    query = query.eq('dinas_terkait', filterDinas);
  }

  // Filter by tanggal
  if (filterTanggalMulai) {
    query = query.gte('created_at', filterTanggalMulai);
  }
  if (filterTanggalSelesai) {
    query = query.lte('created_at', filterTanggalSelesai);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data aduan' }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}