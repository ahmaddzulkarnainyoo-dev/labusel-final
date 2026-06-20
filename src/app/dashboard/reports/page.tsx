// app/dashboard/reports/page.tsx
import { requireRole } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ReportsPage() {
  await requireRole('gubernur');
  const supabase = createServerComponentClient();

  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      *,
      profiles:created_by (
        full_name,
        role
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reports:', error);
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Laporan Masuk</h1>
      <p className="text-gray-600 mb-8">
        Semua laporan dari Kepala Dinas dan Staf.
      </p>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  report.status === 'read' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status === 'read' ? 'Sudah Dibaca' : 'Belum Dibaca'}
                </span>
              </div>
              <p className="mt-3 text-gray-700 line-clamp-3">{report.content}</p>
              <div className="mt-4 flex gap-3">
                {report.attachment_url && (
                  <a
                    href={report.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    📎 Lihat Lampiran
                  </a>
                )}
                <Link
                  href={`/dashboard/reports/${report.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Lihat Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada laporan masuk.</p>
        </div>
      )}
    </div>
  );
}