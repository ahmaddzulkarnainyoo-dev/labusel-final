// app/dashboard/reports/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Dinas {
  id: string;
  nama: string;
}

interface Report {
  id: string;
  title: string;
  content: string;
  type: string;
  attachment_url: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [reports, setReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filterDinas = searchParams.get('dinas') || '';
  const filterStatus = searchParams.get('status') || '';
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
      const { data } = await supabase
        .from('dinas')
        .select('id, nama')
        .order('nama');
      if (data) setDinasList(data);
    };
    fetchDinas();
  }, [supabase]);

  // Fetch reports with filters
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch all reports first for total count
      const { data: allData } = await supabase
        .from('reports')
        .select(`
          *,
          profiles:created_by (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      setAllReports(allData || []);

      // Apply filters
      let query = supabase
        .from('reports')
        .select(`
          *,
          profiles:created_by (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by dinas: join profiles and filter by dinas_id
      if (filterDinas) {
        // First get user IDs that belong to this dinas
        const { data: usersInDinas } = await supabase
          .from('profiles')
          .select('id')
          .eq('dinas_id', filterDinas);

        if (usersInDinas && usersInDinas.length > 0) {
          const userIds = usersInDinas.map((u) => u.id);
          query = query.in('created_by', userIds);
        } else {
          query = query.in('created_by', ['__none__']);
        }
      }

      // Filter by status
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      // Filter by date
      if (filterTanggal) {
        query = query.eq('created_at', filterTanggal);
      }

      // Search by title or content
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching reports:', error);
      } else {
        setReports(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase, filterDinas, filterStatus, filterTanggal, searchQuery]);

  const filteredCount = reports.length;
  const totalCount = allReports.length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laporan Masuk</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Semua laporan dari Kepala Dinas dan Staf.
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
        >
          {showFilters ? 'Tutup Filter' : 'Filter'}
        </button>
      </div>

      {/* Filter Section - Desktop always visible, Mobile toggleable */}
      <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 sm:mb-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
        <div className="flex flex-col gap-3">
          {/* Filter Dinas */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Dinas</label>
            <select
              value={filterDinas}
              onChange={(e) => updateFilter('dinas', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Dinas</option>
              {dinasList.map((d) => (
                <option key={d.id} value={d.id}>{d.nama}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Semua Status</option>
              <option value="unread">Belum Dibaca</option>
              <option value="read">Sudah Dibaca</option>
            </select>
          </div>

          {/* Filter Tanggal */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => updateFilter('tanggal', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Search */}
          <div>
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
                placeholder="Cari judul atau konten..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            Reset Filter
          </button>
        </div>

        {/* Result count */}
        <div className="mt-3 text-xs sm:text-sm text-gray-500">
          Menampilkan {filteredCount} dari {totalCount} laporan
          {(filterDinas || filterStatus || filterTanggal || searchQuery) && ' (difilter)'}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <a
          href={`/api/reports/export?format=pdf&dinas=${filterDinas}&status=${filterStatus}&tanggal=${filterTanggal}&search=${searchQuery}`}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </a>
        <a
          href={`/api/reports/export?format=excel&dinas=${filterDinas}&status=${filterStatus}&tanggal=${filterTanggal}&search=${searchQuery}`}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Export Excel
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-start mb-2 sm:mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{report.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Oleh: {report.profiles?.full_name || 'Unknown'} •{' '}
                    {new Date(report.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  report.status === 'read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status === 'read' ? 'Sudah Dibaca' : 'Belum Dibaca'}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">{report.content}</p>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {report.attachment_url && (
                  <a
                    href={report.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📎 Lihat Lampiran
                  </a>
                )}
                <Link
                  href={`/dashboard/reports/${report.id}`}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Lihat Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-gray-500">Belum ada laporan masuk.</p>
        </div>
      )}
    </div>
  );
}