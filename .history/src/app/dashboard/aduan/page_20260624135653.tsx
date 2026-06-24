// app/dashboard/aduan/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

async function getAduan(role: string, dinasId: string | null, searchParams: Record<string, string>) {
  const supabase = createServerComponentClient();

  let query = supabase
    .from('aduan')
    .select('*')
    .order('created_at', { ascending: false });

  if (role === 'kepala_dinas' && dinasId) {
    query = query.eq('dinas_terkait', dinasId);
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }
  if (searchParams.kategori) {
    query = query.eq('kategori', searchParams.kategori);
  }
  if (searchParams.tanggal_mulai) {
    query = query.gte('created_at', searchParams.tanggal_mulai);
  }
  if (searchParams.tanggal_selesai) {
    query = query.lte('created_at', searchParams.tanggal_selesai);
  }

  const { data } = await query;
  return data || [];
}

export default async function DashboardAduanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const profile = await getProfile();
  if (!profile) redirect('/login');

  const role = profile.role;
  if (role !== 'gubernur' && role !== 'kepala_dinas') {
    redirect('/dashboard');
  }

  const resolvedParams = await searchParams;
  const aduanList = await getAduan(role, profile.dinas_id, resolvedParams);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      'Baru': 'bg-yellow-100 text-yellow-800',
      'Diproses': 'bg-blue-100 text-blue-800',
      'Selesai': 'bg-green-100 text-green-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daftar Aduan Masyarakat</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {aduanList.length} aduan
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              defaultValue={resolvedParams.status || ''}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set('status', e.target.value);
                else url.searchParams.delete('status');
                window.location.href = url.toString();
              }}
            >
              <option value="">Semua Status</option>
              <option value="Baru">Baru</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
            <select
              name="kategori"
              defaultValue={resolvedParams.kategori || ''}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set('kategori', e.target.value);
                else url.searchParams.delete('kategori');
                window.location.href = url.toString();
              }}
            >
              <option value="">Semua Kategori</option>
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Pelayanan Publik">Pelayanan Publik</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Lingkungan">Lingkungan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {Object.keys(resolvedParams).length > 0 && (
            <div>
              <Link
                href="/dashboard/aduan"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 inline-block"
              >
                Hapus Filter
              </Link>
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Tiket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pengadu</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {aduanList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Belum ada aduan</p>
                  </td>
                </tr>
              ) : (
                aduanList.map((aduan: any) => (
                  <tr key={aduan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-blue-600">{aduan.kode_tiket}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{aduan.nama_pengadu}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{aduan.kategori}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(aduan.status)}`}>
                        {aduan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(aduan.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/aduan/${aduan.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Lihat Detail
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}