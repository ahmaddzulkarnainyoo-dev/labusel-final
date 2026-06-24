// app/dashboard/announcements/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Dinas {
  id: string;
  nama: string;
}

interface Announcement {
  id: string;
  title: string;
  isi: string;
  target_dinas_id: string[] | null;
  created_at: string;
  profiles: {
    name: string;
  };
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const filterDinas = searchParams.get('dinas') || '';
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

  // Fetch profile and dinas list
  useEffect(() => {
    const fetchInitialData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (prof) setProfile(prof);

      // Get dinas list
      const { data: dinas } = await supabase
        .from('dinas')
        .select('id, nama')
        .order('nama');
      if (dinas) setDinasList(dinas);
    };
    fetchInitialData();
  }, [supabase, router]);

  // Fetch announcements with filters
  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      setLoading(true);

      let query = supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Role-based filtering for announcements visibility
      if (profile.role === 'kepala_dinas' || profile.role === 'staf') {
        // Only show announcements targeting their dinas or all dinas
        query = query.or(`target_dinas_id.cs.{${profile.dinas_id}},target_dinas_id.is.null`);
      }

      const { data: allData, error } = await query;
      if (error) {
        console.error('Error fetching announcements:', error);
      } else {
        setAllAnnouncements(allData || []);
      }

      // Apply additional filters
      let filteredQuery = supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Role-based filtering for announcements visibility
      if (profile.role === 'kepala_dinas' || profile.role === 'staf') {
        filteredQuery = filteredQuery.or(`target_dinas_id.cs.{${profile.dinas_id}},target_dinas_id.is.null`);
      }

      // Filter by target dinas (for bupati)
      if (filterDinas) {
        if (filterDinas === 'all') {
          filteredQuery = filteredQuery.is('target_dinas_id', null);
        } else if (filterDinas === 'specific') {
          filteredQuery = filteredQuery.not('target_dinas_id', 'is', null);
        } else {
          filteredQuery = filteredQuery.contains('target_dinas_id', [filterDinas]);
        }
      }

      // Filter by date
      if (filterTanggal) {
        filteredQuery = filteredQuery.eq('created_at', filterTanggal);
      }

      // Search by title or isi
      if (searchQuery) {
        filteredQuery = filteredQuery.or(`title.ilike.%${searchQuery}%,isi.ilike.%${searchQuery}%`);
      }

      const { data: filteredData } = await filteredQuery;
      setAnnouncements(filteredData || []);
      setLoading(false);
    };

    fetchData();
  }, [supabase, profile, filterDinas, filterTanggal, searchQuery]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  const filteredCount = announcements.length;
  const totalCount = allAnnouncements.length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
          <p className="text-gray-600 mt-1">
            Semua pengumuman dari Bupati Labuhanbatu Selatan
          </p>
        </div>
        {profile.role === 'gubernur' && (
          <Link
            href="/dashboard/broadcast"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            + Kirim Pengumuman
          </Link>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-end">
          {/* Filter Dinas (only for bupati) */}
          {profile.role === 'gubernur' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Dinas</label>
              <select
                value={filterDinas}
                onChange={(e) => updateFilter('dinas', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[170px]"
              >
                <option value="">Semua</option>
                <option value="all">Semua Dinas (tanpa target)</option>
                <option value="specific">Dinas Tertentu</option>
                {dinasList.map((d) => (
                  <option key={d.id} value={d.id}>{d.nama}</option>
                ))}
              </select>
            </div>
          )}

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
                placeholder="Cari judul atau isi..."
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
          Menampilkan {filteredCount} dari {totalCount} pengumuman
          {(filterDinas || filterTanggal || searchQuery) && ' (difilter)'}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>
                    Oleh: {announcement.profiles?.name || 'Bupati'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {announcement.target_dinas_id && announcement.target_dinas_id.length > 0 ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full ml-2 whitespace-nowrap">
                    Target Dinas
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full ml-2 whitespace-nowrap">
                    Semua Dinas
                  </span>
                )}
              </div>

              <div className="mt-4 prose prose-sm max-w-none text-gray-700">
                <p className="whitespace-pre-wrap">{announcement.isi}</p>
              </div>

              {announcement.target_dinas_id && announcement.target_dinas_id.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {announcement.target_dinas_id.map((id: string) => {
                    const dinas = dinasList.find((d) => d.id === id);
                    return (
                      <span
                        key={id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {dinas?.nama || id.substring(0, 8) + '...'}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada pengumuman.</p>
          {profile.role === 'gubernur' && (
            <Link
              href="/dashboard/broadcast"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Kirim Pengumuman Pertama
            </Link>
          )}
        </div>
      )}
    </div>
  );
}