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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Laporan Absensi</h1>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filter Dinas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dinas</label>
            <select
              value={filterDinas}
              onChange={(e) => updateFilter('dinas', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[160px]"
            >
              <option value="">Semua Dinas</option>
              {dinasList.map((d) => (
                <option key={d.id} value={d.id}>{d.nama}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[130px]"
            >
              <option value="">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
            </select>
          </div>

          {/* Filter User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <select
              value={filterUser}
              onChange={(e) => updateFilter('user', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[170px]"
            >
              <option value="">Semua User</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => updateFilter('tanggal', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pencarian</label>
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
                className="border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm w-[220px]"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Reset Filter
            </button>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-3 text-sm text-gray-500">
          Menampilkan {filteredCount} dari {totalCount} data absensi
          {(filterDinas || filterStatus || filterTanggal || filterUser || searchQuery) && ' (difilter)'}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : records.length === 0 ? (
        <p className="text-gray-500">Belum ada data absensi.</p>
      ) : (
        <div className="space-y-4">
          {records.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.profiles?.name || 'Tidak Diketahui'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.profiles?.dinas?.nama || 'Dinas tidak diketahui'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(item.check_in_time).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {item.latitude && item.longitude && (
                    <p className="text-xs text-gray-400">
                      📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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