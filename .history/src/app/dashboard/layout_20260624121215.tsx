// app/dashboard/layout.tsx
import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const role = profile.role;
  const roleLabel =
    role === 'gubernur' ? 'Bupati' :
    role === 'kepala_dinas' ? 'Kepala Dinas' :
    'Staf';

  const dashboardPath =
    role === 'gubernur' ? '/dashboard/gubernur' :
    role === 'kepala_dinas' ? '/dashboard/kepala-dinas' :
    '/dashboard/staf';

  // Tentukan path absensi berdasarkan role
  const absensiPath =
    role === 'gubernur' ? '/dashboard/absensi/gubernur' :
    role === 'kepala_dinas' ? '/dashboard/absensi/kepala-dinas' :
    '/dashboard/absensi/staf';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600">Labusel</span>
            <span className="text-sm text-gray-500">Gov</span>
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
            className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium"
          >
            Dashboard
          </Link>

          {/* Pengumuman - semua role */}
          <Link
            href="/dashboard/announcements"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Pengumuman
          </Link>

          {/* Menu untuk Gubernur */}
          {role === 'gubernur' && (
            <>
              <Link
                href="/dashboard/broadcast"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Broadcast
              </Link>
              <Link
                href="/dashboard/reports"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Laporan Masuk
              </Link>
              <Link
                href="/dashboard/users"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Kelola Pengguna
              </Link>
              <Link
                href="/dashboard/calendar-markers"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Atur Penanda Kalender
              </Link>
              <Link
                href="/dashboard/delegasi"
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
                href="/dashboard/reports/new"
                className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                Buat Laporan
              </Link>
              <Link
                href="/dashboard/calendar-markers"
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
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Buat Laporan
            </Link>
          )}

          {/* Absensi - semua role */}
          <Link
            href={absensiPath}
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Absensi
          </Link>

          {/* Laporan Absensi - hanya Gubernur */}
          {role === 'gubernur' && (
            <Link
              href="/dashboard/absensi/laporan"
              className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              Laporan Absensi
            </Link>
          )}

          {/* Profil - semua role */}
          <Link
            href="/dashboard/profile"
            className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
          >
            Profil
          </Link>

          {/* Logout */}
          <LogoutButton />
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <div className="text-sm text-gray-900">
            {profile.full_name || 'User'} • {roleLabel}
          </div>
        </header>
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
}