// app/dashboard/kepala-dinas/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function KepalaDinasDashboard() {
  await requireRole('kepala_dinas');
  const supabase = createServerComponentClient();

  const { count: reportsCount } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Selamat Datang, Kepala Dinas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Laporan</p>
              <p className="text-3xl font-bold">{reportsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Laporan Baru</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Aksi Cepat</h3>
          <div className="space-y-2">
            <Link href="/dashboard/reports/new" className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
              Buat Laporan Baru
            </Link>
            <Link href="/dashboard/reports" className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
              Lihat Semua Laporan
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