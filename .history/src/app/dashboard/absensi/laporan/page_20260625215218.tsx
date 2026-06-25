// src/app/dashboard/absensi/laporan/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Dinas {
  id: string;
  nama: string;
}

interface UserProfile {
  id: string;
  name: string;
}

interface AbsensiRecord {
  id: string;
  check_in_time: string;
  tanggal: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  user_id: string;
  profiles: {
    name: string;
    role: string;
    dinas: {
      nama: string;
    };
  };
}

export default function LaporanAbsensiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [allRecords, setAllRecords] = useState<AbsensiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filterDinas = searchParams.get('dinas') || '';
  const filterStatus = searchParams.get('status') || '';
  const filterUser = searchParams.get('user') || '';
  const filterTanggal = searchParams.get('tanggal') || '';
  const searchQuery = searchParams.get('search') || '';

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const resetFilters = useCallback(() => {
    router.push('?');
  }, [router]);

  // Fetch dinas list
  useEffect(() => {
    const fetchDinas = async () => {
      const { data } = await supabase.from('dinas').select('id, nama').order('nama');
      if (data) setDinasList(data);
    };
    fetchDinas();
  }, [supabase]);

  // Fetch users list for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['kepala_dinas', 'staf'])
        .not('name', 'is', null)
        .order('name');
      if (data) setUsersList(data);
    };
    fetchUsers();
  }, [supabase]);

  // Fetch absensi records with filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all records for total count
      let allQuery = supabase
        .from('absensi')
        .select(`
          *,
          profiles:user_id (
            name,
            role,
            dinas:dinas_id (
              nama
            )
          )
        `)
        .order('check_in_time', { ascending: false });

      if (filterDinas) {
        allQuery = allQuery.eq('dinas_id', filterDinas);
      }

      const { data: allData } = await allQuery;
      setAllRecords(allData || []);

      // Apply all filters for the filtered results
      let query = supabase
        .from('absensi')
        .select(`
          *,
          profiles:user_id (
            name,
            role,
            dinas:dinas_id (
              nama
            )
          )
        `)
        .order('check_in_time', { ascending: false });

      // Filter by dinas
      if (filterDinas) {
        query = query.eq('dinas_id', filterDinas);
      }

      // Filter by status
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      // Filter by user
      if (filterUser) {
        query = query.eq('user_id', filterUser);
      }

      // Filter by date
      if (filterTanggal) {
        query = query.eq('tanggal', filterTanggal);
      }

      const { data, error } = await query;
      if (error) {
        alert('Gagal memuat data: ' + error.message);
      } else {
        let result = data || [];

        // Search filter (client-side because profiles is a nested relation)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(
            (item: AbsensiRecord) =>
              item.profiles?.name?.toLowerCase().includes(q) ||
              item.profiles?.dinas?.nama?.toLowerCase().includes(q)
          );
        }

        setRecords(result);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase, filterDinas, filterStatus, filterUser, filterTanggal, searchQuery]);

  const filteredCount = records.length;
  const totalCount = allRecords.length;

  const hasActiveFilters = filterDinas || filterStatus || filterUser || filterTanggal || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📋 Laporan Absensi</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Data absensi semua pegawai
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
        >
          {showFilters ? 'Tutup Filter' : 'Filter'}
          {hasActiveFilters && !showFilters && (
            <span className="ml-1.5 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
          )}
        </button>
      </div>

      {/* Filter Section - Desktop always visible, Mobile toggleable */}
      <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
          {/* Filter Dinas */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Dinas</label>
            <select
              value={filterDinas}
              onChange={(e) => updateFilter('dinas', e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Dinas</option>
              {dinasList.map((d) => (
                <option key={d.id} value={d.id}>{d.nama}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[130px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
            </select>
          </div>

          {/* Filter User */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
            <select
              value={filterUser}
              onChange={(e) => updateFilter('user', e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[170px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua User</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => updateFilter('tanggal', e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Search */}
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">Pencarian</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Cari nama atau dinas..."
                className="w-full sm:w-auto border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="hidden sm:block">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Reset Filter
            </button>
          </div>

          {/* Export Excel Button */}
          <div className="hidden sm:block">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (filterDinas) params.set('dinas', filterDinas);
                if (filterStatus) params.set('status', filterStatus);
                if (filterUser) params.set('user', filterUser);
                if (filterTanggal) params.set('tanggal', filterTanggal);
                if (searchQuery) params.set('search', searchQuery);
                params.set('format', 'excel');
                window.open(`/api/absensi/export?${params.toString()}`, '_blank');
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {/* Mobile action buttons */}
        <div className="flex gap-2 mt-3 sm:hidden">
          <button
            onClick={resetFilters}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            Reset Filter
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams();
              if (filterDinas) params.set('dinas', filterDinas);
              if (filterStatus) params.set('status', filterStatus);
              if (filterUser) params.set('user', filterUser);
              if (filterTanggal) params.set('tanggal', filterTanggal);
              if (searchQuery) params.set('search', searchQuery);
              params.set('format', 'excel');
              window.open(`/api/absensi/export?${params.toString()}`, '_blank');
            }}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Export Excel
          </button>
        </div>

        {/* Result count */}
        <div className="mt-3 text-xs sm:text-sm text-gray-500">
          Menampilkan {filteredCount} dari {totalCount} data absensi
          {hasActiveFilters && ' (difilter)'}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Memuat...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-gray-500">Belum ada data absensi.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {records.map((item) => (
            <div key={item.id} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {item.profiles?.name || 'Tidak Diketahui'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {item.profiles?.dinas?.nama || 'Dinas tidak diketahui'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.check_in_time).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {item.latitude && item.longitude && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  item.status === 'hadir' ? 'bg-green-100 text-green-800' :
                  item.status === 'izin' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'sakit' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status === 'hadir' ? 'Hadir' :
                   item.status === 'izin' ? 'Izin' :
                   item.status === 'sakit' ? 'Sakit' :
                   item.status}
                </span>
              </div>
              {item.photo_url && (
                <img
                  src={item.photo_url}
                  alt="Foto absen"
                  className="mt-2 w-16 h-16 rounded-lg object-cover border border-gray-200"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}