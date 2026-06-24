// app/dashboard/aduan/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Aduan {
  id: string;
  kode_tiket: string;
  nama_pengadu: string;
  kategori: string;
  status: string;
  created_at: string;
}

export default function DashboardAduanPage() {
  const [aduanList, setAduanList] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    kategori: '',
  });

  useEffect(() => {
    fetchAduan();
  }, []);

  async function fetchAduan() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, dinas_id')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'gubernur' && profile.role !== 'kepala_dinas')) {
      redirect('/dashboard');
      return;
    }

    let query = supabase
      .from('aduan')
      .select('*')
      .order('created_at', { ascending: false });

    if (profile.role === 'kepala_dinas' && profile.dinas_id) {
      query = query.eq('dinas_terkait', profile.dinas_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.kategori) {
      query = query.eq('kategori', filters.kategori);
    }

    const { data } = await query;
    setAduanList(data || []);
    setLoading(false);
  }

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

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    setLoading(true);
    fetchAduan();
  }

  function resetFilters() {
    setFilters({ status: '', kategori: '' });
    setLoading(true);
    fetchAduan();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daftar Aduan Masyarakat</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Total: {aduanList.length} aduan
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
        >
          {showFilters ? 'Tutup Filter' : 'Filter'}
        </button>
      </div>

      {/* Filters - Desktop always visible, Mobile toggleable */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
        <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="Baru">Baru</option>
              <option value="Diproses">Diproses</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
            <select
              value={filters.kategori}
              onChange={(e) => handleFilterChange('kategori', e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Terapkan
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 sm:flex-none px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Content - Cards on mobile, Table on desktop */}
      {aduanList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">Belum ada aduan</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {aduanList.map((aduan) => (
              <Link
                key={aduan.id}
                href={`/dashboard/aduan/${aduan.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 active:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-medium text-blue-600">{aduan.kode_tiket}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(aduan.status)}`}>
                    {aduan.status}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">{aduan.nama_pengadu}</h3>
                <p className="text-xs text-gray-500 mb-1">{aduan.kategori}</p>
                <p className="text-xs text-gray-400">{formatDate(aduan.created_at)}</p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-blue-600 font-medium">Lihat Detail →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Kode Tiket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Pengadu</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {aduanList.map((aduan) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}