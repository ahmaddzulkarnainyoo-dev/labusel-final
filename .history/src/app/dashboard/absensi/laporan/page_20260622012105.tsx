// src/app/dashboard/absensi/laporan/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AbsensiRecord {
  id: string;
  check_in_time: string;
  tanggal: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  profiles: {
    name: string;
    role: string;
    dinas: {
      nama: string;
    };
  };
}

export default function LaporanAbsensiPage() {
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDinas, setFilterDinas] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [dinasList, setDinasList] = useState<{ id: string; nama: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchDinas = async () => {
      const { data } = await supabase.from('dinas').select('id, nama').order('nama');
      if (data) setDinasList(data);
    };
    fetchDinas();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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

    if (filterDinas) {
      query = query.eq('dinas_id', filterDinas);
    }
    if (filterTanggal) {
      query = query.eq('tanggal', filterTanggal);
    }

    const { data, error } = await query;
    if (error) {
      alert('Gagal memuat data: ' + error.message);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filterDinas, filterTanggal]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 Laporan Absensi</h1>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dinas</label>
          <select
            value={filterDinas}
            onChange={(e) => setFilterDinas(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Dinas</option>
            {dinasList.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
          <input
            type="date"
            value={filterTanggal}
            onChange={(e) => setFilterTanggal(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => {
            setFilterDinas('');
            setFilterTanggal('');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Reset Filter
        </button>
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
                  item.status === 'hadir' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
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