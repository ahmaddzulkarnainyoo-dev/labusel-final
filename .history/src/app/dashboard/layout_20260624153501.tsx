// app/dashboard/layout.tsx
'use client';

import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentProfile().then((p) => {
      setProfile(p);
      if (!p) redirect('/login');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const role = profile.role;
  const roleLabel =
    role === 'gubernur' ? 'Bupati' :
    role === 'kepala_dinas' ? 'Kepala Dinas' :
    'Staf';

  const dashboardPath =
    role === 'gubernur' ? '/dashboard/gubernur' :
    role === 'kepala_dinas' ? '/dashboard/kepala-dinas' :
    '/dashboard/staf';

  const absensiPath =
    role === 'gubernur' ? '/dashboard/absensi/gubernur' :
    role === 'kepala_dinas' ? '/dashboard/absensi/kepala-dinas' :
    '/dashboard/absensi/staf';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-blue-600">Labusel</span>
          <span className="text-sm text-gray-500">Gov</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky
        top-0 md:top-0
        left-0
        h-screen
        w-64
        bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        z-50 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">Labusel</span>
              <span className="text-sm text-gray-500">Gov</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-900">
            <span className="font-medium text-gray-900">{profile.full_name || 'User'}</span>
            <span className="block text-xs text-gray-600">{roleLabel}</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Dashboard */}
          <Link
            href={dashboardPath}
            onClick={() => setSidebarOpen(false)}
            className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium"
          >
            Dashboard
          </Link>

          {/* Pengumuman - semua role */}
          <Link
            href="/dashboard/announcements"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Pengumuman
          </Link>

          {/* Menu untuk Bupati */}
          {role === 'gubernur' && (
            <>
              <Link
                href="/dashboard/broadcast"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Broadcast
              </Link>
              <Link
                href="/dashboard/reports"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Laporan Masuk
              </Link>
              <Link
                href="/dashboard/aduan"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Aduan
              </Link>
              <Link
                href="/dashboard/dokumentasi"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Dokumentasi
              </Link>
              <Link
                href="/dashboard/users"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Kelola Pengguna
              </Link>
              <Link
                href="/dashboard/calendar-markers"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Atur Penanda Kalender
              </Link>
              <Link
                href="/dashboard/delegasi"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Delegasi
              </Link>
            </>
          )}

          {/* Menu untuk Kepala Dinas */}
          {role === 'kepala_dinas' && (
            <>
              <Link
                href="/dashboard/aduan"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Aduan
              </Link>
              <Link
                href="/dashboard/dokumentasi"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Dokumentasi
              </Link>
              <Link
                href="/dashboard/reports/new"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Buat Laporan
              </Link>
              <Link
                href="/dashboard/calendar-markers"
                onClick={() => setSidebarOpen(false)}
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Atur Penanda Kalender
              </Link>
            </>
          )}

          {/* Menu untuk Staf */}
          {role === 'staf' && (
            <Link
              href="/dashboard/reports/new"
              onClick={() => setSidebarOpen(false)}
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Buat Laporan
            </Link>
          )}

          {/* Absensi - semua role */}
          <Link
            href={absensiPath}
            onClick={() => setSidebarOpen(false)}
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Absensi
          </Link>

          {/* Laporan Absensi - hanya Bupati */}
          {role === 'gubernur' && (
            <Link
              href="/dashboard/absensi/laporan"
              onClick={() => setSidebarOpen(false)}
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Laporan Absensi
            </Link>
          )}

          {/* Profil - semua role */}
          <Link
            href="/dashboard/profile"
            onClick={() => setSidebarOpen(false)}
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Profil
          </Link>

          {/* Logout */}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main content */}
      <div className="md:ml-0">
        <header className="hidden md:block bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <div className="text-sm text-gray-900">
            {profile.full_name || 'User'} • {roleLabel}
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}