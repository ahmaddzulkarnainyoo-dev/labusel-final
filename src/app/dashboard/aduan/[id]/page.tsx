// app/dashboard/aduan/[id]/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AduanDetailClient } from './client';

export const dynamic = 'force-dynamic';

async function getProfile() {
  const supabase = createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return profile;
}

async function getAduan(id: string) {
  const supabase = createServerComponentClient();
  const { data } = await supabase
    .from('aduan')
    .select('*')
    .eq('id', id)
    .single();
  return data;
}

async function getDokumentasi(aduanId: number) {
  const supabase = createServerComponentClient();
  const { data } = await supabase
    .from('dokumentasi_dinas')
    .select('*')
    .eq('aduan_id', aduanId)
    .order('created_at', { ascending: true });
  return data || [];
}

async function getDinasList() {
  const supabase = createServerComponentClient();
  const { data } = await supabase
    .from('dinas')
    .select('id, nama')
    .order('nama', { ascending: true });
  return data || [];
}

export default async function DetailAduanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const role = profile.role;
  if (role !== 'gubernur' && role !== 'kepala_dinas') {
    redirect('/dashboard');
  }

  const { id } = await params;
  const aduan = await getAduan(id);

  if (!aduan) {
    redirect('/dashboard/aduan');
  }

  // Kepala Dinas hanya bisa lihat aduan dengan dinas_terkait = dinasnya
  if (role === 'kepala_dinas' && aduan.dinas_terkait !== profile.dinas_id) {
    redirect('/dashboard/aduan');
  }

  const dokumentasi = await getDokumentasi(aduan.id);
  const dinasList = await getDinasList();

  return (
    <AduanDetailClient
      aduan={aduan}
      dokumentasi={dokumentasi}
      dinasList={dinasList}
      role={role}
      profileDinasId={profile.dinas_id}
    />
  );
}