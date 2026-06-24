// app/api/aduan/cek/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createServerComponentClient();
  const searchParams = request.nextUrl.searchParams;
  const kodeTiket = searchParams.get('kode_tiket');

  if (!kodeTiket) {
    return NextResponse.json(
      { error: 'Kode tiket wajib diisi' },
      { status: 400 }
    );
  }

  // Cari aduan berdasarkan kode tiket
  const { data: aduan, error } = await supabase
    .from('aduan')
    .select('*')
    .eq('kode_tiket', kodeTiket)
    .single();

  if (error || !aduan) {
    return NextResponse.json(
      { error: 'Kode tiket tidak ditemukan' },
      { status: 404 }
    );
  }

  // Ambil dokumentasi jika status selesai
  let dokumentasi: any[] = [];
  if (aduan.status === 'Selesai') {
    const { data: docs } = await supabase
      .from('dokumentasi_dinas')
      .select('*')
      .eq('aduan_id', aduan.id)
      .order('created_at', { ascending: true });

    dokumentasi = docs || [];
  }

  return NextResponse.json({
    aduan,
    dokumentasi,
  });
}