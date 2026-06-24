// app/api/aduan/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerComponentClient();
  const { id } = await params;

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

  // Ambil aduan
  const { data: aduan } = await supabase
    .from('aduan')
    .select('*')
    .eq('id', id)
    .single();

  if (!aduan) {
    return NextResponse.json({ error: 'Aduan tidak ditemukan' }, { status: 404 });
  }

  // Kepala Dinas hanya bisa update aduan dengan dinas_terkait = dinasnya
  if (role === 'kepala_dinas' && aduan.dinas_terkait !== profile.dinas_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { status: newStatus, dinas_terkait } = body;

  // Validasi status
  const validStatus = ['Baru', 'Diproses', 'Selesai'];
  if (newStatus && !validStatus.includes(newStatus)) {
    return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (newStatus) {
    updateData.status = newStatus;
  }

  // Hanya Bupati yang bisa update dinas_terkait
  if (role === 'gubernur' && dinas_terkait !== undefined) {
    updateData.dinas_terkait = dinas_terkait || null;
  }

  const { error } = await supabase
    .from('aduan')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: 'Gagal mengupdate aduan: ' + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}