// app/dashboard/gubernur/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function GubernurDashboard() {
  await requireRole('gubernur');
  const supabase = createServerComponentClient();

  // Statistik
  const { count: announcementsCount } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });
  const { count: reportsCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });
  const { count: aduanCount } = await supabase
    .from('aduan')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Selamat Datang, Gubernur</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pengumuman</p>
              <p className="text-3xl font-bold">{announcementsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Laporan Masuk</p>
              <p className="text-3xl font-bold">{reportsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aduan Masyarakat</p>
              <p className="text-3xl font-bold">{aduanCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Aksi Cepat</h3>
          <div className="space-y-2">
            <Link href="/dashboard/broadcast" className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              Kirim Pengumuman
            </Link>
            <Link href="/dashboard/reports" className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
              Lihat Laporan Terbaru
            </Link>
            <Link href="/dashboard/aduan" className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100">
              Kelola Aduan
            </Link>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Aktivitas Terbaru</h3>
          <p className="text-gray-500 text-sm">Belum ada aktivitas terbaru.</p>
        </div>
      </div>
    </div>
  );
}