// app/dashboard/gubernur/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function BupatiDashboard() {
  await requireRole('gubernur');
  const supabase = createServerComponentClient();

  // 1. Ambil semua laporan (pakai any untuk bypass TypeScript)
  const { data: reportsRaw } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      status,
      created_at,
      profiles:created_by (
        full_name,
        dinas_id,
        dinas:dinas_id (
          nama
        )
      )
    `)
    .order('created_at', { ascending: false });

  const reports = reportsRaw as any[];

  // 2. Ambil total pengumuman
  const { count: totalAnnouncements } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true });

  // 3. Ambil total aduan (pakai try-catch)
  let totalAduan = 0;
  try {
    const { count } = await supabase
      .from('aduan')
      .select('*', { count: 'exact', head: true });
    totalAduan = count || 0;
  } catch {
    totalAduan = 0;
  }

  // 4. Hitung statistik
  const totalReports = reports?.length || 0;
  const unreadReports = reports?.filter((r: any) => r.status === 'unread').length || 0;

  // 5. Group laporan per dinas
  const dinasMap = new Map();
  reports?.forEach((report: any) => {
    const dinasName = report.profiles?.dinas?.nama || 'Tidak Diketahui';
    dinasMap.set(dinasName, (dinasMap.get(dinasName) || 0) + 1);
  });
  const dinasStats = Array.from(dinasMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 6. Laporan terbaru (5)
  const latestReports = reports?.slice(0, 5) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900">Selamat Datang, Bupati</h2>
      <p className="text-gray-500 mb-2">Ringkasan kinerja dan laporan terbaru.</p>
      <p className="text-gray-500 mb-8">Dashboard ini menampilkan ringkasan aktivitas, laporan masuk, dan statistik kinerja. Gunakan menu di samping untuk mengakses fitur lainnya.</p>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <p className="text-sm text-gray-500">Pengumuman</p>
              <p className="text-3xl font-bold text-green-600">{totalAnnouncements || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aduan Masyarakat</p>
              <p className="text-3xl font-bold text-purple-600">{totalAduan}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grafik Laporan per Dinas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📊 Laporan per Dinas (Teratas)</h3>
          {dinasStats.length > 0 ? (
            <div className="space-y-3">
              {dinasStats.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-medium text-gray-900">{item.count} laporan</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.count / (dinasStats[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada data laporan.</p>
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
              {latestReports.map((report: any) => (
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
                        {report.profiles?.full_name || 'Unknown'} • {new Date(report.created_at).toLocaleDateString('id-ID')}
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
            <p className="text-gray-500 text-sm">Belum ada laporan masuk.</p>
          )}
        </div>
      </div>
    </div>
  );
}