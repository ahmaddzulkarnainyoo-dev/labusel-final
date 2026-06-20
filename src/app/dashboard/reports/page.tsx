import { createServerComponentClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import Link from 'next/link'

export default async function ReportsPage() {
  const profile = await getCurrentProfile()
  if (!profile) return <div>Loading...</div>

  const supabase = createServerComponentClient()

  // Ambil laporan berdasarkan role
  let query = supabase.from('reports').select('*, dinas:nama, profiles:full_name')
  if (profile.role === 'kepala_dinas') {
    query = query.eq('dinas_id', profile.dinas_id)
  }
  // Staf hanya bisa lihat laporan sendiri (nanti di filter di client atau query)
  if (profile.role === 'staf') {
    query = query.eq('created_by', profile.id)
  }
  // Gubernur lihat semua

  const { data: reports, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return <div className="text-red-600">Gagal mengambil data laporan</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Laporan</h1>
        {(profile.role === 'kepala_dinas' || profile.role === 'staf') && (
          <Link
            href="/dashboard/reports/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Buat Laporan
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {reports && reports.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dinas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{report.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.dinas?.nama || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'pending' ? 'Pending' :
                       report.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(report.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-800">
                    <Link href={`/dashboard/reports/${report.id}`}>Lihat</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Belum ada laporan.
            {(profile.role === 'kepala_dinas' || profile.role === 'staf') && (
              <div className="mt-2">
                <Link href="/dashboard/reports/new" className="text-blue-600 hover:underline">
                  Buat laporan pertama
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}