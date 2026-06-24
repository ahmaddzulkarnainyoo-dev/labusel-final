// app/dashboard/staf/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function StafDashboard() {
  const profile = await requireRole('staf');
  const supabase = createServerComponentClient();

  const userId = profile.id;

  // 1. Ambil semua laporan milik staf ini
  const { data: reportsRaw } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      status,
      created_at
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  const reports = reportsRaw as any[];
  const totalReports = reports?.length || 0;
  const unreadReports = reports?.filter((r) => r.status === 'unread').length || 0;
  const readReports = reports?.filter((r) => r.status === 'read').length || 0;

  // 2. Grafik laporan per bulan (6 bulan terakhir)
  const monthMap = new Map();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    monthMap.set(key, { label, count: 0 });
  }

  reports?.forEach((report) => {
    const d = new Date(report.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap.has(key)) {
      monthMap.get(key).count += 1;
    }
  });

  const monthStats = Array.from(monthMap.values());
  const maxCount = Math.max(...monthStats.map((m) => m.count), 1);

  // 3. Laporan terbaru (5)
  const latestReports = reports?.slice(0, 5) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900">Selamat Datang, Staf</h2>
      <p className="text-gray-500 mb-8">Dashboard laporan Anda.</p>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Laporan</p>
              <p className="text-3xl font-bold text-gray-900">{totalReports}</p>
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
              <p className="text-sm text-gray-500">Belum Dibaca</p>
              <p className="text-3xl font-bold text-orange-600">{unreadReports}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sudah Dibaca</p>
              <p className="text-3xl font-bold text-green-600">{readReports}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grafik Laporan per Bulan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Laporan per Bulan
          </h3>
          {totalReports > 0 ? (
            <div className="space-y-3">
              {monthStats.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.count} laporan</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada laporan.</p>
          )}
        </div>

        {/* Laporan Terbaru */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📋 Laporan Terbaru</h3>
            <Link href="/dashboard/reports" className="text-sm text-blue-600 hover:underline">
              Lihat semua →
            </Link>
          </div>
          {latestReports.length > 0 ? (
            <div className="space-y-3">
              {latestReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/reports/${report.id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {report.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status === 'read' ? 'Dibaca' : 'Baru'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada laporan.</p>
          )}
        </div>
      </div>
    </div>
  );
}