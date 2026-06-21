// app/dashboard/kepala-dinas/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function KepalaDinasDashboard() {
  const profile = await requireRole('kepala_dinas');
  const supabase = createServerComponentClient();

  const dinasId = profile.dinas_id;
  const kepalaDinasId = profile.id;

  // 1. Ambil semua staf di dinas yang sama (termasuk kepala dinas sendiri)
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('dinas_id', dinasId)
    .in('role', ['staf', 'kepala_dinas']);

  const staffIds = staff?.map((s) => s.id) || [];
  const totalStaff = staff?.length || 0;

  // 2. Ambil semua laporan dari staf di dinas ini
  const { data: reportsRaw } = await supabase
    .from('reports')
    .select(`
      id,
      title,
      status,
      created_at,
      profiles:created_by (
        full_name
      )
    `)
    .in('created_by', staffIds)
    .order('created_at', { ascending: false });

  const reports = reportsRaw as any[];
  const totalReports = reports?.length || 0;
  const unreadReports = reports?.filter((r) => r.status === 'unread').length || 0;
  const readReports = reports?.filter((r) => r.status === 'read').length || 0;

  // 3. Grafik laporan per staf
  const staffMap = new Map();
  reports?.forEach((report) => {
    const name = report.profiles?.full_name || 'Tidak Diketahui';
    staffMap.set(name, (staffMap.get(name) || 0) + 1);
  });
  const staffStats = Array.from(staffMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Laporan terbaru (5)
  const latestReports = reports?.slice(0, 5) || [];

  // 5. Nama dinas (dari profile)
  const dinasName = profile.dinas?.nama || 'Dinas Anda';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Selamat Datang, Kepala Dinas</h2>
      <p className="text-gray-500 mb-8">
        Dashboard untuk <span className="font-medium">{dinasName}</span>.
        {totalStaff > 0 && ` Total ${totalStaff} staf di dinas ini.`}
      </p>

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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staf</p>
              <p className="text-3xl font-bold text-purple-600">{totalStaff}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grafik Laporan per Staf */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📊 Laporan per Staf</h3>
          {staffStats.length > 0 ? (
            <div className="space-y-3">
              {staffStats.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-medium text-gray-900">{item.count} laporan</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.count / (staffStats[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Belum ada laporan dari staf.</p>
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
                        {report.profiles?.full_name || 'Staf'} • {new Date(report.created_at).toLocaleDateString('id-ID')}
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
            <p className="text-gray-500 text-sm">Belum ada laporan dari staf.</p>
          )}
        </div>
      </div>
    </div>
  );
}