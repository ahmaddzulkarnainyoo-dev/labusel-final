// app/dashboard/staf/page.tsx
import { requireRole } from '@/lib/auth';
import Link from 'next/link';

export default async function StafDashboard() {
  await requireRole('staf');
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Selamat Datang, Staf</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Laporan Saya</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Aksi Cepat</h3>
        <div className="space-y-2">
          <Link href="/dashboard/reports/new" className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
            Buat Laporan Baru
          </Link>
        </div>
      </div>
    </div>
  );
}